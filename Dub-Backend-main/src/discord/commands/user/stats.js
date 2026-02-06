const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../../models/Profile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your game statistics'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const profile = await Profile.findOne({ discordId: interaction.user.id });
            
            if (!profile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Profile Not Found')
                    .setDescription('You do not have a DUB account. Use /register to create one.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const kd = profile.stats.deaths > 0 
                ? (profile.stats.kills / profile.stats.deaths).toFixed(2)
                : profile.stats.kills.toFixed(2);
            
            const winRate = profile.stats.matchesPlayed > 0
                ? ((profile.stats.wins / profile.stats.matchesPlayed) * 100).toFixed(2)
                : '0.00';
            
            const hoursPlayed = (profile.stats.minutesPlayed / 60).toFixed(1);
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`${profile.username}'s Statistics`)
                .addFields(
                    { name: 'Wins', value: `${profile.stats.wins}`, inline: true },
                    { name: 'Kills', value: `${profile.stats.kills}`, inline: true },
                    { name: 'Deaths', value: `${profile.stats.deaths}`, inline: true },
                    { name: 'Matches Played', value: `${profile.stats.matchesPlayed}`, inline: true },
                    { name: 'K/D Ratio', value: `${kd}`, inline: true },
                    { name: 'Win Rate', value: `${winRate}%`, inline: true },
                    { name: 'Time Played', value: `${hoursPlayed} hours`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Stats command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to fetch statistics. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};