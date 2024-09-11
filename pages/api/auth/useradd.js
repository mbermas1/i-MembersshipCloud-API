// pages/api/auth/useradd.js
import initMiddleware from '../init-middleware'; // Import initMiddleware function
import connectToDatabase from '../db';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    const middleware = initMiddleware(async (req, res) => {
        if (req.method === 'POST') {
            try {
                const { ClientID, RoleTypeID, FirstName, LastName, Password, EmailAddress } = req.body;

                // Basic validation
                if (!FirstName || !EmailAddress || !Password) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                // Create a MySQL connection
                const connection = await connectToDatabase();

                try {
                    // Begin a transaction
                    await connection.beginTransaction();

                    // Add the new user
                    const newUser = await addUser({ ClientID, RoleTypeID, FirstName, LastName, Password, EmailAddress }, connection);
                    delete newUser.Password;
                    // Commit the transaction
                    await connection.commit();
                    return res.status(201).json({ success: true, code: 201 , message: "user registration successfully!!", user: newUser });
                } catch (error) {
                    // Rollback the transaction on error
                    await connection.rollback();
                    console.error('Error adding user:', error.message);
                    return res.status(500).json({ message: error.message });
                } finally {
                    // Release the connection back to the pool
                    // connection.release();
                }
            } catch (error) {
                console.error('Error handling useradd:', error.message);
                return res.status(500).json({ message: error.message });
            }
        } else {
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    });

    await middleware(req, res);
}

async function addUser({ ClientID, RoleTypeID, FirstName, LastName, Password, EmailAddress }, connection) {
    try {
        // Hash the password before saving it
        // const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert the new user into the database
        const [result] = await connection.query(
            `INSERT INTO User (ClientID, RoleTypeID, FirstName, LastName, Password, EmailAddress)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ClientID, RoleTypeID, FirstName, LastName, Password, EmailAddress]
        );

        const newUserId = result.insertId;

        // Retrieve the newly added user
        const [newUser] = await connection.query('SELECT * FROM User WHERE ID = ?', [newUserId]);
        return newUser[0];
    } catch (error) {
        throw new Error(`Unable to add user: ${error.message}`);
    }
}
