const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter = null;

if (config.email.enabled) {
    transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: false,
        auth: {
            user: config.email.user,
            pass: config.email.password
        }
    });
}

const sendWelcomeEmail = async (email, username) => {
    if (!transporter) {
        console.log('Email service not configured, skipping welcome email');
        return;
    }
    
    try {
        await transporter.sendMail({
            from: `"DUB Backend" <${config.email.user}>`,
            to: email,
            subject: 'Welcome to DUB',
            html: `
                <h1>Welcome to DUB, ${username}!</h1>
                <p>Your account has been created successfully.</p>
                <p>You have received:</p>
                <ul>
                    <li>${config.defaults.vbucks} vbucks</li>
                    <li>Crystal outfit</li>
                    <li>Free Battle Pass</li>
                </ul>
                <p>Enjoy playing on our server!</p>
            `
        });
        
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }
};

const sendPasswordResetEmail = async (email, username, resetToken) => {
    if (!transporter) {
        console.log('Email service not configured, skipping password reset email');
        return;
    }
    
    try {
        await transporter.sendMail({
            from: `"DUB Backend" <${config.email.user}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>Hello ${username},</p>
                <p>We received a request to reset your password.</p>
                <p>Your reset token is: <strong>${resetToken}</strong></p>
                <p>If you did not request this, please ignore this email.</p>
            `
        });
        
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
    }
};

const sendPurchaseConfirmation = async (email, username, itemName, price) => {
    if (!transporter) {
        return;
    }
    
    try {
        await transporter.sendMail({
            from: `"DUB Backend" <${config.email.user}>`,
            to: email,
            subject: 'Purchase Confirmation',
            html: `
                <h1>Purchase Confirmation</h1>
                <p>Hello ${username},</p>
                <p>You have successfully purchased <strong>${itemName}</strong> for ${price} vbucks.</p>
                <p>Thank you for your purchase!</p>
            `
        });
    } catch (error) {
        console.error('Failed to send purchase confirmation email:', error);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendPurchaseConfirmation
};