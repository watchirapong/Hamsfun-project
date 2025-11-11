import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';
import { bossEventState } from '../state';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { discordId } = body;

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID is required' },
        { status: 400 }
      );
    }

    console.log('=== CLAIM REWARDS API CALLED ===');
    console.log('Discord ID:', discordId);
    console.log('Boss event state object:', bossEventState);
    console.log('Boss event state keys:', Object.keys(bossEventState));

    // Get boss event state directly from shared state
    const bossEvent = bossEventState;

    console.log('Boss event state:', {
      isActive: bossEvent.isActive,
      rewardHamsterCoin: bossEvent.rewardHamsterCoin,
      rewardStatPoint: bossEvent.rewardStatPoint,
      fullState: JSON.stringify(bossEvent, null, 2),
    });

    // Check if boss event exists and has rewards
    // Ensure values are numbers, not strings
    const rewardHamsterCoin = Number(bossEvent.rewardHamsterCoin) || 0;
    const rewardStatPoint = Number(bossEvent.rewardStatPoint) || 0;

    console.log('Rewards to distribute:', { 
      rewardHamsterCoin, 
      rewardStatPoint,
      typeHamsterCoin: typeof rewardHamsterCoin,
      typeStatPoint: typeof rewardStatPoint,
    });

    if (rewardHamsterCoin === 0 && rewardStatPoint === 0) {
      console.warn('⚠️ No rewards available in boss event state');
      console.warn('Full boss event state:', JSON.stringify(bossEvent, null, 2));
      console.warn('This might mean rewards were not set when boss event was triggered');
      return NextResponse.json(
        { 
          error: 'No rewards available', 
          details: 'Boss event has no rewards set. Make sure to set rewards in Boss Event Settings before triggering the event.',
          bossEventState: {
            rewardHamsterCoin: bossEvent.rewardHamsterCoin,
            rewardStatPoint: bossEvent.rewardStatPoint,
            isActive: bossEvent.isActive,
          }
        },
        { status: 400 }
      );
    }

    // Get user progress
    const userProgress = await UserProgress.findOne({ discordId });

    if (!userProgress) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User before update:', {
      discordId: userProgress.discordId,
      currentPoints: userProgress.points,
      currentHamsterCoin: userProgress.hamsterCoin,
      rewardStatPoint,
      rewardHamsterCoin,
    });

    // Ensure we're incrementing by valid numbers
    const incrementHamsterCoin = Number(rewardHamsterCoin);
    const incrementPoints = Number(rewardStatPoint);

    if (isNaN(incrementHamsterCoin) || isNaN(incrementPoints)) {
      console.error('Invalid reward values:', { incrementHamsterCoin, incrementPoints });
      return NextResponse.json(
        { error: 'Invalid reward values', details: 'Rewards must be valid numbers' },
        { status: 400 }
      );
    }

    // Update user progress using $inc to increment values
    try {
      console.log('Attempting to update user with $inc:', {
        discordId,
        incrementPoints,
        incrementHamsterCoin,
      });

      // First, try the simplest approach - direct assignment and save
      const currentPoints = userProgress.points || 10;
      const currentHamsterCoin = userProgress.hamsterCoin || 0;
      
      userProgress.points = currentPoints + incrementPoints;
      userProgress.hamsterCoin = currentHamsterCoin + incrementHamsterCoin;
      
      console.log('Setting points:', {
        from: currentPoints,
        to: userProgress.points,
        increment: incrementPoints,
      });
      
      await userProgress.save();
      console.log('Direct save completed');
      
      // Verify it worked
      const verifyUser = await UserProgress.findOne({ discordId });
      console.log('Verification after save:', {
        points: verifyUser?.points,
        hamsterCoin: verifyUser?.hamsterCoin,
      });

      // Re-fetch to ensure we have the latest data
      const updatedUser = await UserProgress.findOne({ discordId });
      
      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to retrieve updated user' },
          { status: 500 }
        );
      }

      console.log('User after update:', {
        discordId: updatedUser.discordId,
        newPoints: updatedUser.points,
        newHamsterCoin: updatedUser.hamsterCoin,
        pointsIncreased: updatedUser.points - currentPoints,
        hamsterCoinIncreased: updatedUser.hamsterCoin - currentHamsterCoin,
        expectedPointsIncrease: incrementPoints,
        expectedHamsterCoinIncrease: incrementHamsterCoin,
      });

      // Verify the update actually worked
      if (updatedUser.points === currentPoints && incrementPoints > 0) {
        console.error('WARNING: Points did not increase after save!', {
          before: currentPoints,
          after: updatedUser.points,
          increment: incrementPoints,
        });
        // Try one more time with direct assignment
        updatedUser.points = updatedUser.points + incrementPoints;
        updatedUser.hamsterCoin = (updatedUser.hamsterCoin || 0) + incrementHamsterCoin;
        await updatedUser.save();
        console.log('Forced update with direct assignment');
        
        // Final fetch
        const finalUser = await UserProgress.findOne({ discordId });
        return NextResponse.json({
          success: true,
          rewards: {
            hamsterCoin: incrementHamsterCoin,
            statPoint: incrementPoints,
          },
          newBalance: {
            hamsterCoin: finalUser?.hamsterCoin || updatedUser.hamsterCoin,
            points: finalUser?.points || updatedUser.points,
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        rewards: {
          hamsterCoin: incrementHamsterCoin,
          statPoint: incrementPoints,
        },
        newBalance: {
          hamsterCoin: updatedUser.hamsterCoin,
          points: updatedUser.points,
        },
      });
    } catch (updateError: any) {
      console.error('Error during update:', updateError);
      // Fallback: try direct save
      try {
        userProgress.points = (userProgress.points || 10) + incrementPoints;
        userProgress.hamsterCoin = (userProgress.hamsterCoin || 0) + incrementHamsterCoin;
        await userProgress.save();
        console.log('Fallback save successful');
        
        return NextResponse.json({
          success: true,
          rewards: {
            hamsterCoin: incrementHamsterCoin,
            statPoint: incrementPoints,
          },
          newBalance: {
            hamsterCoin: userProgress.hamsterCoin,
            points: userProgress.points,
          },
        });
      } catch (saveError: any) {
        console.error('Fallback save also failed:', saveError);
        throw saveError;
      }
    }
  } catch (error: any) {
    console.error('Error claiming rewards:', error);
    return NextResponse.json(
      { error: 'Failed to claim rewards', details: error.message },
      { status: 500 }
    );
  }
}

