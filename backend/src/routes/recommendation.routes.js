// src/routes/recommendation.routes.js
import { Router } from 'express';
import {
    getRecommendedVideos,
    getAvailableTags,
    saveUserPreferences,
    getTrendingVideos
} from "../controllers/recommendation.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Public routes
router.route("/feed").get(getRecommendedVideos); // Works for both logged-in and anonymous
router.route("/tags").get(getAvailableTags);
router.route("/trending").get(getTrendingVideos);

// Protected routes
router.route("/preferences").post(verifyJWT, saveUserPreferences);

// Optional: Get personalized feed (requires login)
router.route("/personalized").get(verifyJWT, getRecommendedVideos);

export default router;