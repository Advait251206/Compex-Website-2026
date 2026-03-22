import express from 'express';
import { 
  sendOtp,
  verifyOtp,
  completeRegistration,
  resendOtp,
  sendLoginOtp,
  verifyLoginOtp,
  registerValidation,
  otpValidation,
  checkEmailStatus,
  checkPhoneStatus,
  downloadTicket,
  resendTicketEmailController,
  getTicket,
  sendUpdateEmailOtp,
  verifyUpdateEmailOtp,
  sendUpdatePhoneOtp,
  verifyUpdatePhoneOtp
} from '../controllers/userController';

const router = express.Router();

// User registration flow (public)
router.post('/initiate-verification', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-registration', completeRegistration);
router.post('/check-email', checkEmailStatus);
router.post('/check-phone', checkPhoneStatus);
router.post('/resend-otp', resendOtp);

// View Ticket Flow
router.post('/send-login-otp', sendLoginOtp);
router.post('/verify-login-otp', verifyLoginOtp);

// Ticket Actions
router.get('/ticket/:id', getTicket);
router.get('/ticket/:id/download', downloadTicket);
router.post('/ticket/:id/email', resendTicketEmailController);
router.post('/ticket/:id/update-email-otp', sendUpdateEmailOtp);
router.post('/ticket/:id/verify-email-update', verifyUpdateEmailOtp);
router.post('/ticket/:id/update-phone-otp', sendUpdatePhoneOtp);
router.post('/ticket/:id/verify-phone-update', verifyUpdatePhoneOtp);

export default router;
