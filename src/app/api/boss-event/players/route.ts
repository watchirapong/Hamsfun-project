import { NextRequest, NextResponse } from 'next/server';

// Store active players in memory (in production, use Redis or database)
interface ActivePlayer {
  discordId: string;
  name: string;
  avatarUrl?: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  lastUpdate: number;
}

let activePlayers = new Map<string, ActivePlayer>();
const PLAYER_TIMEOUT = 5000; // Remove player if no update for 5 seconds

// Clean up inactive players
setInterval(() => {
  const now = Date.now();
  for (const [discordId, player] of activePlayers.entries()) {
    if (now - player.lastUpdate > PLAYER_TIMEOUT) {
      activePlayers.delete(discordId);
    }
  }
}, 1000);

export async function GET(request: NextRequest) {
  try {
    // Return all active players
    const players = Array.from(activePlayers.values());
    return NextResponse.json({ players });
  } catch (error: any) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId, name, avatarUrl, position, health, maxHealth } = body;

    if (!discordId || !position) {
      return NextResponse.json(
        { error: 'Discord ID and position are required' },
        { status: 400 }
      );
    }

    // Update or create player
    activePlayers.set(discordId, {
      discordId,
      name: name || 'Player',
      avatarUrl,
      position,
      health: health ?? maxHealth ?? 50,
      maxHealth: maxHealth ?? 50,
      lastUpdate: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player', details: error.message },
      { status: 500 }
    );
  }
}

