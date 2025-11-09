import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const discordId = searchParams.get('discordId');

    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    const progress = await UserProgress.findOne({ discordId });

    if (!progress) {
      // Return default progress if not found
      return NextResponse.json({
        unlockedPlanets: [1],
        earth6Completed: false,
        points: 10,
        atk: 10,
        hp: 10,
        agi: 10,
      });
    }

    return NextResponse.json({
      unlockedPlanets: progress.unlockedPlanets,
      earth6Completed: progress.earth6Completed,
      points: progress.points,
      atk: progress.atk,
      hp: progress.hp,
      agi: progress.agi,
    });
  } catch (error: any) {
    console.error('Error loading progress:', error);
    return NextResponse.json(
      { error: 'Failed to load progress', details: error.message },
      { status: 500 }
    );
  }
}

