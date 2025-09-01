import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;

    try {
        // Aggregate channel statistics
        const stats = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: { $size: "$likes" } },
                    averageViews: { $avg: "$views" }
                }
            }
        ]);

        // Get total subscribers
        const totalSubscribers = await Subscription.countDocuments({
            channel: channelId
        });

        // Get total subscribed channels (channels this user subscribed to)
        const totalSubscribedTo = await Subscription.countDocuments({
            subscriber: channelId
        });

        // Get recent activity stats (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentStats = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId),
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $group: {
                    _id: null,
                    recentVideos: { $sum: 1 },
                    recentViews: { $sum: "$views" },
                    recentLikes: { $sum: { $size: "$likes" } }
                }
            }
        ]);

        // Get top performing video
        const topVideo = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $sort: { views: -1 }
            },
            {
                $limit: 1
            },
            {
                $project: {
                    Title: 1,
                    views: 1,
                    thumbnail: 1,
                    createdAt: 1
                }
            }
        ]);

        const channelStats = {
            totalVideos: stats[0]?.totalVideos || 0,
            totalViews: stats[0]?.totalViews || 0,
            totalLikes: stats[0]?.totalLikes || 0,
            averageViews: Math.round(stats[0]?.averageViews || 0),
            totalSubscribers,
            totalSubscribedTo,
            recentVideos: recentStats[0]?.recentVideos || 0,
            recentViews: recentStats[0]?.recentViews || 0,
            recentLikes: recentStats[0]?.recentLikes || 0,
            topVideo: topVideo[0] || null
        };

        return res.status(200).json(
            new ApiResponse(200, channelStats, "Channel stats fetched successfully")
        );

    } catch (error) {
        throw new ApiError(500, "Error fetching channel stats");
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all the videos uploaded by the channel with pagination
    const channelId = req.user._id;
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    try {
        // Build sort conditions
        const sortConditions = { [sortBy]: sortType === "desc" ? -1 : 1 };

        // Create aggregation pipeline
        const pipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "comments"
                }
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" },
                    commentsCount: { $size: "$comments" }
                }
            },
            {
                $project: {
                    likes: 0,
                    comments: 0
                }
            },
            {
                $sort: sortConditions
            }
        ];

        // Execute aggregation with pagination
        const videos = await Video.aggregatePaginate(
            Video.aggregate(pipeline),
            {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        );

        return res.status(200).json(
            new ApiResponse(200, videos, "Channel videos fetched successfully")
        );

    } catch (error) {
        throw new ApiError(500, "Error fetching channel videos");
    }
});

export {
    getChannelStats, 
    getChannelVideos
}