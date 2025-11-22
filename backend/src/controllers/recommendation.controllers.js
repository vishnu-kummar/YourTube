// src/controllers/recommendation.controllers.js
import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { WatchHistory } from "../models/WatchHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Predefined tag categories for the platform
export const AVAILABLE_TAGS = [
    "programming", "javascript", "python", "webdev", "ai", "machinelearning",
    "gaming", "esports", "minecraft", "valorant",
    "music", "hiphop", "rock", "pop", "classical",
    "movies", "bollywood", "hollywood", "anime", "documentary",
    "sports", "cricket", "football", "basketball", "fitness",
    "cooking", "recipes", "vegan", "baking",
    "travel", "vlog", "adventure", "nature",
    "education", "science", "history", "math","study",
    "comedy", "entertainment", "news", "tech"
];

/**
 * Calculate user's tag scores based on watch history
 * Returns a Map of tag -> score
 */
const calculateUserTagScores = async (userId) => {
    const tagScores = new Map();
    
    // Get user's watch history with video details
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
                tags: "$video.tags",
                watchDurationSeconds: 1,
                isCompleted: 1,
                duration: "$video.duration"
            }
        }
    ]);

    // Calculate scores based on watch behavior
    watchHistory.forEach(entry => {
        if (!entry.tags || entry.tags.length === 0) return;
        
        // Weight based on completion: completed videos count more
        let weight = 1;
        if (entry.isCompleted) {
            weight = 2; // Completed videos are worth 2x
        } else if (entry.duration > 0) {
            // Partial watch: weight based on percentage watched
            const watchPercentage = entry.watchDurationSeconds / entry.duration;
            weight = Math.max(0.5, watchPercentage); // Minimum 0.5 weight
        }
        
        // Add weighted score for each tag
        entry.tags.forEach(tag => {
            const currentScore = tagScores.get(tag) || 0;
            tagScores.set(tag, currentScore + weight);
        });
    });

    return tagScores;
};

/**
 * Calculate recommendation score for a video based on user's tag scores
 */
const calculateVideoRecommendationScore = (video, userTagScores) => {
    if (!video.tags || video.tags.length === 0) return 0;
    
    let score = 0;
    video.tags.forEach(tag => {
        score += userTagScores.get(tag) || 0;
    });
    
    return score;
};

/**
 * Get personalized video recommendations for logged-in users
 */
export const getRecommendedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;

    console.log("=== RECOMMENDATION FEED ===");
    console.log("User ID:", userId || "Not logged in");
    console.log("Page:", page, "Limit:", limit);

    // Get all published videos
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

    // If user is not logged in, return popular/trending videos
    if (!userId) {
        const sortedVideos = allVideos.sort((a, b) => b.views - a.views);
        const paginatedVideos = sortedVideos.slice((page - 1) * limit, page * limit);
        
        return res.status(200).json(
            new ApiResponse(200, {
                docs: paginatedVideos,
                totalDocs: allVideos.length,
                page: parseInt(page),
                limit: parseInt(limit),
                isPersonalized: false,
                feedType: "popular"
            }, "Popular videos fetched successfully")
        );
    }

    // Check if user has watch history
    const watchHistoryCount = await WatchHistory.countDocuments({ userId });
    const user = await User.findById(userId);

    console.log("Watch History Count:", watchHistoryCount);
    console.log("User preferences:", user?.preferences);

    // NEW USER (Cold Start) - No watch history
    if (watchHistoryCount === 0) {
        // Check if user has selected preferences during onboarding
        if (user.preferences?.selectedTags?.length > 0) {
            // Use selected preferences to rank videos
            const preferredTags = user.preferences.selectedTags;
            
            allVideos = allVideos.map(video => {
                let score = 0;
                if (video.tags) {
                    video.tags.forEach(tag => {
                        if (preferredTags.includes(tag)) score += 1;
                    });
                }
                return { ...video, recommendationScore: score };
            });
            
            allVideos.sort((a, b) => {
                // First by preference score, then by views
                if (b.recommendationScore !== a.recommendationScore) {
                    return b.recommendationScore - a.recommendationScore;
                }
                return b.views - a.views;
            });
            
            const paginatedVideos = allVideos.slice((page - 1) * limit, page * limit);
            
            return res.status(200).json(
                new ApiResponse(200, {
                    docs: paginatedVideos,
                    totalDocs: allVideos.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    isPersonalized: true,
                    feedType: "preference_based",
                    hasCompletedOnboarding: true
                }, "Preference-based recommendations")
            );
        }
        
        // No preferences set - return trending + popular mix
        const now = new Date();
        const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        
        // Separate recent and older videos
        const recentVideos = allVideos.filter(v => new Date(v.createdAt) >= last48Hours);
        const olderVideos = allVideos.filter(v => new Date(v.createdAt) < last48Hours);
        
        // Sort recent by views (trending), older by views (popular)
        recentVideos.sort((a, b) => b.views - a.views);
        olderVideos.sort((a, b) => b.views - a.views);
        
        // Mix: trending first, then popular
        const mixedVideos = [...recentVideos, ...olderVideos];
        const paginatedVideos = mixedVideos.slice((page - 1) * limit, page * limit);
        
        return res.status(200).json(
            new ApiResponse(200, {
                docs: paginatedVideos,
                totalDocs: allVideos.length,
                page: parseInt(page),
                limit: parseInt(limit),
                isPersonalized: false,
                feedType: "trending_popular",
                hasCompletedOnboarding: false,
                needsOnboarding: true
            }, "Trending and popular videos")
        );
    }

    // OLD USER (Has Watch History) - Personalized Recommendations
    console.log("Old user detected - calculating personalized feed");
    const userTagScores = await calculateUserTagScores(userId);
    
    console.log("User Tag Scores:", Object.fromEntries(userTagScores));
    
    // Update user's tag scores in database (optional, for caching)
    await User.findByIdAndUpdate(userId, { tagScores: userTagScores });

    // Score all videos
    allVideos = allVideos.map(video => ({
        ...video,
        recommendationScore: calculateVideoRecommendationScore(video, userTagScores)
    }));

    // Sort by recommendation score, then by views as tiebreaker
    allVideos.sort((a, b) => {
        if (b.recommendationScore !== a.recommendationScore) {
            return b.recommendationScore - a.recommendationScore;
        }
        return b.views - a.views;
    });

    const paginatedVideos = allVideos.slice((page - 1) * limit, page * limit);

    return res.status(200).json(
        new ApiResponse(200, {
            docs: paginatedVideos,
            totalDocs: allVideos.length,
            page: parseInt(page),
            limit: parseInt(limit),
            isPersonalized: true,
            feedType: "content_based",
            userTopTags: Array.from(userTagScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([tag, score]) => ({ tag, score }))
        }, "Personalized recommendations fetched successfully")
    );
});

