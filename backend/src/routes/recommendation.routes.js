// src/routes/recommendation.routes.js
import { Router } from 'express';
import {
    getRecommendedVideos,
    getAvailableTags,
    saveUserPreferences,
    getTrendingVideos
} from "../controllers/recommendation.controllers.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middlewares.js";

const router = Router();

// Public routes with optional auth (to identify logged-in users)
router.route("/feed").get(optionalAuth, getRecommendedVideos); // Uses optionalAuth to detect user
router.route("/tags").get(getAvailableTags);
router.route("/trending").get(getTrendingVideos);

// Protected routes
router.route("/preferences").post(verifyJWT, saveUserPreferences);

// Optional: Get personalized feed (requires login)
router.route("/personalized").get(verifyJWT, getRecommendedVideos);

router.route("/migrate-tags").post(verifyJWT, migrateVideoTags);

export default router;