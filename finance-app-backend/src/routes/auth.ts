import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  register, 
  login, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword,
  deleteAccount 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.delete('/delete-account', auth, deleteAccount);

export default router;