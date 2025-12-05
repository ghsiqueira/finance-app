import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import budgetRoutes from './routes/budgets.js';
import goalRoutes from './routes/goals.js';
import currencyRoutes from './routes/currency.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';  

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);  

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});