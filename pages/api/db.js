// db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function connectToDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    return connection;
}

export default connectToDatabase;
