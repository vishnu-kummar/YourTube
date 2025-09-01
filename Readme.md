1. index.js — Entry Point

Purpose:
Loads environment variables from .env.
Connects to MongoDB using connectDB().
Starts the Express server only after DB connection is successful.
If DB connection fails, logs the error and stops execution.
Flow:
When you run npm run dev → nodemon starts → index.js loads .env → tries MongoDB → starts server.

2. app.js — Express App Configuration

Purpose:
This is where your Express app is created and middleware is set up.
It does NOT start the server — it just prepares the app to be used by index.js
Sets up global middlewares:
cors → control cross-origin requests.
express.json() & express.urlencoded() → parse incoming request bodies.
express.static() → serve static files from /public.
cookieParser() → read/write cookies.
Mounts the userRouter for all /api/v1/users routes.

3. user.routes.js — User Routes

Purpose:
Defines the /register POST route.
Uses multer middleware to handle multipart/form-data uploads:
avatar (required)
coverImage (optional)
Passes the request to the registerUser controller.

4. user.controllers.js — Controller Logic

Purpose:
These are the actual functions that run when a request comes in.
Validates user input.
Checks for duplicate email/username.
Handles file uploads → sends them to Cloudinary.
Creates a new user in MongoDB.
Returns the created user (without password/refreshToken) as a JSON response.

5. Utilities

ApiError.js → Custom error class for API errors.
asyncHandler.js → Wrapper to avoid repetitive try/catch in async routes.
ApiResponse.js → Standard response format for success.

6. Database

db/index.js connects to MongoDB using Mongoose, with DB_NAME from constants + .env connection string.

7. Multer Middleware

Stores uploaded files temporarily in public/temp before sending to Cloudinary

8. User Model

Defines schema for User in MongoDB.
Password hashing (pre('save') hook).
Methods to:
Verify password (isPasswordCorrect)
Generate JWT tokens.

Overall Flow:

Client → POST /api/v1/users/register with form-data (avatar, coverImage, fields).
Multer → Saves files locally.
Controller:
Validates input.
Checks for duplicates.
Uploads files to Cloudinary.
Saves new user in MongoDB.
Responds with JSON success message.