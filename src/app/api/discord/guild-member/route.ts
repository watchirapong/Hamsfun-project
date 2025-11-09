import { NextRequest, NextResponse } from 'next/server';

const GUILD_ID = '699984143542517801';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get guild member info
    const guildMemberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!guildMemberResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch guild member' }, { status: 404 });
    }

    const guildMember = await guildMemberResponse.json();
    
    return NextResponse.json({
      nickname: guildMember.nick || null,
      roles: guildMember.roles || [],
    });
  } catch (error: any) {
    console.error('Error fetching guild member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guild member', details: error.message },
      { status: 500 }
    );
  }
}

