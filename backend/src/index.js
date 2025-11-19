import dotenv from 'dotenv';
import connectDB from "./db/index.js";

// Load env variables
dotenv.config({
  path: './.env'
});

// Just connect to DB here (no app.listen)
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed", err);
  });