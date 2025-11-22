// video.routes.js - Updated with optionalAuth for public routes
import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateWatchHistory     
} from "../controllers/video.controllers.js"
import { verifyJWT, optionalAuth } from "../middlewares/auth.middlewares.js" // Add optionalAuth
import { upload } from "../middlewares/multer.middlewares.js"

const router = Router();

// ============================================
// ROUTE ORDER MATTERS - Static routes first
// ============================================

// Public route with optional auth - Get all videos
// optionalAuth allows identifying logged-in users without requiring login
router.route("/").get(optionalAuth, getAllVideos);

// Protected route - Upload video
router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

// Protected route - Update watch history
router.route("/watch-update").patch(verifyJWT, updateWatchHistory);

// Protected route - Toggle publish status
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// Public route with optional auth - View single video
// optionalAuth allows checking if user liked the video
router.route("/:videoId")
    .get(optionalAuth, getVideoById)  // Use optionalAuth here
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"));

export default router;