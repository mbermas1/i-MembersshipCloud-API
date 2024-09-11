// pages/api/auth/reset-password.js
import bcrypt from 'bcrypt';
import initMiddleware from '../init-middleware'; // Import initMiddleware function
import connectToDatabase from '../db';

export default async function handler(req, res) {
    const middleware = initMiddleware(async (req, res) => {
        if (req.method === 'POST') {
            try {
                const { token, newPassword } = req.body;

                // Basic validation
                if (!token || !newPassword) {
                    return res.status(400).json({ message: 'Token and new password are required' });
                }

                // Create a MySQL connection
                const connection = await connectToDatabase();

                try {
                    // Begin a transaction
                    await connection.beginTransaction();

                    // Reset the password
                    const success = await resetPassword(token, newPassword, connection);
                    if (success) {
                        // Commit the transaction
                        await connection.commit();
                        return res.status(200).json({ success: true, code: 200, message: 'Password has been reset successfully' });
                    } else {
                        // Rollback the transaction in case of failure
                        await connection.rollback();
                        return res.status(400).json({ success: false, code: 400, message: 'Token is invalid or has expired' });
                    }
                } catch (error) {
                    // Rollback the transaction on error
                    await connection.rollback();
                    console.error('Error processing reset-password request:', error.message);
                    return res.status(500).json({ message: error.message });
                } finally {
                    // Release the connection back to the pool
                    // connection.release();
                }
            } catch (error) {
                console.error('Error handling reset-password:', error.message);
                return res.status(500).json({ message: error.message });
            }
        } else {
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    });

    await middleware(req, res);
}

const resetPassword = async (token, newPassword, connection) => {
    try {
        const userRows = await getUserByResetToken(token, connection);
        const user = userRows[0]; // Assuming the token is unique, and there is at most one user with this token

        if (user) {
            // Hash the new password before saving it
            // const hashedPassword = await bcrypt.hash(newPassword, 10);

            await updateUserByResetToken(user.ID, newPassword, connection);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw new Error('Error resetting password');
    }
};

const getUserByResetToken = async (resetToken, connection) => {
    const [rows] = await connection.query(
        'SELECT * FROM User WHERE ResetToken = ? AND ResetTokenExpires > NOW()',
        [resetToken]
    );
    return rows;
};

const updateUserByResetToken = async (id, newPassword, connection) => {
    const queryUser = `
        UPDATE User
        SET Password = ?, ResetToken = NULL, ResetTokenExpires = NULL
        WHERE ID = ?
    `;
    await connection.query(queryUser, [newPassword, id]);
};
