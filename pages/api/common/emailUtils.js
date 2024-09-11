// emailUtils.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_SENDER_MAIL,
            to: to,
            subject: subject,
            html: text
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

export function parseMessageJSON(messageJSON) {
    const messageObject = JSON.parse(messageJSON);
    const blocks = messageObject.blocks;
    let htmlContent = '';

    blocks.forEach(block => {
        const text = block.text;
        let styles = '';

        const inlineStyleRanges = block.inlineStyleRanges;
        inlineStyleRanges.forEach(style => {
            switch (style.style) {
                case 'fontsize-24':
                    styles += 'font-size: 24px;';
                    break;
                case 'fontfamily-Arial':
                    styles += 'font-family: Arial;';
                    break;
                case 'color-rgb(97,189,109)':
                    styles += 'color: rgb(97, 189, 109);';
                    break;
                case 'BOLD':
                    styles += 'font-weight: bold;';
                    break;
                case 'ITALIC':
                    styles += 'font-style: italic;';
                    break;
                default:
                    break;
            }
        });

        htmlContent += `<p style="${styles}">${text}</p>`;
    });

    return htmlContent;
}

export function replacePlaceholders(htmlContent, placeholders) {
    return htmlContent.replace(/{(.*?)}/g, (_, key) => placeholders[key.trim()] || '');
}
