import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1402212628956315709';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'hL7Lt63Jckmrang3hxraAbyr2eHfnib5';
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
      let nickname: string | null = null;
      
      try {
        const guildMemberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (guildMemberResponse.ok) {
          const guildMember = await guildMemberResponse.json();
          // Set nickname to the guild nickname (can be null if user has no nickname in guild)
          nickname = guildMember.nick || null;
        }
      } catch (error) {
        console.error('Error fetching guild member:', error);
        // If fetch fails, keep nickname as null
      }

      // Add nickname to user data
      const userDataWithNickname = {
        ...userData,
        nickname: nickname,
      };

      // Save user data to MongoDB on first login
      try {
        console.log('Attempting to connect to MongoDB...');
        await connectDB();
        console.log('MongoDB connected successfully');
        
        const discordId = userData.id;
        const name = userData.global_name || userData.username || 'Unknown';
        const username = userData.username || 'Unknown';
        const avatarUrl = userData.avatar 
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=64`
          : undefined;

        console.log(`Looking for user with discordId: ${discordId}`);
        // Check if user already exists
        const existingUser = await UserProgress.findOne({ discordId });
        
        if (!existingUser) {
          console.log(`Creating new user: ${name} (${discordId})`);
          // Create new user with initial values
          const newUser = await UserProgress.create({
            discordId,
            name,
            username,
            nickname: nickname || undefined, // Save guild nickname if it exists, otherwise undefined
            avatarUrl,
            hamsterCoin: 0, // Start with 0 coins
            gachaTicket: 0, // Start with 0 tickets
            unlockedPlanets: [1], // Start with Earth 1 unlocked
            earth6Completed: false,
            points: 10,
            atk: 10,
            hp: 10,
            agi: 10,
            answers: {
              unityBasic: [],
              unityAsset: [],
            },
            achievements: [],
          });
          console.log(`✅ New user created successfully: ${name} (${discordId})`);
          console.log(`User document ID: ${newUser._id}`);
          console.log(`Nickname: ${nickname || 'none'}`);
        } else {
          console.log(`User already exists, updating: ${name} (${discordId})`);
          // Update existing user's name, nickname, and avatar if they changed
          // Always update nickname from guild (can be null if user has no nickname)
          const updatedUser = await UserProgress.findOneAndUpdate(
            { discordId },
            {
              name,
              username,
              nickname: nickname || undefined, // Always update with guild nickname (or undefined if null)
              avatarUrl: avatarUrl || existingUser.avatarUrl,
            },
            { new: true }
          );
          console.log(`✅ User updated successfully: ${updatedUser?._id}`);
          console.log(`Nickname: ${nickname || 'none'}`);
        }
      } catch (error: any) {
        console.error('❌ Error saving user to database:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
        // Continue even if database save fails - don't block login
      }

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

