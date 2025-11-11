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
        name: 'Unknown',
        username: 'Unknown',
        nickname: null,
        avatarUrl: null,
        hamsterCoin: 0,
        gachaTicket: 0,
        unlockedPlanets: [1],
        earth6Completed: false,
        points: 10,
        atk: 10,
        hp: 10,
        agi: 10,
        achievements: [],
      });
    }

    // Convert to plain object to ensure all fields are included
    const progressObj = progress.toObject ? progress.toObject() : progress;
    
    // Ensure purchasedAssets is an array of strings
    const purchasedAssets = (progressObj.purchasedAssets || []).map((id: any) => String(id));
    
    console.log('📊 Loading progress for discordId:', discordId);
    console.log('📊 Progress object hamsterCoin:', progressObj.hamsterCoin, 'Type:', typeof progressObj.hamsterCoin);
    console.log('📊 PurchasedAssets:', purchasedAssets, 'Count:', purchasedAssets.length);
    console.log('📊 Progress object keys:', Object.keys(progressObj));
    
    return NextResponse.json({
      name: progressObj.name || progressObj.username || 'Unknown',
      username: progressObj.username || 'Unknown',
      nickname: progressObj.nickname || null,
      avatarUrl: progressObj.avatarUrl || null,
      hamsterCoin: progressObj.hamsterCoin !== undefined && progressObj.hamsterCoin !== null ? Number(progressObj.hamsterCoin) : 0,
      gachaTicket: progressObj.gachaTicket !== undefined && progressObj.gachaTicket !== null ? Number(progressObj.gachaTicket) : 0,
      unlockedPlanets: progressObj.unlockedPlanets || [1],
      earth6Completed: progressObj.earth6Completed || false,
      points: progressObj.points || 10,
      atk: progressObj.atk || 10,
      hp: progressObj.hp || 10,
      agi: progressObj.agi || 10,
      achievements: progressObj.achievements || [],
      answers: progressObj.answers || { unityBasic: [], unityAsset: [] },
      declinedAnswers: progressObj.declinedAnswers || [],
      purchasedAssets: purchasedAssets,
    });
  } catch (error: any) {
    console.error('Error loading progress:', error);
    return NextResponse.json(
      { error: 'Failed to load progress', details: error.message },
      { status: 500 }
    );
  }
}

