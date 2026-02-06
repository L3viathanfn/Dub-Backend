const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display available commands'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('DUB Backend Commands')
            .setDescription('Here are all available commands:')
            .addFields(
                { 
                    name: 'User Commands', 
                    value: '`/register` - Create a new account\n' +
                           '`/profile` - View your profile\n' +
                           '`/locker` - View your locker items\n' +
                           '`/stats` - View your statistics\n' +
                           '`/balance` - Check your vbucks balance\n' +
                           '`/rewards` - View available rewards\n' +
                           '`/claim` - Claim a reward\n' +
                           '`/help` - Display this help message',
                    inline: false 
                },
                {
                    name: 'Getting Started',
                    value: 'New to DUB? Start by using `/register` to create your account!',
                    inline: false
                }
            )
            .setFooter({ text: 'DUB Backend System' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};