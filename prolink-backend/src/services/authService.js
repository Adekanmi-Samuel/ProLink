const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const emailService = require('./emailService');
const smsService = require('./smsService');

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const normalizePhone = (phone) => {
  if (!phone) return null;
  // If it starts with 0 (e.g. 080), replace with +234
  if (phone.startsWith('0')) {
    return '+234' + phone.substring(1);
  }
  // Ensure it starts with +234
  if (!phone.startsWith('+234')) {
    return '+234' + phone;
  }
  return phone;
};

const registerUser = async ({ email, password, user_type, full_name, phone_number, state, city, gender }) => {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new Error('Email is already registered.');

  const normalizedPhone = normalizePhone(phone_number);
  if (normalizedPhone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone_number: normalizedPhone } });
    if (existingPhone) throw new Error('Phone number is already registered.');
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);
  
  const otp_code = generateOTP();
  const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
  
  const member_id = 'PRL-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  const newUser = await prisma.user.create({
    data: { 
      email, 
      password_hash, 
      user_type,
      phone_number: normalizedPhone,
      otp_code,
      otp_expires_at,
      member_id,
      email_verified: process.env.NODE_ENV === 'development' ? true : false
    },
    select: { id: true, email: true, phone_number: true, user_type: true, token_version: true },
  });

  // Every user gets an empty profile row created alongside them
  await prisma.profile.create({
    data: { user_id: newUser.id, full_name, state: state || 'Lagos', city, gender },
  });
  
  // Fire and forget - don't block registration if email fails
  emailService.sendVerificationOTP(email, otp_code).catch(emailErr => {
    console.error('[WARN] Failed to send OTP email, but user was created:', emailErr.message);
  });

  const token = jwt.sign(
    { user: { id: newUser.id, user_type: newUser.user_type, token_version: newUser.token_version } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Store initial password hash in history
  await prisma.user.update({
    where: { id: newUser.id },
    data: { previous_passwords: [password_hash] }
  });

  return { user: newUser, token };
};

const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  // Check lockout
  if (user.locked_until && user.locked_until > new Date()) {
    throw new Error('Account temporarily locked. Please try again later.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    // Increment failed attempts
    const attempts = user.failed_login_attempts + 1;
    let locked_until = null;
    if (attempts >= 5) {
      locked_until = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 mins
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_attempts: attempts, locked_until }
    });
    if (locked_until) {
      throw new Error('Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.');
    }
    throw new Error('Invalid email or password');
  }

  // Reset failed attempts on success
  if (user.failed_login_attempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_attempts: 0, locked_until: null }
    });
  }

  const token = jwt.sign(
    { user: { id: user.id, user_type: user.user_type, token_version: user.token_version } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
};

const resendVerificationOTP = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.email_verified) throw new Error('User is already verified');

  const otp_code = generateOTP();
  const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await prisma.user.update({
    where: { id: userId },
    data: { otp_code, otp_expires_at }
  });

  // Fire and forget
  emailService.sendVerificationOTP(user.email, otp_code).catch(emailErr => {
    console.error('[WARN] Failed to resend OTP email:', emailErr.message);
  });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Prevent user enumeration by returning silently

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_token: hashedToken,
      reset_token_expires: expiresAt
    }
  });

  await emailService.sendPasswordReset(user.email, resetToken);
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await prisma.user.findFirst({
    where: {
      reset_token: hashedToken,
      reset_token_expires: { gt: new Date() }
    }
  });

  if (!user) throw new Error('Invalid or expired token');

  // Check if the new password was used before (compare against previous_passwords)
  const previousPasswords = (user.previous_passwords || []) ;
  for (const oldHash of previousPasswords) {
    const isMatch = await bcrypt.compare(newPassword, oldHash);
    if (isMatch) throw new Error('You cannot reuse a recently used password.');
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(newPassword, salt);

  // Add the current password hash to history, keep last 5
  const updatedHistory = [...previousPasswords, user.password_hash].slice(-5);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash,
      previous_passwords: updatedHistory,
      reset_token: null,
      reset_token_expires: null,
      token_version: { increment: 1 } // Invalidate old tokens
    }
  });
};

const logoutUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { token_version: { increment: 1 } }
  });
};

module.exports = { registerUser, loginUser, resendVerificationOTP, forgotPassword, resetPassword, logoutUser };
