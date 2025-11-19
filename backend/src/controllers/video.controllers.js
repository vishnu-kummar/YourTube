import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { WatchHistory } from '../models/WatchHistory.model.js'; // Added import for WatchHistory

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Build match conditions
    const matchConditions = { isPublished: true };

    // Add text search if query is provided
    if (query) {
        matchConditions.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
        ];
    }

    // Add userId filter if provided
    if (userId && isValidObjectId(userId)) {
        matchConditions.owner = new mongoose.Types.ObjectId(userId);
    }

    // Build sort conditions
    let sortConditions = { createdAt: -1 }; // default sort
    if (sortBy && sortType) {
        sortConditions = { [sortBy]: sortType === 'desc' ? -1 : 1 };
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
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        // Corrected check for req.user existence
                        if: { $and: [{ $ne: [req.user, null] }, { $ne: [req.user, undefined] }] },
                        then: { $in: [req.user?._id, "$likes.likedBy"] },
                        else: false,
                    },
                },
            },
        },
        { $project: { ownerDetails: 0, likes: 0 } },
        { $sort: sortConditions },
    ];

    // Execute aggregation with pagination
    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), {
        page: parseInt(page),
        limit: parseInt(limit),
    });

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    // Renamed 'Title' to 'title' for schema consistency
    const { title, description } = req.body; 
    
    console.log("Files received:", req.files);
    console.log("Body:", { title, description }); // Updated console log
    
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    
    if (!req.files?.videoFile?.[0]) {
        throw new ApiError(400, "Video file is required");
    }
    
    if (!req.files?.thumbnail?.[0]) {
        throw new ApiError(400, "Thumbnail is required");
    }
    
    const videoLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;
    
    console.log("File paths:", { videoLocalPath, thumbnailLocalPath });
    
    try {
        // Upload to cloudinary
        const videoUpload = await uploadOnCloudinary(videoLocalPath);
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
        
        if (!videoUpload) {
            throw new ApiError(500, "Error uploading video file to Cloudinary");
        }
        
        if (!thumbnailUpload) {
            throw new ApiError(500, "Error uploading thumbnail to Cloudinary");
        }
        
        console.log("Cloudinary uploads successful");
        
        // Create video document
        const video = await Video.create({
            videoFile: videoUpload.url,
            thumbnail: thumbnailUpload.url,
            title, // Used 'title'
            description,
            duration: videoUpload.duration || 0,
            owner: req.user._id,
            isPublished: true
        });
        
        // Cleanup temp files after successful upload (optional)
        const fs = await import('fs');
        if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath);
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath);
        
        return res.status(201).json(
            new ApiResponse(201, video, "Video published successfully")
        );
        
    } catch (error) {
        console.error("Video upload error:", error);
        
        // Cleanup temp files on error (optional)
        const fs = await import('fs');
        if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath);
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath);
        
        throw new ApiError(500, error.message || "Video upload failed");
    }
});

// RE-IMPLEMENTED: This function is for fetching video details and incrementing views.
// Updated getVideoById function for video.controllers.js
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // First check if video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // Increment views atomically
    await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    // Aggregate video details with owner and likes info
    const video = await Video.aggregate([
        { 
            $match: { _id: new mongoose.Types.ObjectId(videoId) } 
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                        if: req.user?._id,
                        then: { $in: [req.user._id, "$likes.likedBy"] },
                        else: false
                    }
                }
            }
        },
        { 
            $project: { 
                likes: 0 
            } 
        }
    ]);

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found");
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
    
    // 🛑 CORRECTED: Clean up records in the new WatchHistory collection
    await WatchHistory.deleteMany({ videoId }); 
    
    // If you need to clean up the deprecated User.watchHistory array as well, uncomment this:
    // await User.updateMany(
    //     { watchHistory: videoId },
    //     { $pull: { watchHistory: videoId } }
    // )

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

