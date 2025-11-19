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

//-------------------------------------------------------------------------------------------
// src/server.js (For local development/testing only)

// import dotenv from 'dotenv';
// import connectDB from "./db/index.js";
// import { app } from "./app.js"; // <--- Crucial: Import your Express app instance

// // Load env variables
// dotenv.config({
//   path: './.env'
// });

// const PORT = process.env.PORT || 8000;

// // Connect to DB and START the long-running Express server
// connectDB()
//   .then(() => {
//     app.listen(PORT, () => { // <--- THIS STARTS THE SERVER AND LISTENS ON PORT 8000
//       console.log(`✅ Server is running on http://localhost:${PORT}`);
//       console.log("✅ MongoDB connected successfully");
//     });
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection failed!", err);
//   });