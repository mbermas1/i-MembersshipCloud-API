// lib/init-middleware.js

import Cors from 'cors';

// Initialize CORS middleware

const corsMiddleware = Cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Function to initialize middleware
export default function initMiddleware(handler) {
  return (req, res) => new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(handler(req, res));
    });
  });
}
