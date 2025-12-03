import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateTransactions() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const totalBefore = await Transaction.countDocuments();
    const withoutCurrency = await Transaction.countDocuments({ 
      currency: { $exists: false } 
    });

    console.log(`\n📊 Status antes da migração:`);
    console.log(`   Total de transações: ${totalBefore}`);
    console.log(`   Sem campo currency: ${withoutCurrency}`);

    if (withoutCurrency === 0) {
      console.log('\n✅ Todas as transações já possuem o campo currency!');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n🔄 Migrando ${withoutCurrency} transações...`);

    const result = await Transaction.updateMany(
      { currency: { $exists: false } },
      { 
        $set: { 
          currency: 'BRL'
        } 
      }
    );

    console.log(`✅ ${result.modifiedCount} transações atualizadas com currency: BRL`);

    const withoutOriginalAmount = await Transaction.countDocuments({ 
      originalAmount: { $exists: false } 
    });

    if (withoutOriginalAmount > 0) {
      console.log(`\n🔄 Migrando ${withoutOriginalAmount} transações sem originalAmount...`);

      const transactionsToUpdate = await Transaction.find({ 
        originalAmount: { $exists: false } 
      });

      for (const transaction of transactionsToUpdate) {
        transaction.originalAmount = transaction.amount;
        await transaction.save();
      }

      console.log(`✅ ${withoutOriginalAmount} transações atualizadas com originalAmount`);
    }

    const totalAfter = await Transaction.countDocuments();
    const withCurrency = await Transaction.countDocuments({ currency: 'BRL' });
    const withOriginalAmount = await Transaction.countDocuments({ 
      originalAmount: { $exists: true } 
    });

    console.log(`\n📊 Status após migração:`);
    console.log(`   Total de transações: ${totalAfter}`);
    console.log(`   Com currency: ${withCurrency}`);
    console.log(`   Com originalAmount: ${withOriginalAmount}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

migrateTransactions();