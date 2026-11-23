const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to prevent querySrv ECONNREFUSED on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

let cachedConnection = null;
let cachedPromise = null;

/**
 * Connect to MongoDB with connection pooling & caching for serverless (Vercel)
 * and graceful fallback to local MongoDB for local development
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/website_scraper';

  // 1. If an active connection exists, return it immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // 2. If already connecting, await the existing promise
  if (!cachedPromise) {
    const opts = {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false // Fail fast with clear error instead of hanging 10 seconds
    };

    cachedPromise = mongoose
      .connect(uri, opts)
      .then((conn) => {
        console.log(`🌿 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        cachedConnection = conn;
        return cachedConnection;
      })
      .catch(async (error) => {
        cachedPromise = null;
        console.warn(`⚠️ Cloud MongoDB Atlas connection failed: ${error.message}`);

        // If running locally and Atlas failed (e.g. IP whitelist block), fall back to local MongoDB
        if (uri.includes('mongodb+srv') && process.env.NODE_ENV !== 'production') {
          try {
            console.log(`🔄 Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/website_scraper)...`);
            const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/website_scraper', {
              serverSelectionTimeoutMS: 3000,
              bufferCommands: false
            });
            console.log(`🌿 Local MongoDB Connected: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
            cachedConnection = fallbackConn;
            return cachedConnection;
          } catch (localErr) {
            console.error(`❌ Local MongoDB Fallback Error: ${localErr.message}`);
          }
        }

        // In production (Vercel), throw clear, actionable error
        throw new Error(
          `Could not connect to MongoDB Atlas (${error.message}). Please ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas -> Network Access.`
        );
      });
  }

  try {
    cachedConnection = await cachedPromise;
    return cachedConnection;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
};

module.exports = connectDB;
