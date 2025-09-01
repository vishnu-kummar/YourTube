import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    // Build match conditions
    const matchConditions = { isPublished: true }
    
    // Add text search if query is provided (using correct field names)
    if (query) {
        matchConditions.$or = [
            { Title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }
    
    // Add userId filter if provided
    if (userId && isValidObjectId(userId)) {
        matchConditions.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Build sort conditions
    let sortConditions = { createdAt: -1 } // default sort
    if (sortBy && sortType) {
        sortConditions = { [sortBy]: sortType === 'desc' ? -1 : 1 }
    }
    
    // Create aggregation pipeline
    const pipeline = [
        { $match: matchConditions },
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
        { $project: { ownerDetails: 0 } },
        { $sort: sortConditions }
    ]
    
    // Execute aggregation with pagination
    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    )
    
    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { Title, description } = req.body
    
    // Validation
    if (!Title || !description) {
        throw new ApiError(400, "Title and description are required")
    }
    
    // Check for video file and thumbnail
    if (!req.files?.videoFile?.[0]?.path) {
        throw new ApiError(400, "Video file is required")
    }
    
    if (!req.files?.thumbnail?.[0]?.path) {
        throw new ApiError(400, "Thumbnail is required")
    }
    
    const videoLocalPath = req.files.videoFile[0].path
    const thumbnailLocalPath = req.files.thumbnail[0].path
    
    // Upload to cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if (!videoFile) {
        throw new ApiError(500, "Error uploading video file")
    }
    
    if (!thumbnail) {
        throw new ApiError(500, "Error uploading thumbnail")
    }
    
    // Create video document (using correct field names from your schema)
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        Title,
        description,
        duration: videoFile.duration || 0,
        owner: req.user._id,
        isPublished: true
    })
    
    if (!video) {
        throw new ApiError(500, "Something went wrong while uploading video")
    }
    
    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // 1. Increment views first and return updated doc
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true } // return updated document
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // 2. Aggregate owner + likes info
  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }]
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
      $addFields: {
        owner: { $first: "$owner" },
        likesCount: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false
          }
        },
        views: updatedVideo.views // ✅ inject incremented views
      }
    },
    { $project: { likes: 0 } }
  ]);

  // 3. Save watch history if user logged in
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: videoId }
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if video exists and user is owner
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }
    
    // Delete the video
    await Video.findByIdAndDelete(videoId)
    
    // Remove from all users' watch history
    await User.updateMany(
        { watchHistory: videoId },
        { $pull: { watchHistory: videoId } }
    )
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if video exists and user is owner
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this video")
    }
    
    // Toggle publish status
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    )
    
    const message = updatedVideo.isPublished ? "Video published" : "Video unpublished"
    
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, message)
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus
}