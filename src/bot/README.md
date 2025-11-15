# Discord Bot - Role Migration System

This Discord bot provides a command to migrate all users from one role to another and delete the old role.

## Features

- `/migrate-role` - Move all users from one role to another and delete the old role
  - Requires `Manage Roles` permission
  - Safely handles role hierarchy
  - Provides detailed migration results

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot" and confirm
5. Under "Token", click "Reset Token" and copy the bot token
6. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent (if needed)
7. Under "OAuth2" > "URL Generator":
   - Select scopes: `bot`, `applications.commands`
   - Select bot permissions: `Manage Roles`
   - Copy the generated URL and open it in your browser to invite the bot to your server

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project (or add to your existing `.env` file):

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
```

- `DISCORD_BOT_TOKEN`: Your bot's token from the Developer Portal
- `DISCORD_CLIENT_ID`: Your application's Client ID (found in General Information)
- `DISCORD_GUILD_ID`: Your Discord server (guild) ID

### 3. Install Dependencies

The bot requires `discord.js` which should already be installed. If not:

```bash
npm install discord.js
```

### 4. Run the Bot

You can run the bot in several ways:

#### Option A: As a separate process (Recommended)

Create a new script in `package.json`:

```json
{
  "scripts": {
    "bot": "tsx src/bot/index.ts",
    "bot:dev": "tsx watch src/bot/index.ts"
  }
}
```

Then install `tsx` for running TypeScript:

```bash
npm install --save-dev tsx
```

Run the bot:

```bash
npm run bot
```

#### Option B: Using Node.js directly

Compile TypeScript first:

```bash
npx tsc src/bot/index.ts --outDir dist --esModuleInterop --resolveJsonModule
node dist/bot/index.js
```

#### Option C: Using ts-node

```bash
npm install --save-dev ts-node
npx ts-node src/bot/index.ts
```

## Usage

1. Make sure the bot is running and online in your Discord server
2. The bot must have a role higher than both the old and new roles
3. Use the command in any channel:

```
/migrate-role old-role:@OldRole new-role:@NewRole
```

### Example

```
/migrate-role old-role:@Member new-role:@Verified
```

This will:
1. Find all users with the `@Member` role
2. Add the `@Verified` role to all those users
3. Remove the `@Member` role from all those users
4. Delete the `@Member` role

## Permissions Required

- **User**: Must have `Manage Roles` permission
- **Bot**: Must have `Manage Roles` permission and a role higher than both the old and new roles

## Safety Features

- Checks bot permissions before executing
- Validates role hierarchy
- Handles errors gracefully
- Provides detailed migration reports
- Prevents deleting roles that the bot cannot manage

## Troubleshooting

### Bot doesn't respond to commands

1. Make sure the bot is online and running
2. Check that commands were registered (check console logs)
3. Verify the bot has been invited with `applications.commands` scope

### "Bot does not have permission to manage roles"

1. Go to Server Settings > Roles
2. Make sure the bot's role is above both the old and new roles
3. Ensure the bot role has "Manage Roles" permission enabled

### "You do not have permission to manage roles"

- The user running the command needs the "Manage Roles" permission

## Notes

- The bot must be kept running for commands to work
- Consider using a process manager like PM2 for production
- The bot can be run alongside your Next.js application or as a separate service

