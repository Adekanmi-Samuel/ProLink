// Mock SMS Service for development.
// In production, this would use Termii or Africa's Talking.

const sendOTP = async (phoneNumber, otp) => {
  console.log(`\n========================================`);
  console.log(`[SMS MOCK] Sending OTP to ${phoneNumber}`);
  console.log(`[SMS MOCK] Code: ${otp}`);
  console.log(`========================================\n`);
  
  // Actually send to ntfy.sh using phone number as topic
  try {
    const topic = phoneNumber.replace(/\D/g, ''); // e.g. 2349112713422
    if (typeof fetch !== 'undefined' && topic) {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: `Your ProLink OTP is: ${otp}`,
        headers: {
          'Title': 'ProLink Verification',
          'Tags': 'key'
        }
      });
      console.log(`[ntfy] OTP sent to topic: ${topic}`);
    }
  } catch (err) {
    console.error('[ntfy] Error sending OTP:', err);
  }

  // Simulate network delay
  return new Promise((resolve) => setTimeout(resolve, 500));
};

module.exports = {
  sendOTP,
};
