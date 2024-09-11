// pages/api/login.js

import connectToDatabase from '../db';
import initMiddleware from '../init-middleware'; // Import initMiddleware function
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    // Apply CORS middleware if necessary
    const middleware = initMiddleware(async (req, res) => {
        // Create a MySQL connection pool
        try {
            const connection = await connectToDatabase();
            // Retrieve username and password from request body
            const { email, password, organizationId } = req.body;

            // Execute query to retrieve user info using username
            const [userRows] = await connection.execute(
                `SELECT User.* FROM User
                    JOIN Clients ON User.ClientID = Clients.ID
                    WHERE User.EmailAddress = ? AND User.Password = ? AND Clients.CompanyName = ?`,
                [email, password, organizationId]
            );

            // If user exists
            if (userRows.length > 0) {
                const user = userRows[0];
                const passwordMatch = true;
                // Compare hashed password
                // const passwordMatch = await bcrypt.compare(password, user.Password);
                if (passwordMatch) {
                    // Passwords match, generate authentication token
                    const token = jwt.sign(
                        { id: user.ID, role: user.RoleTypeID },
                        process.env.JWT_SECRET || 'kgjeyubnamdopqwvgh',
                        { expiresIn: '1h' }
                      );
                    // Remove password from user object 

                    // const userResponse = {
                    //     ID: user.ID,
                    //     ClientID: user.ClientID,
                    //     RoleTypeID: user.RoleTypeID,
                    //     FirstName: user.FirstName,
                    //     EmailAddress: user.EmailAddress,
                    //     IsActive: user.IsActive,
                    //     LastName: user.LastName,
                    //     token: token
                    // }; 
                    const api_token = token;
                    // Return user with authentication token
                    return res.status(200).json({ success: true, code: 200 , api_token });
                } else {
                    // Passwords do not match
                    res.status(401).json({ success: false,  code: 500 , message: 'Invalid username or password' });
                }
            } else {
                // If user does not exist
                res.status(401).json({ success: false,  code: 500 , message: 'Invalid username or password' });
            }
        } catch (error) {
            console.error('Error executing login query:', error.message);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        } finally {
            // Close the MySQL connection
            // await connection.end();
        }
    });

    await middleware(req, res); // Apply middleware
}
