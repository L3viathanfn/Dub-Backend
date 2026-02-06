const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

const commandFolders = ['admin', 'user'];

for (const folder of commandFolders) {
    const commandsPath = path.join(__dirname, 'commands', folder);
    
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(`[DISCORD] Loaded command: ${command.data.name}`);
                }
            } catch (error) {
                console.error(`[DISCORD] Error loading command ${file}:`, error);
            }
        }
    }
}

client.once('ready', () => {
    console.log(`[DISCORD] Bot logged in as ${client.user.tag}`);
    client.user.setActivity('DUB Backend | /help', { type: 'PLAYING' });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[DISCORD] No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[DISCORD] Error executing ${interaction.commandName}:`, error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Error')
            .setDescription('There was an error executing this command.')
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

async function sendLog(channelType, embed) {
    try {
        const channelId = config.discord.channels[channelType];
        if (!channelId) return;
        
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[DISCORD] Failed to send log to ${channelType}:`, error);
    }
}

module.exports = client;
module.exports.sendLog = sendLog;