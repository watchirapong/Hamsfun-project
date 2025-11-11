import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ShopAsset from '@/models/ShopAsset';
import UserProgress from '@/models/UserProgress';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { assetId, discordId } = body;

    if (!assetId || !discordId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get asset - use lean() to get plain object
    const asset = await ShopAsset.findById(assetId).lean();
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    console.log('📦 Asset details:', {
      assetId,
      assetName: asset.name,
      assetPrice: asset.price,
      assetPriceType: typeof asset.price,
    });

    // Get user - use lean() to get plain object
    const user = await UserProgress.findOne({ discordId }).lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    // Check if user already owns this asset
    const purchasedAssets = user.purchasedAssets || [];
    if (purchasedAssets.includes(assetId)) {
      return NextResponse.json(
        { error: 'Asset already purchased' },
        { status: 400 }
      );
    }

    // Check if user has enough coins - use fresh data from database
    // Convert to numbers explicitly
    const currentCoins = typeof user.hamsterCoin === 'number' ? user.hamsterCoin : Number(user.hamsterCoin) || 0;
    const assetPrice = typeof asset.price === 'number' ? asset.price : Number(asset.price) || 0;
    
    console.log('💰 Purchase check:', {
      discordId,
      assetId,
      currentCoins,
      assetPrice,
      hasEnough: currentCoins >= assetPrice,
      userHamsterCoin: user.hamsterCoin,
      userHamsterCoinType: typeof user.hamsterCoin,
      assetPriceValue: asset.price,
      assetPriceType: typeof asset.price,
      comparison: `${currentCoins} >= ${assetPrice} = ${currentCoins >= assetPrice}`,
    });

    if (currentCoins < assetPrice) {
      console.error('❌ Insufficient funds:', {
        currentCoins,
        assetPrice,
        difference: assetPrice - currentCoins,
      });
      return NextResponse.json(
        { error: 'Not enough HamsterCoin', details: `You have ${currentCoins} but need ${assetPrice}` },
        { status: 400 }
      );
    }

    // Deduct coins and add to purchased assets - need to fetch document again for save
    const userDoc = await UserProgress.findOne({ discordId });
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const newBalance = currentCoins - assetPrice;
    const assetIdStr = String(assetId);
    
    // Use findOneAndUpdate with $addToSet for atomic array update
    // This is more reliable than save() for array updates
    const updateQuery: any = {
      $set: { hamsterCoin: newBalance },
    };
    
    // Only add to array if not already present
    const currentPurchasedAssets = (userDoc.purchasedAssets || []).map((id: any) => String(id));
    if (!currentPurchasedAssets.includes(assetIdStr)) {
      updateQuery.$addToSet = { purchasedAssets: assetIdStr };
    }
    
    console.log('💾 Update query:', updateQuery);
    
    const updatedUser = await UserProgress.findOneAndUpdate(
      { discordId },
      updateQuery,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      throw new Error('Failed to update user after purchase');
    }
    
    // Get the updated purchased assets
    const verifiedPurchasedAssets = (updatedUser.purchasedAssets || []).map((id: any) => String(id));
    const verifiedBalance = Number(updatedUser.hamsterCoin) || 0;
    
    console.log('✅ Purchase successful:', {
      newBalance,
      verifiedBalance,
      verifiedPurchasedAssets,
      verifiedCount: verifiedPurchasedAssets.length,
      assetId: assetIdStr,
      assetIdInVerified: verifiedPurchasedAssets.includes(assetIdStr),
    });

    return NextResponse.json({
      success: true,
      message: 'Asset purchased successfully',
      newBalance: verifiedBalance,
      purchasedAssets: verifiedPurchasedAssets,
    });
  } catch (error: any) {
    console.error('Error buying asset:', error);
    return NextResponse.json(
      { error: 'Failed to buy asset', details: error.message },
      { status: 500 }
    );
  }
}

