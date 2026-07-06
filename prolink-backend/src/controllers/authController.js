const authService = require('../services/authService');
const prisma = require('../config/prisma');

const register = async (req, res) => {
  try {
    const { email, password, user_type, full_name, phone_number, state, city, gender } = req.body;
    const { user, token } = await authService.registerUser({ email, password, user_type, full_name, phone_number, state, city, gender });
    
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(201).json({ message: "User created successfully!", user, token });
  } catch (err) {
    if (err.message === 'Email is already registered.') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'Phone number is already registered.') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // We no longer block login for unverified users here.
    // They will have limited access based on requireVerified middleware.
    
    const token = await authService.loginUser({ email, password });
    
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ token });
  } catch (err) {
    if (err.message === 'Invalid Credentials') {
      return res.status(401).json({ error: err.message });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const verify = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await prisma.user.findFirst({
      where: {
        otp_code: token,
        otp_expires_at: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        otp_code: null,
        otp_expires_at: null
      }
    });

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resendVerification = async (req, res) => {
  try {
    // Requires authMiddleware to know who is requesting
    const userId = req.user.id;
    await authService.resendVerificationOTP(userId);
    res.json({ message: 'Verification OTP sent' });
  } catch (err) {
    if (err.message === 'User is already verified') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    await authService.forgotPassword(email);
    // Always return success even if email not found for security
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    
    await authService.resetPassword(token, password);
    res.json({ message: 'Password has been successfully reset' });
  } catch (err) {
    if (err.message === 'Invalid or expired token') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'You cannot reuse a recently used password.') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const logout = async (req, res) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    expires: new Date(0) // Expire immediately
  });
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, logout, verify, resendVerification, forgotPassword, resetPassword };