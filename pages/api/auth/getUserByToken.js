// pages/api/getUserByToken.js

import connectToDatabase from '../db';
import initMiddleware from '../init-middleware'; // Import initMiddleware function
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    // Apply CORS middleware if necessary
    const middleware = initMiddleware(async (req, res) => {
        // Retrieve token from request headers or body
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Token not provided' });
        }

        try {
            // Verify token
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

            // Extract user ID from decoded token
            const userId = decodedToken.id;

            // Create a MySQL connection pool
            const connection = await connectToDatabase();

            // Execute query to retrieve user info using user ID
            const [userRows] = await connection.execute(
                `SELECT User.* FROM User
                    JOIN Clients ON User.ClientID = Clients.ID
                    WHERE User.ID = ?`,
                [userId]
            );

            // If user exists
            if (userRows.length > 0) {
                const user = userRows[0];
                delete user.Password;
                // Remove sensitive data (e.g., password) before sending response
                // Return user info
                res.status(200).json({ success: true, user });
            } else {
                // If user does not exist
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (error) {
            console.error('Error executing getUserByToken query:', error.message);
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                res.status(401).json({ success: false, message: 'Invalid or expired token' });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    });

    await middleware(req, res); // Apply middleware
}
