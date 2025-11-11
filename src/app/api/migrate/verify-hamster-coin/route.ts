import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const discordId = searchParams.get('discordId');

    if (discordId) {
      // Check specific user
      const user = await UserProgress.findOne({ discordId }).lean();
      
      if (!user) {
        return NextResponse.json({
          found: false,
          message: 'User not found'
        });
      }

      const hasHamsterCoin = 'hamsterCoin' in user && user.hamsterCoin !== null && user.hamsterCoin !== undefined;
      
      return NextResponse.json({
        found: true,
        discordId: user.discordId,
        hasHamsterCoin,
        hamsterCoin: user.hamsterCoin ?? 'NOT SET',
        allFields: Object.keys(user),
      });
    } else {
      // Check all users
      const allUsers = await UserProgress.find({}).lean();
      const usersWithoutHamsterCoin = allUsers.filter(
        user => !('hamsterCoin' in user) || user.hamsterCoin === null || user.hamsterCoin === undefined
      );

      return NextResponse.json({
        totalUsers: allUsers.length,
        usersWithoutHamsterCoin: usersWithoutHamsterCoin.length,
        usersMissingField: usersWithoutHamsterCoin.map(u => ({
          discordId: u.discordId,
          name: u.name,
          hasHamsterCoin: 'hamsterCoin' in u,
          hamsterCoinValue: u.hamsterCoin ?? 'NOT SET'
        })),
        allUsers: allUsers.map(u => ({
          discordId: u.discordId,
          name: u.name,
          hamsterCoin: u.hamsterCoin ?? 'NOT SET',
          hasField: 'hamsterCoin' in u
        }))
      });
    }
  } catch (error: any) {
    console.error('Error verifying hamsterCoin:', error);
    return NextResponse.json(
      { error: 'Failed to verify hamsterCoin', details: error.message },
      { status: 500 }
    );
  }
}

