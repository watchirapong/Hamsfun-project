import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      discordId, 
      answerType, // 'unityBasic' or 'unityAsset'
      answerIndex, // Index of the answer in the array
      action, // 'accept' or 'decline'
      adminComment, // Required if action is 'decline'
      reviewedBy, // Admin Discord ID
    } = body;

    if (!discordId || !answerType || answerIndex === undefined || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'decline' && !adminComment) {
      return NextResponse.json(
        { error: 'Admin comment is required when declining' },
        { status: 400 }
      );
    }

    if (answerType !== 'unityBasic' && answerType !== 'unityAsset') {
      return NextResponse.json(
        { error: 'Invalid answer type' },
        { status: 400 }
      );
    }

    // Find user
    const userProgress = await UserProgress.findOne({ discordId });

    if (!userProgress) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the answer array to verify it exists
    const answers = userProgress.answers?.[answerType as 'unityBasic' | 'unityAsset'] || [];

    if (!answers[answerIndex]) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    const answer = answers[answerIndex];
    const currentEarth = answer.earthNumber || 1;

    if (action === 'accept') {
      // If accepted, unlock next planet and mark as accepted
      const nextEarth = currentEarth + 1;
      const updateData: any = {
        [`answers.${answerType}.${answerIndex}.status`]: 'accepted',
        [`answers.${answerType}.${answerIndex}.reviewedAt`]: new Date(),
        [`answers.${answerType}.${answerIndex}.reviewedBy`]: reviewedBy,
      };

      // Unlock next planet if not already unlocked
      if (!userProgress.unlockedPlanets.includes(nextEarth)) {
        const updatedPlanets = [...userProgress.unlockedPlanets, nextEarth].sort((a, b) => a - b);
        updateData.unlockedPlanets = updatedPlanets;
      }

      // Update using findOneAndUpdate
      const updatedUser = await UserProgress.findOneAndUpdate(
        { discordId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to update answer' },
          { status: 500 }
        );
      }
    } else if (action === 'decline') {
      // If declined, save the comment to a separate declinedAnswers array, then remove from answers
      if (!adminComment) {
        return NextResponse.json(
          { error: 'Admin comment is required when declining' },
          { status: 400 }
        );
      }

      // Get the answer info before removing it
      const earthNumber = answer.earthNumber;
      const answerText = answer.text;
      const answerImageUrl = answer.imageUrl;

      // Save declined answer info to a separate structure for user to see comment
      // We'll store it in a declinedAnswers field (we'll add this to the schema)
      const declinedAnswerData = {
        earthNumber: earthNumber,
        answerType: answerType,
        answerText: answerText,
        answerImageUrl: answerImageUrl,
        adminComment: adminComment.trim(),
        reviewedAt: new Date(),
        reviewedBy: reviewedBy,
        declinedAt: new Date(),
      };

      // Get current declined answers or initialize empty array
      const currentDeclinedAnswers = (userProgress as any).declinedAnswers || [];
      currentDeclinedAnswers.push(declinedAnswerData);

      // Remove the answer from the answers array
      const currentAnswers = userProgress.answers?.[answerType as 'unityBasic' | 'unityAsset'] || [];
      const updatedAnswers = currentAnswers.filter((_: any, idx: number) => idx !== answerIndex);

      // Update both: remove from answers array and add to declinedAnswers
      const updatedUser = await UserProgress.findOneAndUpdate(
        { discordId },
        { 
          $set: {
            [`answers.${answerType}`]: updatedAnswers,
            declinedAnswers: currentDeclinedAnswers,
          }
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to remove answer' },
          { status: 500 }
        );
      }

      console.log('🗑️ Removed declined answer from array. Remaining answers:', updatedAnswers.length);
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' 
        ? 'Answer accepted and next world unlocked' 
        : 'Answer declined and removed. User can see your comment in the quest dialog.',
    });
  } catch (error: any) {
    console.error('Error reviewing answer:', error);
    return NextResponse.json(
      { error: 'Failed to review answer', details: error.message },
      { status: 500 }
    );
  }
}

