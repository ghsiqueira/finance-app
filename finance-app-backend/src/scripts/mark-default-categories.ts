import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

async function markDefaultCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-app');
    console.log('✅ Connected to MongoDB');

    const defaultNames = [
      'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Casa',
      'Viagem', 'Investimentos', 'Roupas', 'Tecnologia', 'Economia',
      'Presente', 'Salário', 'Freelance', 'Pets', 'Contas'
    ];

    const result = await Category.updateMany(
      { name: { $in: defaultNames } },
      { $set: { isDefault: true } }
    );

    console.log(`✅ Marked ${result.modifiedCount} categories as default`);

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

markDefaultCategories();