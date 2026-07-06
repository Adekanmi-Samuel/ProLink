// Mock SMS Service for development.
// In production, this would use Termii or Africa's Talking.

const sendOTP = async (phoneNumber, otp) => {
  console.log(`\n========================================`);
  console.log(`[SMS MOCK] Sending OTP to ${phoneNumber}`);
  console.log(`[SMS MOCK] Code: ${otp}`);
  console.log(`========================================\n`);
  
  // Simulate network delay
  return new Promise((resolve) => setTimeout(resolve, 500));
};

module.exports = {
  sendOTP,
};
