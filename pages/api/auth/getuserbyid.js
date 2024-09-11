// pages/api/getUserByToken.js

import connectToDatabase from '../db';
import initMiddleware from '../init-middleware';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    // Apply CORS middleware if necessary
    const middleware = initMiddleware(async (req, res) => {
        // Retrieve token from request headers or body
         
        try { 
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ success: false, message: 'User ID not provided' });
            }
            // Create a MySQL connection pool
            const connection = await connectToDatabase();

            // Execute query to retrieve user info using user ID
            const [userRows] = await connection.execute(
                `SELECT * FROM User WHERE ID = ?`,
                [id]
            );

            // If user exists
            if (userRows.length > 0) {
                const user = userRows[0];
                delete user.Password;
                // Remove sensitive data (e.g., password) before sending response
                // Return user info
                res.status(200).json({ success: true, code: 200, message: "user get successfully!!", data: user });
            } else {
                // If user does not exist
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (error) {
            console.error('Error executing getUserById query:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    await middleware(req, res); // Apply middleware
}
