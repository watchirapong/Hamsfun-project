import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { bossEventState } from './state';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      isActive: bossEventState.isActive,
      bossLevel: bossEventState.bossLevel,
      bossHp: bossEventState.bossHp,
      maxBossHp: bossEventState.maxBossHp,
      startedAt: bossEventState.startedAt,
      rewardHamsterCoin: bossEventState.rewardHamsterCoin,
      rewardStatPoint: bossEventState.rewardStatPoint,
    });
  } catch (error: any) {
    console.error('Error fetching boss event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boss event', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, bossLevel, bossHp, rewardHamsterCoin, rewardStatPoint } = body;

    if (action === 'trigger') {
      if (!bossLevel || !bossHp) {
        return NextResponse.json(
          { error: 'Boss level and HP are required' },
          { status: 400 }
        );
      }

      bossEventState.isActive = true;
      bossEventState.bossLevel = parseInt(bossLevel);
      bossEventState.bossHp = parseInt(bossHp);
      bossEventState.maxBossHp = parseInt(bossHp);
      bossEventState.startedAt = new Date();
      bossEventState.rewardHamsterCoin = parseInt(rewardHamsterCoin) || 0;
      bossEventState.rewardStatPoint = parseInt(rewardStatPoint) || 0;
      
      console.log('🎮 Boss event triggered with rewards:', {
        rewardHamsterCoin: bossEventState.rewardHamsterCoin,
        rewardStatPoint: bossEventState.rewardStatPoint,
        bossLevel: bossEventState.bossLevel,
        bossHp: bossEventState.bossHp,
      });

      return NextResponse.json({
        success: true,
        message: 'Boss event triggered',
        event: bossEventState,
      });
    } else if (action === 'stop') {
      bossEventState.isActive = false;
      bossEventState.startedAt = null;
      // Keep rewards for claiming

      return NextResponse.json({
        success: true,
        message: 'Boss event stopped',
      });
    } else if (action === 'damage') {
      const { damage } = body;
      if (bossEventState.isActive) {
        bossEventState.bossHp = Math.max(0, bossEventState.bossHp - parseInt(damage));
        
        // Auto-stop if boss is defeated (but keep rewards for claiming)
        if (bossEventState.bossHp <= 0) {
          console.log('💀 Boss defeated on server! Rewards to preserve:', {
            rewardHamsterCoin: bossEventState.rewardHamsterCoin,
            rewardStatPoint: bossEventState.rewardStatPoint,
          });
          bossEventState.isActive = false;
          bossEventState.startedAt = null;
          // Keep rewards available for players to claim - DO NOT CLEAR THEM
          console.log('✅ Rewards preserved after boss defeat:', {
            rewardHamsterCoin: bossEventState.rewardHamsterCoin,
            rewardStatPoint: bossEventState.rewardStatPoint,
          });
        }

        return NextResponse.json({
          success: true,
          bossHp: bossEventState.bossHp,
          isActive: bossEventState.isActive,
          rewardHamsterCoin: bossEventState.rewardHamsterCoin,
          rewardStatPoint: bossEventState.rewardStatPoint,
        });
      }

      return NextResponse.json(
        { error: 'Boss event is not active' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error handling boss event:', error);
    return NextResponse.json(
      { error: 'Failed to handle boss event', details: error.message },
      { status: 500 }
    );
  }
}