// New watch history function is perfect!
const updateWatchHistory = asyncHandler(async (req, res) => {
    // 1. Get required data from the request body and user session
    const { videoId, currentTime } = req.body;
    const userId = req.user?._id; 
    
    // Check if the user is logged in
    if (!userId) {
        // Logged-out users can still watch, but we don't track history
        return res.status(200).json({ message: "Not logged in, history not tracked." });
    }

    // Basic validation
    if (!videoId || currentTime === undefined || currentTime === null) {
        throw new ApiError(400, "Video ID and current time are required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // 2. Fetch the video details to determine duration and completion status
    const video = await Video.findById(videoId, 'duration');
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Default duration to 1 to avoid division by zero if it's missing
    const totalDuration = video.duration || 1; 
    
    // Check if watch duration is very close to or exceeds total duration (90%)
    const isCompleted = (currentTime / totalDuration) >= 0.9; 

    // 3. Find and Update/Create the WatchHistory document (The CORE LOGIC)
    const historyRecord = await WatchHistory.findOneAndUpdate(
        { userId, videoId }, // Query: Find by user and video
        {
            $set: {
                watchDurationSeconds: Math.round(currentTime), 
                isCompleted: isCompleted, 
                lastWatchedAt: new Date(), 
            },
            // If the record doesn't exist, these fields are set for the first time
            $setOnInsert: {
                userId: userId,
                videoId: videoId,
            }
        },
        { 
            new: true, // Return the updated document
            upsert: true, // Create if not found
        }
    );

    // 4. Send a success response
    return res
        .status(200)
        .json(
            new ApiResponse(200, historyRecord, "Watch history updated successfully")
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById, // <-- Added back
    deleteVideo,
    togglePublishStatus,
    updateWatchHistory // <-- Exported
}



// import mongoose, {isValidObjectId} from "mongoose"
// import {Video} from "../models/video.models.js"
// import {User} from "../models/user.models.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"
// import {uploadOnCloudinary} from "../utils/cloudinary.js"

// // Add this import at the top of video.controllers.js
// import { WatchHistory } from '../models/watchHistory.model.js';

// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

//     // Build match conditions
//     const matchConditions = { isPublished: true };

//     // Add text search if query is provided
//     if (query) {
//         matchConditions.$or = [
//             { title: { $regex: query, $options: 'i' } }, // Use "title" (case-sensitive, check schema)
//             { description: { $regex: query, $options: 'i' } },
//         ];
//     }

//     // Add userId filter if provided
//     if (userId && isValidObjectId(userId)) {
//         matchConditions.owner = new mongoose.Types.ObjectId(userId);
//     }

//     // Build sort conditions
//     let sortConditions = { createdAt: -1 }; // default sort
//     if (sortBy && sortType) {
//         sortConditions = { [sortBy]: sortType === 'desc' ? -1 : 1 };
//     }

//     // Create aggregation pipeline
//     const pipeline = [
//         { $match: matchConditions },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "ownerDetails",
//                 pipeline: [
//                     {
//                         $project: {
//                             username: 1,
//                             fullname: 1,
//                             avatar: 1,
//                         },
//                     },
//                 ],
//             },
//         },
//         {
//             $lookup: {
//                 from: "likes",
//                 localField: "_id",
//                 foreignField: "video",
//                 as: "likes",
//             },
//         },
//         {
//             $addFields: {
//                 owner: { $first: "$ownerDetails" },
//                 likesCount: { $size: "$likes" },
//                 isLiked: {
//                     $cond: {
//                         if: { $and: [{ $ne: [req.user, null] }, { $ne: [req.user, undefined] }] }, // Check req.user exists
//                         then: { $in: [req.user?._id, "$likes.likedBy"] },
//                         else: false,
//                     },
//                 },
//             },
//         },
//         { $project: { ownerDetails: 0, likes: 0 } },
//         { $sort: sortConditions },
//     ];

//     // Execute aggregation with pagination
//     const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), {
//         page: parseInt(page),
//         limit: parseInt(limit),
//     });

//     return res.status(200).json(
//         new ApiResponse(200, videos, "Videos fetched successfully")
//     );
// });

// const publishAVideo = asyncHandler(async (req, res) => {
//     const { Title, description } = req.body;
    
//     console.log("Files received:", req.files);
//     console.log("Body:", { Title, description });
    
//     if (!Title || !description) {
//         throw new ApiError(400, "Title and description are required");
//     }
    
//     if (!req.files?.videoFile?.[0]) {
//         throw new ApiError(400, "Video file is required");
//     }
    
//     if (!req.files?.thumbnail?.[0]) {
//         throw new ApiError(400, "Thumbnail is required");
//     }
    
//     const videoLocalPath = req.files.videoFile[0].path;
//     const thumbnailLocalPath = req.files.thumbnail[0].path;
    
//     console.log("File paths:", { videoLocalPath, thumbnailLocalPath });
    
//     try {
//         // Upload to cloudinary
//         const videoUpload = await uploadOnCloudinary(videoLocalPath);
//         const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
        
//         if (!videoUpload) {
//             throw new ApiError(500, "Error uploading video file to Cloudinary");
//         }
        
//         if (!thumbnailUpload) {
//             throw new ApiError(500, "Error uploading thumbnail to Cloudinary");
//         }
        
//         console.log("Cloudinary uploads successful");
        
//         // Create video document
//         const video = await Video.create({
//             videoFile: videoUpload.url,
//             thumbnail: thumbnailUpload.url,
//             Title,
//             description,
//             duration: videoUpload.duration || 0,
//             owner: req.user._id,
//             isPublished: true
//         });
        
//         // Cleanup temp files after successful upload (optional)
//         try {
//             const fs = await import('fs');
//             if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath);
//             if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath);
//         } catch (cleanupError) {
//             console.error("Cleanup error:", cleanupError);
//         }
        
//         return res.status(201).json(
//             new ApiResponse(201, video, "Video published successfully")
//         );
        
//     } catch (error) {
//         console.error("Video upload error:", error);
        
//         // Cleanup temp files on error (optional)
//         try {
//             const fs = await import('fs');
//             if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath);
//             if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath);
//         } catch (cleanupError) {
//             console.error("Cleanup error:", cleanupError);
//         }
        
//         throw new ApiError(500, error.message || "Video upload failed");
//     }
// });

// // cometing this for WatchHistory option.
// // const updateWatchHistory = asyncHandler(async (req, res) => {
// //   const { videoId } = req.params;

// //   if (!isValidObjectId(videoId)) {
// //     throw new ApiError(400, "Invalid video ID");
// //   }

// //   // 1. Increment views first and return updated doc
// //   const updatedVideo = await Video.findByIdAndUpdate(
// //     videoId,
// //     { $inc: { views: 1 } },
// //     { new: true } // return updated document
// //   );

// //   if (!updatedVideo) {
// //     throw new ApiError(404, "Video not found");
// //   }

// //   // 2. Aggregate owner + likes info
// //   const video = await Video.aggregate([
// //     { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
// //     {
// //       $lookup: {
// //         from: "users",
// //         localField: "owner",
// //         foreignField: "_id",
// //         as: "owner",
// //         pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }]
// //       }
// //     },
// //     {
// //       $lookup: {
// //         from: "likes",
// //         localField: "_id",
// //         foreignField: "video",
// //         as: "likes"
// //       }
// //     },
// //     {
// //       $addFields: {
// //         owner: { $first: "$owner" },
// //         likesCount: { $size: "$likes" },
// //         isLiked: {
// //           $cond: {
// //             if: { $in: [req.user?._id, "$likes.likedBy"] },
// //             then: true,
// //             else: false
// //           }
// //         },
// //         views: updatedVideo.views // ✅ inject incremented views
// //       }
// //     },
// //     { $project: { likes: 0 } }
// //   ]);

// //   // 3. Save watch history if user logged in
// //   if (req.user?._id) {
// //     await User.findByIdAndUpdate(req.user._id, {
// //       $addToSet: { watchHistory: videoId }
// //     });
// //   }

// //   return res
// //     .status(200)
// //     .json(new ApiResponse(200, video[0], "Video fetched successfully"));
// // });


// const deleteVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
    
//     if (!isValidObjectId(videoId)) {
//         throw new ApiError(400, "Invalid video ID")
//     }
    
//     // Check if video exists and user is owner
//     const video = await Video.findById(videoId)
    
//     if (!video) {
//         throw new ApiError(404, "Video not found")
//     }
    
//     if (video.owner.toString() !== req.user._id.toString()) {
//         throw new ApiError(403, "You are not authorized to delete this video")
//     }
    
//     // Delete the video
//     await Video.findByIdAndDelete(videoId)
    
//     // Remove from all users' watch history
//     await User.updateMany(
//         { watchHistory: videoId },
//         { $pull: { watchHistory: videoId } }
//     )
    
//     return res.status(200).json(
//         new ApiResponse(200, {}, "Video deleted successfully")
//     )
// })

// const togglePublishStatus = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
    
//     if (!isValidObjectId(videoId)) {
//         throw new ApiError(400, "Invalid video ID")
//     }
    
//     // Check if video exists and user is owner
//     const video = await Video.findById(videoId)
    
//     if (!video) {
//         throw new ApiError(404, "Video not found")
//     }
    
//     if (video.owner.toString() !== req.user._id.toString()) {
//         throw new ApiError(403, "You are not authorized to modify this video")
//     }
    
//     // Toggle publish status
//     const updatedVideo = await Video.findByIdAndUpdate(
//         videoId,
//         { $set: { isPublished: !video.isPublished } },
//         { new: true }
//     )
    
//     const message = updatedVideo.isPublished ? "Video published" : "Video unpublished"
    
//     return res.status(200).json(
//         new ApiResponse(200, updatedVideo, message)
//     )
// })

// // for watchHsitory
// export const updateWatchHistory = asyncHandler(async (req, res) => {
//     // 1. Get required data from the request body and user session
//     // currentTime will come from the React player (e.g., every 30 seconds)
//     const { videoId, currentTime } = req.body;
//     const userId = req.user?._id; 
    
//     // Check if the user is logged in
//     if (!userId) {
//         // Logged-out users can still watch, but we don't track history
//         return res.status(200).json({ message: "Not logged in, history not tracked." });
//     }

//     // Basic validation
//     if (!videoId || currentTime === undefined || currentTime === null) {
//         throw new ApiError(400, "Video ID and current time are required");
//     }

//     if (!isValidObjectId(videoId)) {
//          throw new ApiError(400, "Invalid video ID");
//     }

//     // 2. Fetch the video details to determine duration and completion status
//     const video = await Video.findById(videoId, 'duration');
//     if (!video) {
//         throw new ApiError(404, "Video not found");
//     }

//     const totalDuration = video.duration || 1; 
    
//     // Check if watch duration is very close to or exceeds total duration
//     const isCompleted = (currentTime / totalDuration) >= 0.9; // 90% completion considered done

//     // 3. Find and Update/Create the WatchHistory document (The CORE LOGIC)
//     const historyRecord = await WatchHistory.findOneAndUpdate(
//         { userId, videoId }, // Query
//         {
//             $set: {
//                 watchDurationSeconds: Math.round(currentTime), 
//                 isCompleted: isCompleted, 
//                 lastWatchedAt: new Date(), 
//             },
//             // If the record doesn't exist, these fields are set for the first time
//             $setOnInsert: {
//                 userId: userId,
//                 videoId: videoId,
//             }
//         },
//         { 
//             new: true, // Return the updated document
//             upsert: true, // Create if not found
//         }
//     );

//     // 4. Send a success response
//     return res
//         .status(200)
//         .json(
//             new ApiResponse(200, historyRecord, "Watch history updated successfully")
//         );
// });

// export {
//     getAllVideos,
//     publishAVideo,
//    // getVideoById,
//     deleteVideo,
//     togglePublishStatus,
//     updateWatchHistory // <-- Make sure to export this new function
// }
