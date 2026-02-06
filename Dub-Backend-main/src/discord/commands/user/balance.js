const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../../models/Profile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your vbucks balance'),
    
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
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('Vbucks Balance')
                .setDescription(`You currently have **${profile.vbucks}** vbucks.`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Balance command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to fetch balance. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};