/**
 * Get available tags for onboarding/preference selection
 */
export const getAvailableTags = asyncHandler(async (req, res) => {
    // Get tags with video counts
    const tagCounts = await Video.aggregate([
        { $match: { isPublished: true } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            availableTags: AVAILABLE_TAGS,
            tagCounts: tagCounts
        }, "Available tags fetched successfully")
    );
});

/**
 * Save user preferences (for new user onboarding)
 */
export const saveUserPreferences = asyncHandler(async (req, res) => {
    const { selectedTags } = req.body;
    const userId = req.user._id;

    if (!selectedTags || !Array.isArray(selectedTags)) {
        throw new ApiError(400, "Selected tags must be an array");
    }

    // Validate tags
    const validTags = selectedTags.filter(tag => 
        AVAILABLE_TAGS.includes(tag.toLowerCase())
    );

    if (validTags.length === 0) {
        throw new ApiError(400, "Please select at least one valid tag");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            preferences: {
                selectedTags: validTags,
                hasCompletedOnboarding: true
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "Preferences saved successfully")
    );
});

/**
 * Get trending videos (last 48 hours)
 */
export const getTrendingVideos = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const last48Hours = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const trendingVideos = await Video.aggregate([
        { 
            $match: { 
                isPublished: true,
                createdAt: { $gte: last48Hours }
            } 
        },
        { $sort: { views: -1 } },
        { $limit: parseInt(limit) },
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

    return res.status(200).json(
        new ApiResponse(200, trendingVideos, "Trending videos fetched successfully")
    );
});


/**
 * ONE-TIME MIGRATION: Extract tags from existing video descriptions
 * Run this once to populate tags for existing videos
 */
export const migrateVideoTags = asyncHandler(async (req, res) => {
    console.log("Starting tag migration...");
    
    // Get all videos without tags or with empty tags
    const videos = await Video.find({
        $or: [
            { tags: { $exists: false } },
            { tags: { $size: 0 } }
        ]
    });
    
    console.log(`Found ${videos.length} videos to process`);
    
    let updatedCount = 0;
    
    for (const video of videos) {
        const tags = [];
        
        // Extract hashtags from description
        if (video.description) {
            const hashtagRegex = /#(\w+)/g;
            let match;
            while ((match = hashtagRegex.exec(video.description)) !== null) {
                tags.push(match[1].toLowerCase());
            }
        }
        
        // Extract keywords from title (optional - basic word extraction)
        if (video.Title) {
            const titleWords = video.Title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3); // Only words > 3 chars
            
            // Add common category keywords if found in title
            const categoryKeywords = [
                'cricket', 'sports', 'football', 'basketball', 'gaming',
                'music', 'movie', 'comedy', 'cooking', 'travel', 'tech',
                'programming', 'javascript', 'python', 'tutorial', 'review',
                'vlog', 'news', 'entertainment', 'fitness', 'nature'
            ];
            
            titleWords.forEach(word => {
                if (categoryKeywords.includes(word) && !tags.includes(word)) {
                    tags.push(word);
                }
            });
        }
        
        if (tags.length > 0) {
            await Video.findByIdAndUpdate(video._id, { 
                tags: [...new Set(tags)] // Remove duplicates
            });
            updatedCount++;
            console.log(`Updated video "${video.Title}" with tags:`, tags);
        }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} videos.`);
    
    return res.status(200).json(
        new ApiResponse(200, { 
            totalVideos: videos.length,
            updatedVideos: updatedCount 
        }, "Tag migration completed")
    );
});