import { emailService } from '../services/emailService.js';

/**
 * Test email service configuration
 */
export const testEmailService = async () => {
  console.log('🧪 Testing Email Service Configuration...\n');
  
  try {
    // Test password reset email
    const testUser = {
      email: 'test@example.com',
      name: 'Test User'
    };
    
    const testToken = 'test-reset-token-1234567890abcdef';
    
    console.log('📧 Sending test password reset email...');
    const result = await emailService.sendPasswordResetEmail(testUser, testToken);
    
    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Check your email (or Ethereal preview) for the test message');
    } else {
      console.log('❌ Failed to send email');
    }
    
    // Test password change confirmation
    console.log('\n📧 Sending test password change confirmation...');
    const confirmResult = await emailService.sendPasswordChangeEmail(testUser);
    
    if (confirmResult) {
      console.log('✅ Confirmation email sent successfully!');
    } else {
      console.log('❌ Failed to send confirmation email');
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
};

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailService();
}
