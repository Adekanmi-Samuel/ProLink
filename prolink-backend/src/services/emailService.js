const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Retry helper with exponential backoff
const fetchWithRetry = async (url, options, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout (was 5s — too short for SMTP through localhost)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      logger.warn(`Email API request failed, retrying in ${delay}ms`, {
        attempt,
        error: err.message,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Native Nodemailer integration
async function sendNativeEmail(toEmail, subject, text, html, isNotification = false, attachments = undefined) {
  try {
    const useNotificationAccount = isNotification === true;
    const smtpUser = useNotificationAccount
      ? process.env.SMTP_NOTIFICATIONS_USER
      : process.env.SMTP_USER;
    const smtpPass = useNotificationAccount
      ? process.env.SMTP_NOTIFICATIONS_PASS
      : process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      logger.error('SMTP credentials are not configured in backend environment variables.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"ProLink" <${smtpUser}>`,
      to: toEmail,
      subject,
      text,
      html,
      attachments,
    });

    logger.info('Email sent successfully directly via nodemailer', { recipient: toEmail, messageId: info.messageId });
  } catch (err) {
    logger.error('Email API native network error', {
      error: err.message,
      recipient: toEmail,
    });
  }
}

const sendVerificationEmail = async (toEmail, token) => {
  const verificationUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    subject: 'Verify Your Email',
    text: `Please verify your email by clicking: ${verificationUrl}`,
    html: `
      <h2>Welcome to ProLink!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `
  };

  await sendNativeEmail(toEmail, mailOptions.subject, mailOptions.text, mailOptions.html, false);
};

const sendVerificationOTP = async (toEmail, otp_code) => {
  const mailOptions = {
    subject: 'ProLink Verification Code',
    text: `Your verification code is: ${otp_code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to ProLink!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #6366f1; letter-spacing: 5px;">${otp_code}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  await sendNativeEmail(toEmail, mailOptions.subject, mailOptions.text, mailOptions.html, false);
};

const sendNotificationEmail = async (toEmail, subject, text, html) => {
  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendChatMessageNotification = async (toEmail, senderName, messageContent, threadId) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const chatUrl = `${frontendUrl}/chat/${threadId}`;
  
  const subject = `New message from ${senderName} on ProLink`;
  const text = `${senderName} sent you a message: "${messageContent}"\nReply here: ${chatUrl}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New message on ProLink</h2>
      <p><strong>${senderName}</strong> sent you a message:</p>
      <blockquote style="border-left: 4px solid #4f46e5; margin: 10px 0; padding-left: 10px; color: #555; font-style: italic;">
        "${messageContent}"
      </blockquote>
      <a href="${chatUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reply in Chat</a>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};
const sendPasswordReset = async (toEmail, token) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  
  const subject = 'ProLink - Reset Your Password';
  const text = `Click the following link to reset your password: ${resetUrl}\nThis link will expire in 1 hour.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Reset Your ProLink Password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">Reset Password</a>
      <p style="color: #666; font-size: 0.9em;">If you did not request this, you can safely ignore this email. The link will expire in 1 hour.</p>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, false);
};

const sendDisputeEmail = async (toEmail, disputeId, role, action) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const disputeUrl = `${frontendUrl}/dashboard`;
  
  let subject = '';
  let text = '';
  let html = '';

  if (action === 'created') {
    subject = `A dispute has been opened for your project (ID: ${disputeId})`;
    text = `A dispute (ID: ${disputeId}) has been opened. Please log in to ProLink to review and respond.`;
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Dispute Opened</h2>
        <p>A dispute (ID: ${disputeId}) has been opened regarding one of your active projects.</p>
        <p>Please log in to your ProLink dashboard to review the details and respond as soon as possible.</p>
        <a href="${disputeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 5px;">View Dashboard</a>
      </div>
    `;
  } else if (action === 'resolved') {
    subject = `Dispute Resolved (ID: ${disputeId})`;
    text = `The dispute (ID: ${disputeId}) has been resolved by an administrator. Please log in to see the outcome.`;
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Dispute Resolved</h2>
        <p>The dispute (ID: ${disputeId}) has been reviewed and resolved by a ProLink administrator.</p>
        <p>Please log in to your ProLink dashboard to view the final resolution.</p>
        <a href="${disputeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 5px;">View Dashboard</a>
      </div>
    `;
  }

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendReportEmail = async (toEmail, targetName, reason) => {
  const subject = `Confirmation: User Report Submitted`;
  const text = `You have successfully reported ${targetName} for: ${reason}. Our moderation team will review this shortly.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Report Submitted</h2>
      <p>Thank you for helping keep ProLink safe.</p>
      <p>We have received your report regarding <strong>${targetName}</strong> for the following reason:</p>
      <blockquote style="border-left: 4px solid #f59e0b; margin: 10px 0; padding-left: 10px; color: #555; font-style: italic;">
        ${reason}
      </blockquote>
      <p>Our Trust & Safety team will review the report and take appropriate action. You may not receive a follow-up detailing the specific outcome due to privacy reasons.</p>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendBlockEmail = async (toEmail, blockedName) => {
  const subject = `Confirmation: User Blocked`;
  const text = `You have successfully blocked ${blockedName}. They will no longer be able to message you or apply to your jobs.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>User Blocked</h2>
      <p>You have successfully blocked <strong>${blockedName}</strong>.</p>
      <p>They will no longer be able to send you messages or interact with your job postings.</p>
      <p>If you made a mistake, you can unblock them from your account settings.</p>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendHiredEmail = async (toEmail, jobTitle, clientName) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const contractsUrl = `${frontendUrl}/dashboard/contracts`;
  
  const subject = `Congratulations! You've been hired for "${jobTitle}"`;
  const text = `Great news! ${clientName} has hired you for the job: "${jobTitle}". Please log in to ProLink to review the contract.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>You're Hired! 🎉</h2>
      <p>Great news! <strong>${clientName}</strong> has accepted your proposal and hired you for the job:</p>
      <h3 style="color: #4f46e5;">${jobTitle}</h3>
      <p>Please log in to your ProLink dashboard to review the contract details, check for funded milestones, and begin work.</p>
      <a href="${contractsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 5px;">View Contract</a>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendJobSubmittedEmail = async (toEmail, jobTitle, providerName) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const dashboardUrl = `${frontendUrl}/dashboard`;
  
  const subject = `Work Submitted: ${providerName} has submitted work for "${jobTitle}"`;
  const text = `${providerName} has submitted work for milestone/job "${jobTitle}". Please log in to review and approve the release of funds.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Work Submitted for Review</h2>
      <p><strong>${providerName}</strong> has submitted their work for the job/milestone:</p>
      <h3 style="color: #4f46e5;">${jobTitle}</h3>
      <p>Please log in to ProLink to review the submitted work. If everything looks good, you can approve the milestone to release the funds from Escrow.</p>
      <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 5px;">Review Work</a>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendFundsApprovedEmail = async (toEmail, jobTitle, amount) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const walletUrl = `${frontendUrl}/dashboard/wallet`;
  
  const subject = `Funds Approved! ₦${amount} released for "${jobTitle}"`;
  const text = `Great job! Your client has approved the work for "${jobTitle}" and released ₦${amount} from Escrow to your wallet.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Funds Approved! 💸</h2>
      <p>Excellent work! The client has approved your submission for the job:</p>
      <h3 style="color: #4f46e5;">${jobTitle}</h3>
      <p><strong>₦${amount}</strong> has been released from Escrow and added to your ProLink Wallet. It is now available for withdrawal.</p>
      <a href="${walletUrl}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 5px;">View Wallet</a>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendRevisionRequestedEmail = async (toEmail, jobTitle, notes) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const dashboardUrl = `${frontendUrl}/dashboard`;
  
  const subject = `Revision Requested for "${jobTitle}"`;
  const text = `The client has requested a revision for "${jobTitle}". Notes: ${notes || 'No additional notes provided.'}. Please log in to resubmit your work.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Revision Requested 🔄</h2>
      <p>The client has requested a revision for the job:</p>
      <h3 style="color: #4f46e5;">${jobTitle}</h3>
      ${notes ? `<blockquote style="border-left: 4px solid #f59e0b; margin: 10px 0; padding-left: 10px; color: #555; font-style: italic;">${notes}</blockquote>` : ''}
      <p>Please log in to ProLink to review the feedback and resubmit your work once the changes are complete.</p>
      <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 5px;">View Dashboard</a>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};

const sendAutoReleaseEmail = async (toEmail, jobTitle, amount) => {
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const walletUrl = `${frontendUrl}/dashboard/wallet`;
  
  const subject = `Funds Auto-Released: ₦${amount} for "${jobTitle}"`;
  const text = `Since the client did not respond within the review period, the funds for "${jobTitle}" (₦${amount}) have been automatically released to your wallet.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Funds Auto-Released ⏰</h2>
      <p>The review period has ended without the client approving or disputing your submission for:</p>
      <h3 style="color: #4f46e5;">${jobTitle}</h3>
      <p><strong>₦${amount}</strong> has been automatically released from Escrow to your ProLink Wallet.</p>
      <a href="${walletUrl}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 5px;">View Wallet</a>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html, true);
};


async function sendBidReceivedEmail(toEmail, jobTitle, freelancerName, amount, jobUrl) {
  const subject = `New bid on your job: ${jobTitle}`;
  const text = `${freelancerName} placed a bid of ₦${amount.toLocaleString()} on your job "${jobTitle}". Log in to review it.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New Bid Received 🎉</h2>
      <p><strong>${freelancerName}</strong> placed a bid of <strong>₦${amount.toLocaleString()}</strong> on your job <strong>"${jobTitle}"</strong>.</p>
      <a href="${jobUrl}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:5px;">Review Bid</a>
      <p style="color:#888;font-size:12px;margin-top:20px;">You're receiving this because you posted a job on ProLink Nigeria.</p>
    </div>
  `;
  await sendNativeEmail(toEmail, subject, text, html, true);
}


async function sendInvoiceEmail(toEmail, invoiceId, jobTitle, amount, pdfBase64) {
  const subject = `Your Receipt/Invoice for ${jobTitle} (#${invoiceId})`;
  const text = `Please find attached your invoice for ${jobTitle} for the amount of NGN ${amount}.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Invoice Attached 🧾</h2>
      <p>Thank you for using ProLink. Please find attached your official invoice for:</p>
      <h3 style="color: #059669;">${jobTitle}</h3>
      <p>Total: <strong>₦${amount.toLocaleString()}</strong></p>
    </div>
  `;

  const attachments = [{
    filename: `ProLink_Invoice_${invoiceId}.pdf`,
    content: pdfBase64,
    encoding: 'base64'
  }];

  await sendNativeEmail(toEmail, subject, text, html, true, attachments);
}
async function sendDeadlineReminderEmail(toEmail, jobTitle, deadline, isClient) {
  const subject = `Urgent: Deadline Approaching for "${jobTitle}"`;
  const text = `The deadline for your job "${jobTitle}" is approaching on ${deadline.toDateString()}.`;
  
  const roleText = isClient 
    ? "Please review the work or prepare to communicate with your freelancer."
    : "Please ensure you submit your final work before the deadline.";
    
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ef4444; margin: 0; font-size: 24px;">Deadline Reminder</h2>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hello,</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
        This is a friendly reminder that the deadline for the job <strong>"${jobTitle}"</strong> is approaching on <strong>${deadline.toDateString()}</strong>.
      </p>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
        ${roleText}
      </p>
      <div style="margin-top: 32px; text-align: center;">
        <a href="https://prolink.com/dashboard/contracts" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Contract</a>
      </div>
    </div>
  `;

  await sendNativeEmail(toEmail, subject, text, html);
}

module.exports = {
  sendDeadlineReminderEmail,
  sendVerificationEmail,
  sendVerificationOTP,
  sendNotificationEmail,
  sendChatMessageNotification,
  sendPasswordReset,
  sendDisputeEmail,
  sendReportEmail,
  sendBlockEmail,
  sendHiredEmail,
  sendJobSubmittedEmail,
  sendFundsApprovedEmail,
  sendRevisionRequestedEmail,
  sendAutoReleaseEmail,
  sendBidReceivedEmail,
  sendInvoiceEmail
};
