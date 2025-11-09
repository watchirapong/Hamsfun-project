import { NextRequest, NextResponse } from 'next/server';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1402212628956315709';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'a2P9QW4U9WT6zX8dALT6QU86OwqDhB_v';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

export async function GET(request: NextRequest) {
  // Redirect to Discord OAuth - added guilds scope to get guild member info
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds`;
  return NextResponse.redirect(discordAuthUrl);
}
