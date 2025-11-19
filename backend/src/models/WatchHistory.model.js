import mongoose, { Schema } from 'mongoose';

const watchHistorySchema = new Schema({
    // 1. Reference to the user who watched the video
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    // 2. Reference to the video that was watched
    videoId: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    },
    
    // 3. Crucial for signal strength in Content-Based Filtering
    watchDurationSeconds: {
        type: Number,
        default: 0,
    },
    
    // 4. Crucial for recency and filtering
    lastWatchedAt: {
        type: Date,
        default: Date.now,
    },
    
    // 5. Optional but helpful flag for displaying a "Completed" status
    isCompleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Crucial: This index ensures that finding a history record for a specific
// user and video pair is extremely fast and scalable.
watchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: true });

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema); 