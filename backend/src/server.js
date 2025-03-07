const path = require('path');
require("dotenv").config();
console.log("MongoDB URI:", process.env.MONGODB_URI);
const dotenv = require('dotenv');

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Debug logging
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
});

const app = require("./app");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB()
  .then(() => {
    // Start the server after successful database connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });