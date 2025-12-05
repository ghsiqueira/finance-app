import express from 'express';
import { auth } from '../middleware/auth.js';
import { exportToCSV, exportToExcel, exportToPDF } from '../controllers/exportController.js';

const router = express.Router();

router.get('/csv', auth, exportToCSV);
router.get('/excel', auth, exportToExcel);
router.get('/pdf', auth, exportToPDF);

export default router;