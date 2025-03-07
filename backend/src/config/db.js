const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Remove quotes from URI if they exist
    const uri = process.env.MONGODB_URI?.replace(/^['"]|['"]$/g, '');
    
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    console.error('Environment check:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'is set' : 'is not set',
      NODE_ENV: process.env.NODE_ENV
    });
    process.exit(1);
  }
};

module.exports = connectDB;