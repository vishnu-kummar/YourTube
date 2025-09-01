import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.models.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    // Check if user has already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })
    
    if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked successfully")
        )
    } else {
        // Like - create new like
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    
    // Check if comment exists
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    
    // Check if user has already liked this comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })
    
    if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked successfully")
        )
    } else {
        // Like - create new like
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    
    // Check if tweet exists
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    
    // Check if user has already liked this tweet
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })
    
    if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully")
        )
    } else {
        // Like - create new like
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Tweet liked successfully")
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // Get all videos liked by the current user with video details
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true }  // Only get likes on videos
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
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
                        $addFields: {
                            owner: { $first: "$ownerDetails" }
                        }
                    },
                    {
                        $project: {
                            ownerDetails: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$videoDetails" }
            }
        },
        {
            $project: {
                videoDetails: 0,
                comment: 0,
                tweet: 0,
                __v: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])
    
    return res.status(200).json(
        new ApiResponse(200, {
            likedVideos,
            totalLikedVideos: likedVideos.length
        }, "Liked videos fetched successfully")
    )
})

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
}
