import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    // Check if channel exists
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    
    // Users cannot subscribe to themselves
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }
    
    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })
    
    if (existingSubscription) {
        // Unsubscribe - remove the subscription
        await Subscription.findByIdAndDelete(existingSubscription._id)
        
        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
        )
    } else {
        // Subscribe - create new subscription
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        
        return res.status(200).json(
            new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    // Check if channel exists
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    
    // Get all subscribers of this channel with their details
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
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
                subscriber: { $first: "$subscriberDetails" }
            }
        },
        {
            $project: {
                subscriberDetails: 0,
                __v: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])
    
    return res.status(200).json(
        new ApiResponse(200, {
            subscribers,
            totalSubscribers: subscribers.length
        }, "Channel subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    
    // Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }
    
    // Check if user exists
    const user = await User.findById(subscriberId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    // Get all channels this user has subscribed to with their details
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "channel",
                foreignField: "channel",
                as: "subscriberCount"
            }
        },
        {
            $addFields: {
                channel: { $first: "$channelDetails" },
                subscriberCount: { $size: "$subscriberCount" }
            }
        },
        {
            $project: {
                channelDetails: 0,
                __v: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])
    
    return res.status(200).json(
        new ApiResponse(200, {
            subscribedChannels,
            totalSubscribedChannels: subscribedChannels.length
        }, "Subscribed channels fetched successfully")
    )
})


// controllers/subscription.controller.js
// controllers/subscription.controller.js
const checkSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    
    if (!subscriberId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Check subscription status in database
    const subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId
    });

    return res.status(200).json(
        new ApiResponse(200, { 
            isSubscribed: !!subscription 
        }, "Subscription status checked successfully")
    );
});
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    checkSubscriptionStatus // checkSubscriptionStatus
}