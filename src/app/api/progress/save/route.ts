import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      discordId, 
      name,
      username, 
      nickname, 
      avatar, 
      unlockedPlanets, 
      earth6Completed, 
      points, 
      atk, 
      hp, 
      agi,
      hamsterCoin,
      gachaTicket,
      achievements
    } = body;

    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    const updateData: any = {
      discordId,
      name: name || username || 'Unknown',
      username: username || 'Unknown',
      unlockedPlanets: unlockedPlanets || [1],
      earth6Completed: earth6Completed || false,
      points: points !== undefined ? points : 10,
      atk: atk !== undefined ? atk : 10,
      hp: hp !== undefined ? hp : 10,
      agi: agi !== undefined ? agi : 10,
    };

    // Add nickname and avatarUrl if provided
    if (nickname !== undefined) {
      updateData.nickname = nickname;
    }
    if (avatar !== undefined) {
      updateData.avatarUrl = avatar;
    }
    
    // Add new fields if provided
    if (hamsterCoin !== undefined) {
      updateData.hamsterCoin = hamsterCoin;
    }
    if (gachaTicket !== undefined) {
      updateData.gachaTicket = gachaTicket;
    }
    if (achievements !== undefined && Array.isArray(achievements)) {
      updateData.achievements = achievements;
    }

    const progress = await UserProgress.findOneAndUpdate(
      { discordId },
      updateData,
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress', details: error.message },
      { status: 500 }
    );
  }
}

