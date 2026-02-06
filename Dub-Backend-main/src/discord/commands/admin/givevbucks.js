const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../../models/Profile');
const Transaction = require('../../../models/Transaction');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givevbucks')
        .setDescription('Give vbucks to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give vbucks to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of vbucks to give')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000000))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const adminMember = await interaction.guild.members.fetch(interaction.user.id);
            
            if (!adminMember.roles.cache.has(config.discord.roles.admin)) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Permission Denied')
                    .setDescription('You do not have administrator permissions.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            
            const profile = await Profile.findOne({ discordId: targetUser.id });
            
            if (!profile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('User Not Found')
                    .setDescription('This user does not have a DUB account.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            await profile.addVbucks(amount);
            
            const transaction = new Transaction({
                userId: profile.discordId,
                type: 'admin_grant',
                category: 'vbucks',
                amount: amount,
                currency: 'vbucks',
                adminId: interaction.user.id,
                paymentMethod: 'admin',
                description: `Admin ${interaction.user.username} granted ${amount} vbucks`
            });
            
            await transaction.save();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Vbucks Granted')
                .setDescription(`Successfully granted ${amount} vbucks to ${targetUser.username}.`)
                .addFields(
                    { name: 'User', value: targetUser.username, inline: true },
                    { name: 'Amount Given', value: `${amount}`, inline: true },
                    { name: 'New Balance', value: `${profile.vbucks}`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Give vbucks command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to give vbucks. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};