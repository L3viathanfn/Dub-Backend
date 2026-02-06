const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Shop = require('../../../models/Shop');
const Cosmetic = require('../../../models/Cosmetic');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refreshshop')
        .setDescription('Manually refresh the item shop')
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
            
            await Shop.updateMany({ isActive: true }, { isActive: false });
            
            const allCosmetics = await Cosmetic.find({ availability: 'shop' });
            
            if (allCosmetics.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Shop Refresh Failed')
                    .setDescription('No cosmetics available in the database for shop rotation.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const shuffled = allCosmetics.sort(() => 0.5 - Math.random());
            
            const featuredItems = shuffled.slice(0, 6).map((item, index) => ({
                cosmeticId: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                price: item.price,
                displayOrder: index
            }));
            
            const dailyItems = shuffled.slice(6, 14).map((item, index) => ({
                cosmeticId: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                price: item.price,
                displayOrder: index
            }));
            
            const newShop = new Shop({
                date: new Date(),
                featured: featuredItems,
                daily: dailyItems,
                special: [],
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                season: config.project.season,
                version: config.project.version,
                isActive: true,
                createdBy: interaction.user.username,
                metadata: {
                    totalItems: featuredItems.length + dailyItems.length,
                    featuredCount: featuredItems.length,
                    dailyCount: dailyItems.length,
                    specialCount: 0
                }
            });
            
            await newShop.save();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Shop Refreshed')
                .setDescription('The item shop has been successfully refreshed.')
                .addFields(
                    { name: 'Featured Items', value: `${featuredItems.length}`, inline: true },
                    { name: 'Daily Items', value: `${dailyItems.length}`, inline: true },
                    { name: 'Expires At', value: newShop.expiresAt.toLocaleString(), inline: false }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Refresh shop command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to refresh shop. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};