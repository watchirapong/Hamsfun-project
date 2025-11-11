import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Find all documents that don't have hamsterCoin field or it's null/undefined
    const usersWithoutHamsterCoin = await UserProgress.find({
      $or: [
        { hamsterCoin: { $exists: false } },
        { hamsterCoin: null },
        { hamsterCoin: undefined }
      ]
    });

    console.log(`Found ${usersWithoutHamsterCoin.length} users without hamsterCoin field`);

    // Update all documents to add hamsterCoin: 0 if missing
    // First, let's try a more direct approach - update all documents
    const allUsers = await UserProgress.find({});
    let updatedCount = 0;

    for (const user of allUsers) {
      const userObj = user.toObject ? user.toObject() : user;
      if (userObj.hamsterCoin === undefined || userObj.hamsterCoin === null || !('hamsterCoin' in userObj)) {
        user.hamsterCoin = 0;
        user.markModified('hamsterCoin');
        await user.save();
        updatedCount++;
        console.log(`Updated user ${user.discordId} with hamsterCoin: 0`);
      }
    }

    // Also try updateMany as backup
    const updateResult = await UserProgress.updateMany(
      {
        $or: [
          { hamsterCoin: { $exists: false } },
          { hamsterCoin: null }
        ]
      },
      {
        $set: { hamsterCoin: 0 }
      }
    );

    console.log(`Updated ${updatedCount} documents via save(), ${updateResult.modifiedCount} via updateMany()`);

    // Try using native MongoDB driver as last resort
    const db = mongoose.connection.db;
    if (db) {
      const collection = db.collection('userprogresses');
      const nativeUpdate = await collection.updateMany(
        {
          $or: [
            { hamsterCoin: { $exists: false } },
            { hamsterCoin: null }
          ]
        },
        {
          $set: { hamsterCoin: 0 }
        }
      );
      console.log(`Native MongoDB update: matched ${nativeUpdate.matchedCount}, modified ${nativeUpdate.modifiedCount}`);
    }

    // Verify the update worked - try both with and without lean()
    const verifyUserLean = await UserProgress.findOne({ discordId: '641285950902632459' }).lean();
    const verifyUserDoc = await UserProgress.findOne({ discordId: '641285950902632459' });
    const hasFieldLean = verifyUserLean && 'hamsterCoin' in verifyUserLean;
    const hasFieldDoc = verifyUserDoc && 'hamsterCoin' in verifyUserDoc;
    const hamsterCoinValue = verifyUserDoc?.hamsterCoin ?? verifyUserLean?.hamsterCoin;

    return NextResponse.json({
      success: true,
      message: `Added hamsterCoin field to ${updatedCount} documents via save(), ${updateResult.modifiedCount} via updateMany()`,
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      saveCount: updatedCount,
      verification: {
        hasFieldLean,
        hasFieldDoc,
        hamsterCoin: hamsterCoinValue ?? 'NOT SET',
        allFieldsLean: verifyUserLean ? Object.keys(verifyUserLean) : [],
        allFieldsDoc: verifyUserDoc ? Object.keys(verifyUserDoc.toObject ? verifyUserDoc.toObject() : verifyUserDoc) : []
      }
    });
  } catch (error: any) {
    console.error('Error migrating hamsterCoin:', error);
    return NextResponse.json(
      { error: 'Failed to migrate hamsterCoin', details: error.message },
      { status: 500 }
    );
  }
}

