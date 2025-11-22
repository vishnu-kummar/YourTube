// video.models.js - Updated with tags field
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    Title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    // NEW: Tags for content-based filtering
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }]
}, { timestamps: true });

// Index for faster tag-based queries
videoSchema.index({ tags: 1 });
videoSchema.index({ views: -1 }); // For trending/popular sorting
videoSchema.index({ createdAt: -1 }); // For recent videos

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);


//-----------------------------------------------------------------------------------------------------------
// import mongoose ,{Schema} from "mongoose";
// import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';  // for watchHistory
// // npm i mongoose-aggregate-paginate-v2
// // to upload files we need altlease 2 packages for backend  1:expressfileUpload  2:MULTER [here we'll use multer]  [npm i cloudinary multer]
// // hum user se multer ke through file lenge aur temporary apne server pr rkh denge, uske baad cloudinary ka use krke local storage se file lekr server pr rkh denge

// const videoSchema = new Schema({
//     videoFile:{
//         type:String,
//         required:true,
//     },
//     thumbnail:{
//         type:String,
//         required:true,
//     },
//     Title:{
//         type:String,
//         required:true,
//     },
//     description:{
//         type:String,
//         required:true,
//     },
//     duration:{
//         type:Number,
//         required:true,
//     },
//     views:{
//         type:Number,
//         default:0
//     },
//     isPublished:{
//         type:Boolean,
//         default:true
//     },
//     owner:{
//         type: Schema.Types.ObjectId,
//         ref:"User"
//     }

// },{timestamps:true})

// videoSchema.plugin(mongooseAggregatePaginate)
// export const Video = mongoose.model("Video",videoSchema)