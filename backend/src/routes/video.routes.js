// video.routes.js - Complete with recommendations built-in
import { Router } from 'express';
import mongoose from 'mongoose';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateWatchHistory     
} from "../controllers/video.controllers.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { Video } from "../models/video.models.js";
import { WatchHistory } from "../models/WatchHistory.model.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// ============================================
// ROUTE ORDER: Static routes BEFORE dynamic
// ============================================

// 1. GET all videos (with optional auth)
router.route("/").get(optionalAuth, getAllVideos);

// 2. POST upload video
router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

// 3. PATCH watch history
router.route("/watch-update").patch(verifyJWT, updateWatchHistory);

// 4. GET recommended feed - THIS IS THE MAIN RECOMMENDATION ROUTE
router.route("/recommended").get(optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user?._id;
        
        console.log("=== RECOMMENDED FEED ===");
        console.log("User ID:", userId || "Anonymous");
        
        // Get all published videos with owner info
        let allVideos = await Video.aggregate([
            { $match: { isPublished: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }]
                }
            },
            { $addFields: { owner: { $first: "$owner" } } }
        ]);
        
        console.log("Total videos:", allVideos.length);
        
        // Not logged in - return popular videos
        if (!userId) {
            allVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
            const paginated = allVideos.slice((page - 1) * limit, page * limit);
            
            return res.status(200).json(
                new ApiResponse(200, {
                    docs: paginated,
                    totalDocs: allVideos.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    isPersonalized: false,
                    feedType: "popular"
                }, "Popular videos")
            );
        }
        
        // Get watch history count
        const watchHistoryCount = await WatchHistory.countDocuments({ 
            userId: new mongoose.Types.ObjectId(userId) 
        });
        
        console.log("Watch history count:", watchHistoryCount);
        
        // Check user preferences
        const user = await User.findById(userId);
        const hasPreferences = user?.preferences?.selectedTags?.length > 0;
        
        // NEW USER - no watch history
        if (watchHistoryCount === 0) {
            console.log("New user detected");
            
            // Sort by views (popular first)
            allVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
            const paginated = allVideos.slice((page - 1) * limit, page * limit);
            
            return res.status(200).json(
                new ApiResponse(200, {
                    docs: paginated,
                    totalDocs: allVideos.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    isPersonalized: false,
                    feedType: "popular_new_user",
                    needsOnboarding: !hasPreferences,
                    hasCompletedOnboarding: hasPreferences
                }, "Popular videos for new user")
            );
        }
        
        // OLD USER - has watch history, create personalized feed
        console.log("Old user - creating personalized feed");
        
        // Get watched videos to extract tags from descriptions
        const watchHistory = await WatchHistory.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "videos",
                    localField: "videoId",
                    foreignField: "_id",
                    as: "video"
                }
            },
            { $unwind: "$video" },
            {
                $project: {
                    description: "$video.description",
                    Title: "$video.Title",
                    tags: "$video.tags",
                    isCompleted: 1,
                    watchDurationSeconds: 1
                }
            }
        ]);
        
        console.log("Watch history entries:", watchHistory.length);
        
        // Calculate tag scores from watched videos
        const tagScores = {};
        
        watchHistory.forEach(entry => {
            // Extract from tags array if exists
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => {
                    const cleanTag = tag.toLowerCase();
                    const weight = entry.isCompleted ? 2 : 1;
                    tagScores[cleanTag] = (tagScores[cleanTag] || 0) + weight;
                });
            }
            
            // Also extract hashtags from description
            if (entry.description) {
                const hashtags = entry.description.match(/#(\w+)/g) || [];
                hashtags.forEach(tag => {
                    const cleanTag = tag.replace('#', '').toLowerCase();
                    const weight = entry.isCompleted ? 2 : 1;
                    tagScores[cleanTag] = (tagScores[cleanTag] || 0) + weight;
                });
            }
        });
        
        console.log("Tag scores:", tagScores);
        
        // Score all videos based on tag matches
        const scoredVideos = allVideos.map(video => {
            let score = 0;
            
            // Check tags array
            if (video.tags && Array.isArray(video.tags)) {
                video.tags.forEach(tag => {
                    score += tagScores[tag.toLowerCase()] || 0;
                });
            }
            
            // Also check description hashtags
            if (video.description) {
                const hashtags = video.description.match(/#(\w+)/g) || [];
                hashtags.forEach(tag => {
                    const cleanTag = tag.replace('#', '').toLowerCase();
                    score += tagScores[cleanTag] || 0;
                });
            }
            
            return { ...video, recommendationScore: score };
        });
        
        // Sort by recommendation score, then by views
        scoredVideos.sort((a, b) => {
            if (b.recommendationScore !== a.recommendationScore) {
                return b.recommendationScore - a.recommendationScore;
            }
            return (b.views || 0) - (a.views || 0);
        });
        
        const paginated = scoredVideos.slice((page - 1) * limit, page * limit);
        
        // Get top tags for display
        const topTags = Object.entries(tagScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, score]) => ({ tag, score }));
        
        console.log("Top tags:", topTags);
        
        return res.status(200).json(
            new ApiResponse(200, {
                docs: paginated,
                totalDocs: allVideos.length,
                page: parseInt(page),
                limit: parseInt(limit),
                isPersonalized: true,
                feedType: "content_based",
                userTopTags: topTags
            }, "Personalized recommendations")
        );
        
    } catch (error) {
        console.error("Recommendation error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Toggle publish status
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// 6. Dynamic video routes - MUST BE LAST
router.route("/:videoId")
    .get(optionalAuth, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"));

export default router;















// // video.routes.js - Updated with optionalAuth for public routes
// import { Router } from 'express';
// import {
//     deleteVideo,
//     getAllVideos,
//     getVideoById,
//     publishAVideo,
//     togglePublishStatus,
//     updateWatchHistory     
// } from "../controllers/video.controllers.js"
// import { verifyJWT, optionalAuth } from "../middlewares/auth.middlewares.js" // Add optionalAuth
// import { upload } from "../middlewares/multer.middlewares.js"
// import { WatchHistory } from '../models/WatchHistory.model.js';

// const router = Router();

// // ============================================
// // ROUTE ORDER MATTERS - Static routes first
// // ============================================

// // Public route with optional auth - Get all videos
// // optionalAuth allows identifying logged-in users without requiring login
// router.route("/").get(optionalAuth, getAllVideos);

// // Protected route - Upload video
// router.route("/").post(
//     verifyJWT,
//     upload.fields([
//         { name: "videoFile", maxCount: 1 },
//         { name: "thumbnail", maxCount: 1 }
//     ]),
//     publishAVideo
// );

// // Protected route - Update watch history
// router.route("/watch-update").patch(verifyJWT, updateWatchHistory);

// // Protected route - Toggle publish status
// router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);




// // Public route with optional auth - View single video
// // optionalAuth allows checking if user liked the video
// router.route("/:videoId")
//     .get(optionalAuth, getVideoById)  // Use optionalAuth here
//     .delete(verifyJWT, deleteVideo)
//     .patch(verifyJWT, upload.single("thumbnail"));

// export default router;