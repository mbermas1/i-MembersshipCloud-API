// pages/api/auth/forgot-password.js
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import initMiddleware from '../init-middleware'; // Import initMiddleware function
import connectToDatabase from '../db';

const FRONTEND_URL = 'http://localhost:3000/auth/reset-password';

export default async function handler(req, res) {
    const middleware = initMiddleware(async (req, res) => {
        try {
            if (req.method === 'POST') {
                const { email } = req.body;

                // Basic validation
                if (!email) {
                    return res.status(400).json({ message: 'Email address is required' });
                }

                // Create a MySQL connection
                const connection = await connectToDatabase();

                try {
                    // Begin a transaction
                    await connection.beginTransaction();

                    // Generate a reset token and send an email
                    const resetToken = await generateResetToken(email, connection);

                    if (resetToken) {
                        await sendResetEmail(email, resetToken);

                        // Commit the transaction
                        await connection.commit();

                        return res.status(200).json({ success: true, code: 200, message: 'Password reset email sent' });
                    } else {
                        // Rollback transaction in case of error
                        await connection.rollback();
                        return res.status(404).json({ message: 'Email address not found' });
                    }
                } catch (error) {
                    // Rollback the transaction on error
                    await connection.rollback();
                    console.error('Error processing forgot-password request:', error.message);
                    return res.status(500).json({ message: error.message });
                } finally {
                    // Release the connection back to the pool
                    // connection.release();
                }
            } else {
                res.setHeader('Allow', ['POST']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        } catch (error) {
            console.error('Error executing forgot-password query:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    await middleware(req, res);
}

const generateResetToken = async (email, connection) => {
    // Find the user by email
    const userRows = await getUserByEmail(email, connection);
    const user = userRows[0]; // Assuming the email is unique, and there is at most one user with this email

    if (user) {
        // Generate a token
        const token = crypto.randomBytes(20).toString('hex');

        // Save the token and its expiration time in the database
        await updateUserResetToken(user.ID, token, Date.now() + 3600000, connection); // 1 hour

        return token;
    } else {
        return null;
    }
};

const getUserByEmail = async (email, connection) => {
    const [rows] = await connection.execute('SELECT * FROM User WHERE EmailAddress = ?', [email]);
    return rows;
};

const updateUserResetToken = async (id, resetToken, resetTokenExpires, connection) => {
    // Convert the timestamp to a MySQL DATETIME format
    const resetTokenExpiresDateTime = new Date(resetTokenExpires).toISOString().slice(0, 19).replace('T', ' ');

    const queryUser = `
        UPDATE User
        SET ResetToken = ?, ResetTokenExpires = ?
        WHERE ID = ?
    `;

    await connection.execute(queryUser, [resetToken, resetTokenExpiresDateTime, id]);
};

const sendResetEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });

    const mailOptions = {
        to: email,
        from: 'no-reply@i-visits.com',
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${FRONTEND_URL}?token=${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    return transporter.sendMail(mailOptions);
};
