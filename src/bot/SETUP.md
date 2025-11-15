# Quick Setup Guide

## Step 1: Get Your Bot Token

1. Go to https://discord.com/developers/applications
2. Create a new application or select an existing one
3. Go to "Bot" section
4. Click "Reset Token" and copy it
5. Enable "Server Members Intent" under Privileged Gateway Intents

## Step 2: Invite Bot to Server

1. Go to "OAuth2" > "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions: `Manage Roles`
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

## Step 3: Set Environment Variables

Add these to your `.env.local` file (or your environment):

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_server_id_here
```

**How to find these:**
- `DISCORD_BOT_TOKEN`: From Step 1
- `DISCORD_CLIENT_ID`: Found in "General Information" section (Application ID)
- `DISCORD_GUILD_ID`: Right-click your server > "Copy Server ID" (enable Developer Mode in Discord settings first)

## Step 4: Set Bot Role Position

1. Go to your server settings > Roles
2. Make sure the bot's role is **above** both the old role and new role you want to migrate
3. The bot role must have "Manage Roles" permission

## Step 5: Run the Bot

```bash
npm run bot
```

Or for development with auto-reload:

```bash
npm run bot:dev
```

## Step 6: Use the Command

In any channel in your Discord server:

```
/migrate-role old-role:@OldRole new-role:@NewRole
```

Replace `@OldRole` and `@NewRole` with the actual role mentions or role names.

## Troubleshooting

**Bot doesn't appear online:**
- Check that the bot process is running
- Verify the bot token is correct

**Command not found:**
- Wait a few seconds after starting the bot (commands need to register)
- Make sure the bot was invited with `applications.commands` scope

**Permission errors:**
- Ensure bot role is above both roles
- Check bot has "Manage Roles" permission
- Verify you have "Manage Roles" permission to use the command

