import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all users - use lean() to get plain JavaScript objects
    const users = await UserProgress.find({}).lean();

    // Calculate score and progress for each user
    const usersWithScore = users.map((user) => {
      const unlockedPlanets = user.unlockedPlanets || [1];
      const maxPlanets = 6;
      const maxUnlocked = unlockedPlanets.length > 0 ? Math.max(...unlockedPlanets) : 1;
      const progress = Math.round((unlockedPlanets.length / maxPlanets) * 100);
      
      // Calculate total score: (max planet * 1000) + (points * 10) + hamsterCoin
      const score = (maxUnlocked * 1000) + ((user.points || 0) * 10) + (user.hamsterCoin || 0);

      return {
        discordId: user.discordId,
        name: user.name || user.username || 'Unknown',
        username: user.username || 'Unknown',
        nickname: user.nickname || user.name || user.username || 'Unknown',
        avatarUrl: user.avatarUrl,
        hamsterCoin: user.hamsterCoin ?? 0,
        points: user.points || 0,
        unlockedPlanets: unlockedPlanets,
        maxUnlocked: maxUnlocked,
        progress: progress,
        score: score,
        earth6Completed: user.earth6Completed || false,
      };
    });

    // Sort by score (descending), then by maxUnlocked, then by points
    usersWithScore.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.maxUnlocked !== a.maxUnlocked) return b.maxUnlocked - a.maxUnlocked;
      return b.points - a.points;
    });

    // Return top 10 users
    const topUsers = usersWithScore.slice(0, 10);

    return NextResponse.json({ leaderboard: topUsers });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 }
    );
  }
}

