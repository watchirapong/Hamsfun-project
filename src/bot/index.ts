import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ChatInputCommandInteraction, PermissionFlagsBits, Role, GuildMember } from 'discord.js';

// Bot configuration
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1402212628956315709';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '699984143542517801';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('migrate-role')
    .setDescription('Move all users from one role to another and delete the old role')
    .addRoleOption(option =>
      option
        .setName('old-role')
        .setDescription('The role to migrate from (will be deleted)')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('new-role')
        .setDescription('The role to migrate users to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .toJSON(),
];

// Register commands when bot starts
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Handle slash command interactions
async function handleMigrateRole(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
  }

  const oldRole = interaction.options.getRole('old-role', true) as Role;
  const newRole = interaction.options.getRole('new-role', true) as Role;

  // Check if user has permission to manage roles
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ 
      content: '❌ You do not have permission to manage roles.', 
      ephemeral: true 
    });
  }

  // Check if bot has permission to manage roles
  const botMember = await interaction.guild.members.fetch(client.user!.id);
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ 
      content: '❌ Bot does not have permission to manage roles. Please check bot permissions.', 
      ephemeral: true 
    });
  }

  // Check if roles are valid
  if (oldRole.id === newRole.id) {
    return interaction.reply({ 
      content: '❌ Old role and new role cannot be the same.', 
      ephemeral: true 
    });
  }

  // Check if bot can manage these roles (bot's role must be higher than both roles)
  const botRole = botMember.roles.highest;
  if (oldRole.position >= botRole.position || newRole.position >= botRole.position) {
    return interaction.reply({ 
      content: '❌ Bot\'s role must be higher than both the old and new roles to manage them.', 
      ephemeral: true 
    });
  }

  await interaction.deferReply({ ephemeral: false });

  try {
    // Get all members with the old role
    const membersWithOldRole = interaction.guild.members.cache.filter(
      member => member.roles.cache.has(oldRole.id)
    );

    const memberCount = membersWithOldRole.size;
    
    if (memberCount === 0) {
      // No members to migrate, just delete the role
      await oldRole.delete();
      return interaction.editReply({ 
        content: `✅ No members found with the role "${oldRole.name}". The role has been deleted.` 
      });
    }

    let migratedCount = 0;
    let failedCount = 0;
    const failedUsers: string[] = [];

    // Migrate each member
    for (const [memberId, member] of membersWithOldRole) {
      try {
        // Add new role and remove old role
        await member.roles.add(newRole);
        await member.roles.remove(oldRole);
        migratedCount++;
      } catch (error: any) {
        failedCount++;
        failedUsers.push(member.displayName || member.user.username);
        console.error(`Failed to migrate user ${memberId}:`, error.message);
      }
    }

    // Delete the old role
    let roleDeleted = false;
    try {
      await oldRole.delete();
      roleDeleted = true;
    } catch (error: any) {
      console.error('Failed to delete role:', error.message);
    }

    // Build response message
    let response = `✅ **Role Migration Complete**\n\n`;
    response += `**Old Role:** ${oldRole.name}\n`;
    response += `**New Role:** ${newRole.name}\n\n`;
    response += `**Results:**\n`;
    response += `• Successfully migrated: ${migratedCount} users\n`;
    
    if (failedCount > 0) {
      response += `• Failed to migrate: ${failedCount} users\n`;
      if (failedUsers.length > 0 && failedUsers.length <= 10) {
        response += `• Failed users: ${failedUsers.join(', ')}\n`;
      }
    }
    
    response += `• Role deleted: ${roleDeleted ? '✅ Yes' : '❌ No'}\n`;

    await interaction.editReply({ content: response });

  } catch (error: any) {
    console.error('Error during role migration:', error);
    await interaction.editReply({ 
      content: `❌ An error occurred during role migration: ${error.message}` 
    });
  }
}

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'migrate-role') {
    await handleMigrateRole(interaction);
  }
});

// Bot ready event
client.once('ready', async () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
  await registerCommands();
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Start the bot
if (BOT_TOKEN) {
  client.login(BOT_TOKEN).catch((error) => {
    console.error('Failed to login:', error);
    console.error('Please make sure DISCORD_BOT_TOKEN is set in your environment variables.');
  });
} else {
  console.error('❌ DISCORD_BOT_TOKEN is not set. Please set it in your environment variables.');
}

export default client;

