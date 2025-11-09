import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { discordId, username, unlockedPlanets, earth6Completed, points, atk, hp, agi } = body;

    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    const progress = await UserProgress.findOneAndUpdate(
      { discordId },
      {
        discordId,
        username: username || 'Unknown',
        unlockedPlanets: unlockedPlanets || [1],
        earth6Completed: earth6Completed || false,
        points: points !== undefined ? points : 10,
        atk: atk !== undefined ? atk : 10,
        hp: hp !== undefined ? hp : 10,
        agi: agi !== undefined ? agi : 10,
      },
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

