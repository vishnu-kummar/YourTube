import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    // Create aggregation pipeline for comments with pagination
    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
                foreignField: "comment",
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
    
    // Execute aggregation with pagination
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    )
    
    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    
    // Validate input
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    // Create comment
    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })
    
    if (!comment) {
        throw new ApiError(500, "Failed to add comment")
    }
    
    // Get the created comment with owner details
    const createdComment = await Comment.aggregate([
        {
            $match: {
                _id: comment._id
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
            $addFields: {
                owner: { $first: "$ownerDetails" },
                likesCount: 0,
                isLiked: false
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        }
    ])
    
    return res.status(201).json(
        new ApiResponse(201, createdComment[0], "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    
    // Validate input
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    
    // Find comment and check ownership
    const comment = await Comment.findById(commentId)
    
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }
    
    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content: content.trim() } },
        { new: true }
    ).populate("owner", "username fullname avatar")
    
    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    
    // Find comment and check ownership
    const comment = await Comment.findById(commentId)
    
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }
    
    // Delete comment
    await Comment.findByIdAndDelete(commentId)
    
    // Optional: Delete all likes on this comment
    await mongoose.model("Like").deleteMany({ comment: commentId })
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}