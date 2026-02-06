const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../../models/Profile');
const Transaction = require('../../../models/Transaction');
const Shop = require('../../../models/Shop');
const Cosmetic = require('../../../models/Cosmetic');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('View DUB server statistics')
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
            
            const totalUsers = await Profile.countDocuments();
            const bannedUsers = await Profile.countDocuments({ 'banned.status': true });
            const eliteDonators = await Profile.countDocuments({ 'roles.isEliteDonator': true });
            const fullLockers = await Profile.countDocuments({ 'roles.hasFullLocker': true });
            const boosters = await Profile.countDocuments({ 'roles.isBooster': true });
            
            const totalTransactions = await Transaction.countDocuments();
            
            const totalVbucksSpent = await Transaction.aggregate([
                { $match: { type: 'purchase', currency: 'vbucks' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const totalVbucksInCirculation = await Profile.aggregate([
                { $group: { _id: null, total: { $sum: '$vbucks' } } }
            ]);
            
            const activeShops = await Shop.countDocuments({ isActive: true });
            const totalCosmetics = await Cosmetic.countDocuments();
            
            const uptimeSeconds = process.uptime();
            const uptimeHours = Math.floor(uptimeSeconds / 3600);
            const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('DUB Server Statistics')
                .addFields(
                    { name: 'Total Users', value: `${totalUsers}`, inline: true },
                    { name: 'Active Users', value: `${totalUsers - bannedUsers}`, inline: true },
                    { name: 'Banned Users', value: `${bannedUsers}`, inline: true },
                    { name: 'Elite Donators', value: `${eliteDonators}`, inline: true },
                    { name: 'Full Lockers', value: `${fullLockers}`, inline: true },
                    { name: 'Boosters', value: `${boosters}`, inline: true },
                    { name: 'Total Transactions', value: `${totalTransactions}`, inline: true },
                    { name: 'Total Vbucks Spent', value: `${totalVbucksSpent[0]?.total || 0}`, inline: true },
                    { name: 'Vbucks in Circulation', value: `${totalVbucksInCirculation[0]?.total || 0}`, inline: true },
                    { name: 'Active Shops', value: `${activeShops}`, inline: true },
                    { name: 'Total Cosmetics', value: `${totalCosmetics}`, inline: true },
                    { name: 'Server Uptime', value: `${uptimeHours}h ${uptimeMinutes}m`, inline: true },
                    { name: 'Season', value: `${config.project.season}`, inline: true },
                    { name: 'Version', value: `${config.project.version}`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Server stats command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to fetch server statistics. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};