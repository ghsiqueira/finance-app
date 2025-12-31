import express from 'express';
import { auth } from '../middleware/auth.js';
import { exportData, importData } from '../controllers/backupController.js';

const router = express.Router();

// Exportar dados
router.get('/export', auth, exportData);

// Importar dados
router.post('/import', auth, importData);

export default router;