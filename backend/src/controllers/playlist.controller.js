import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    
    // Validate input
    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required")
    }
    
    if (!description?.trim()) {
        throw new ApiError(400, "Playlist description is required")
    }
    
    // Create playlist
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        videos: [],
        owner: req.user._id
    })
    
    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }
    
    // Get created playlist with owner details
    const createdPlaylist = await Playlist.findById(playlist._id)
        .populate("owner", "username fullname avatar")
        .lean()
    
    return res.status(201).json(
        new ApiResponse(201, createdPlaylist, "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    // Get user playlists with video count and first video thumbnail
    const playlists = await Playlist.aggregate([
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            Thumbnail: 1,
                            Title: 1,
                            duration: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" },
                videoCount: { $size: "$videos" },
                firstVideoThumbnail: { $first: "$videoDetails.Thumbnail" },
                totalDuration: { $sum: "$videoDetails.duration" }
            }
        },
        {
            $project: {
                ownerDetails: 0,
                videoDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])
    
    return res.status(200).json(
        new ApiResponse(200, {
            playlists,
            totalPlaylists: playlists.length
        }, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    
    // Get playlist with all video details
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
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
                            owner: { $first: "$videoOwner" }
                        }
                    },
                    {
                        $project: {
                            videoOwner: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" },
                videos: "$videoDetails",
                videoCount: { $size: "$videoDetails" },
                totalDuration: { $sum: "$videoDetails.duration" }
            }
        },
        {
            $project: {
                ownerDetails: 0,
                videoDetails: 0
            }
        }
    ])
    
    if (!playlist?.length) {
        throw new ApiError(404, "Playlist not found")
    }
    
    return res.status(200).json(
        new ApiResponse(200, playlist[0], "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    // Validate IDs
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if playlist exists and user is owner
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }
    
    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    // Check if video is already in playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist")
    }
    
    // Add video to playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
    ).populate("owner", "username fullname avatar")
    
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    // Validate IDs
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // Check if playlist exists and user is owner
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }
    
    // Check if video is in playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is not in the playlist")
    }
    
    // Remove video from playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    ).populate("owner", "username fullname avatar")
    
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    
    // Check if playlist exists and user is owner
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }
    
    // Delete playlist
    await Playlist.findByIdAndDelete(playlistId)
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    
    // Validate input - at least one field should be provided
    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least name or description is required")
    }
    
    // Check if playlist exists and user is owner
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }
    
    // Prepare update object
    const updateData = {}
    if (name?.trim()) updateData.name = name.trim()
    if (description?.trim()) updateData.description = description.trim()
    
    // Update playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updateData },
        { new: true }
    ).populate("owner", "username fullname avatar")
    
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}