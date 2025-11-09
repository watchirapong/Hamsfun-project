import { NextRequest, NextResponse } from 'next/server';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1402212628956315709';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'a2P9QW4U9WT6zX8dALT6QU86OwqDhB_v';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Exchange code for token
  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();

      // Get guild member info to get nickname
      const GUILD_ID = '699984143542517801';
      let nickname = userData.username || userData.global_name || 'Unknown';
      
      try {
        const guildMemberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (guildMemberResponse.ok) {
          const guildMember = await guildMemberResponse.json();
          if (guildMember.nick) {
            nickname = guildMember.nick;
          }
        }
      } catch (error) {
        console.error('Error fetching guild member:', error);
        // Fallback to username if guild member fetch fails
      }

      // Add nickname to user data
      const userDataWithNickname = {
        ...userData,
        nickname: nickname,
      };

      // Create response with user data
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.set('discord_user', JSON.stringify(userDataWithNickname), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      response.cookies.set('discord_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }
  } catch (error) {
    console.error('Discord auth error:', error);
  }

  return NextResponse.redirect(new URL('/', request.url));
}

