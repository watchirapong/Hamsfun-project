import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { discordId, answer, imageUrl, fileUrl, type, earthNumber } = body;

    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    if (!type || (type !== 'unityBasic' && type !== 'unityAsset')) {
      return NextResponse.json({ error: 'Invalid type. Must be unityBasic or unityAsset' }, { status: 400 });
    }

    // Find or create user progress
    const userProgress = await UserProgress.findOne({ discordId });

    const answerData: any = {
      createdAt: new Date(),
      status: 'pending', // Default status is pending until admin reviews
    };
    if (answer && answer.trim()) {
      answerData.text = answer.trim();
    }
    if (imageUrl) {
      answerData.imageUrl = imageUrl;
    }
    if (fileUrl) {
      answerData.fileUrl = fileUrl; // For file uploads (not just images)
    }
    if (earthNumber !== null && earthNumber !== undefined) {
      answerData.earthNumber = earthNumber;
    }

    // If no answer data, don't save
    if (!answerData.text && !answerData.imageUrl && !answerData.fileUrl) {
      return NextResponse.json({ error: 'Answer text, image, or file is required' }, { status: 400 });
    }

    if (userProgress) {
      // Update existing user
      if (!userProgress.answers) {
        userProgress.answers = {
          unityBasic: [],
          unityAsset: [],
        };
      }
      if (!userProgress.answers[type as 'unityBasic' | 'unityAsset']) {
        userProgress.answers[type as 'unityBasic' | 'unityAsset'] = [];
      }
      
      // Add new answer
      userProgress.answers[type as 'unityBasic' | 'unityAsset'].push(answerData);
      await userProgress.save();
    } else {
      // Create new user progress with answer
      await UserProgress.create({
        discordId,
        name: 'Unknown',
        username: 'Unknown',
        hamsterCoin: 0,
        gachaTicket: 0,
        unlockedPlanets: [1],
        earth6Completed: false,
        points: 10,
        atk: 10,
        hp: 10,
        agi: 10,
        answers: {
          unityBasic: type === 'unityBasic' ? [answerData] : [],
          unityAsset: type === 'unityAsset' ? [answerData] : [],
        },
        achievements: [],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer', details: error.message },
      { status: 500 }
    );
  }
}

