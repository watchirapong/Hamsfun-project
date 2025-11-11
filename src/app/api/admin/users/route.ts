import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } },
        { discordId: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch all users - use lean() to get plain JavaScript objects
    const users = await UserProgress.find(query).lean().sort({ updatedAt: -1 });

    // Calculate progress for each user
    const usersWithProgress = users.map((user) => {
      const unlockedPlanets = user.unlockedPlanets || [1];
      const maxPlanets = 6;
      const unityBasicProgress = Math.round((unlockedPlanets.length / maxPlanets) * 100);
      
      // For now, unityAssetProgress is 0 (can be updated later)
      const unityAssetProgress = 0;

      return {
        discordId: user.discordId,
        name: user.name || user.username || 'Unknown',
        username: user.username || 'Unknown',
        nickname: user.nickname || user.name || user.username || 'Unknown',
        avatarUrl: user.avatarUrl,
        hamsterCoin: user.hamsterCoin ?? 0,
        gachaTicket: user.gachaTicket ?? 0,
        points: user.points || 0,
        unlockedPlanets: user.unlockedPlanets || [1],
        unityBasicProgress,
        unityAssetProgress,
        answers: {
          unityBasic: (user.answers?.unityBasic || []).map((answer: any) => {
            // Convert Mongoose subdocument to plain object if needed
            const plainAnswer = answer.toObject ? answer.toObject() : answer;
            return {
              text: plainAnswer.text,
              imageUrl: plainAnswer.imageUrl,
              fileUrl: plainAnswer.fileUrl,
              earthNumber: plainAnswer.earthNumber,
              createdAt: plainAnswer.createdAt ? (plainAnswer.createdAt instanceof Date ? plainAnswer.createdAt.toISOString() : plainAnswer.createdAt) : undefined,
              status: plainAnswer.status || 'pending', // Use 'pending' as default if status doesn't exist (for old answers)
              adminComment: plainAnswer.adminComment,
              reviewedAt: plainAnswer.reviewedAt ? (plainAnswer.reviewedAt instanceof Date ? plainAnswer.reviewedAt.toISOString() : plainAnswer.reviewedAt) : undefined,
              reviewedBy: plainAnswer.reviewedBy,
            };
          }),
          unityAsset: (user.answers?.unityAsset || []).map((answer: any) => {
            // Convert Mongoose subdocument to plain object if needed
            const plainAnswer = answer.toObject ? answer.toObject() : answer;
            return {
              text: plainAnswer.text,
              imageUrl: plainAnswer.imageUrl,
              fileUrl: plainAnswer.fileUrl,
              earthNumber: plainAnswer.earthNumber,
              createdAt: plainAnswer.createdAt ? (plainAnswer.createdAt instanceof Date ? plainAnswer.createdAt.toISOString() : plainAnswer.createdAt) : undefined,
              status: plainAnswer.status || 'pending', // Use 'pending' as default if status doesn't exist (for old answers)
              adminComment: plainAnswer.adminComment,
              reviewedAt: plainAnswer.reviewedAt ? (plainAnswer.reviewedAt instanceof Date ? plainAnswer.reviewedAt.toISOString() : plainAnswer.reviewedAt) : undefined,
              reviewedBy: plainAnswer.reviewedBy,
            };
          }),
        },
        achievements: user.achievements || [],
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({ users: usersWithProgress });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

