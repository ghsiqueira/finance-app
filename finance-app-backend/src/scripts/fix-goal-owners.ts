import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Goal from '../models/Goal.js';
import User from '../models/User.js';

dotenv.config();

async function fixGoalOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-app');
    console.log('✅ Connected to MongoDB');

    const goals = await Goal.find({});
    console.log(`\n📊 Found ${goals.length} goals`);

    let fixed = 0;
    let alreadyOk = 0;

    for (const goal of goals) {
      const ownerInMembers = goal.members.some(
        m => m.userId.toString() === goal.userId.toString() && m.role === 'owner'
      );

      if (ownerInMembers) {
        console.log(`✅ Goal "${goal.name}" - Owner already in members`);
        alreadyOk++;
        continue;
      }

      const user = await User.findById(goal.userId);
      if (!user) {
        console.log(`⚠️  Goal "${goal.name}" - User not found (orphan goal)`);
        continue;
      }

      goal.members.unshift({
        userId: goal.userId,
        email: user.email,
        name: user.name,
        role: 'owner',
        currentContribution: goal.currentAmount || 0,
        joinedAt: goal.createdAt || new Date()
      } as any);

      await goal.save();
      console.log(`🔧 Fixed goal "${goal.name}" - Added ${user.name} as owner`);
      fixed++;
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Already OK: ${alreadyOk}`);
    console.log(`   🔧 Fixed: ${fixed}`);
    console.log(`   📊 Total: ${goals.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixGoalOwners();