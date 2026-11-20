const mongoose = require('mongoose');

/**
 * Connect to MongoDB database using Mongoose
 * Uses system native DNS resolver and gracefully falls back to local MongoDB
 * if Cloud Atlas IP is not yet whitelisted locally
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/website_scraper';

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`🌿 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Cloud MongoDB connection failed: ${error.message}`);

    // If Atlas failed locally, fall back to local MongoDB instance
    if (uri.includes('mongodb+srv') && process.env.NODE_ENV !== 'production') {
      try {
        console.log(`🔄 Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/website_scraper)...`);
        const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/website_scraper', {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`🌿 Local MongoDB Connected: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (localErr) {
        console.error(`❌ Local MongoDB Fallback Error: ${localErr.message}`);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ Production DB Error: ${error.message}`);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
