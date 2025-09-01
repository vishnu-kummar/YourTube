import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    
    // Validate content
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }
    
    if (content.trim().length > 280) {
        throw new ApiError(400, "Tweet content cannot exceed 280 characters")
    }
    
    // Create tweet
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })
    
    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet")
    }
    
    // Get the created tweet with owner details
    const createdTweet = await Tweet.aggregate([
        {
            $match: {
                _id: tweet._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" },
                likesCount: { $size: "$likes" },
                isLiked: false  // New tweet, so not liked yet
            }
        },
        {
            $project: {
                ownerDetails: 0,
                likes: 0
            }
        }
    ])
    
    return res.status(201).json(
        new ApiResponse(201, createdTweet[0], "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    // Create aggregation pipeline for user tweets
    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                ownerDetails: 0,
                likes: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]
    
    // For now, let's use a simple find with pagination since Tweet model doesn't have aggregatePaginate
    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "username fullname avatar")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
    
    // Get total count
    const totalTweets = await Tweet.countDocuments({ owner: userId })
    
    // Add like information for each tweet
    const tweetsWithLikes = await Promise.all(
        tweets.map(async (tweet) => {
            const likes = await mongoose.model("Like").find({ tweet: tweet._id })
            const isLiked = likes.some(like => like.likedBy.toString() === req.user._id.toString())
            
            return {
                ...tweet,
                likesCount: likes.length,
                isLiked
            }
        })
    )
    
    return res.status(200).json(
        new ApiResponse(200, {
            tweets: tweetsWithLikes,
            totalTweets,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalTweets / limit)
        }, "User tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    
    // Validate input
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }
    
    if (content.trim().length > 280) {
        throw new ApiError(400, "Tweet content cannot exceed 280 characters")
    }
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    
    // Find tweet and check ownership
    const tweet = await Tweet.findById(tweetId)
    
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }
    
    // Update tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content: content.trim() } },
        { new: true }
    ).populate("owner", "username fullname avatar")
    
    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    
    // Find tweet and check ownership
    const tweet = await Tweet.findById(tweetId)
    
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }
    
    // Delete tweet
    await Tweet.findByIdAndDelete(tweetId)
    
    // Optional: Delete all likes on this tweet
    await mongoose.model("Like").deleteMany({ tweet: tweetId })
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}