import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ShopAsset from '@/models/ShopAsset';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const assets = await ShopAsset.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      assets: assets.map(asset => ({
        _id: asset._id.toString(),
        name: asset.name,
        description: asset.description,
        link: asset.link,
        category: asset.category,
        subCategory: asset.subCategory,
        price: asset.price,
        createdBy: asset.createdBy,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description, link, category, price, createdBy } = body;

    if (!name || !description || !link || !category || price === undefined || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const asset = await ShopAsset.create({
      name,
      description,
      link,
      category,
      price: Number(price),
      createdBy,
    });

    return NextResponse.json({
      success: true,
      asset: {
        _id: asset._id.toString(),
        name: asset.name,
        description: asset.description,
        link: asset.link,
        category: asset.category,
        subCategory: asset.subCategory,
        price: asset.price,
        createdBy: asset.createdBy,
      },
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset', details: error.message },
      { status: 500 }
    );
  }
}

