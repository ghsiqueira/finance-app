import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // 🆕 ADICIONAR
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import budgetRoutes from './routes/budgets.js';
import goalRoutes from './routes/goals.js';
import currencyRoutes from './routes/currency.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import exportRoutes from './routes/export.js';  
import insightsRoutes from './routes/insights.js';
import recurrenceRoutes from './routes/recurrence.js';
import backupRoutes from './routes/backup.js';
import billRoutes from './routes/bills.js';
import creditCardRoutes from './routes/creditCards.js'; 

dotenv.config();

// 🆕 CONFIGURAR __dirname PARA ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// 🆕 SERVIR FOTOS DE PERFIL (ANTES DAS ROTAS)
app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles')));

// ROTAS
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/export', exportRoutes);  
app.use('/api/insights', insightsRoutes);
app.use('/api/recurrence', recurrenceRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/credit-cards', creditCardRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});