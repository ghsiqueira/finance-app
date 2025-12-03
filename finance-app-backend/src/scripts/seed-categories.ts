import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import User from '../models/User.js';

dotenv.config();

const categories = [
  { name: 'Alimentação', icon: 'restaurant', color: '#FF6B35', type: 'expense', isDefault: true },
  { name: 'Transporte', icon: 'car', color: '#4A90E2', type: 'expense', isDefault: true },
  { name: 'Saúde', icon: 'medical', color: '#E74C3C', type: 'expense', isDefault: true },
  { name: 'Educação', icon: 'school', color: '#9B59B6', type: 'expense', isDefault: true },
  { name: 'Lazer', icon: 'game-controller', color: '#2ECC71', type: 'expense', isDefault: true },
  { name: 'Casa', icon: 'home', color: '#8B4513', type: 'expense', isDefault: true },
  { name: 'Viagem', icon: 'airplane', color: '#1ABC9C', type: 'expense', isDefault: true },
  { name: 'Investimentos', icon: 'trending-up', color: '#27AE60', type: 'income', isDefault: true },
  { name: 'Roupas', icon: 'shirt', color: '#E91E63', type: 'expense', isDefault: true },
  { name: 'Tecnologia', icon: 'laptop', color: '#3498DB', type: 'expense', isDefault: true },
  { name: 'Economia', icon: 'wallet', color: '#F39C12', type: 'expense', isDefault: true },
  { name: 'Presente', icon: 'gift', color: '#FF5252', type: 'expense', isDefault: true },
  { name: 'Salário', icon: 'cash', color: '#4CAF50', type: 'income', isDefault: true },
  { name: 'Freelance', icon: 'briefcase', color: '#00BCD4', type: 'income', isDefault: true },
  { name: 'Pets', icon: 'paw', color: '#795548', type: 'expense', isDefault: true },
  { name: 'Contas', icon: 'receipt', color: '#607D8B', type: 'expense', isDefault: true },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-app');
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      console.log('💡 Register a user in the app, then run this script again.');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📊 Creating categories for user: ${user.name} (${user.email})`);

    const userId = user._id.toString();

    const existingCategories = await Category.find({ userId: userId as any });
    
    if (existingCategories.length > 0) {
      console.log(`\n⚠️  User already has ${existingCategories.length} categories.`);
      console.log('💡 Keeping existing categories and adding new ones...\n');
    }

    let created = 0;
    let skipped = 0;

    for (const categoryData of categories) {
      const exists = await Category.findOne({
        userId: userId as any,
        name: categoryData.name
      });

      if (exists) {
        console.log(`⏭️  Skipped: ${categoryData.name} (already exists)`);
        skipped++;
      } else {
        const category = new Category({
          ...categoryData,
          userId: userId
        });
        await category.save();
        console.log(`✅ Created: ${categoryData.name} (${categoryData.icon} ${categoryData.color})`);
        created++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${categories.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedCategories();