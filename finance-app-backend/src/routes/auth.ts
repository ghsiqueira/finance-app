import express from 'express';
import { auth } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import { 
  register, 
  login, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword,
  deleteAccount,
  updateProfile,   
  changePassword,
  uploadProfilePhoto,    
  deleteProfilePhoto 
} from '../controllers/authController.js';

const router = express.Router();

// Rotas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Rotas protegidas
router.delete('/delete-account', auth, deleteAccount);
router.put('/profile', auth, updateProfile);        
router.put('/password', auth, changePassword);      
router.post('/profile/photo', auth, upload.single('photo'), uploadProfilePhoto);  // 🆕
router.delete('/profile/photo', auth, deleteProfilePhoto);                        // 🆕

export default router;