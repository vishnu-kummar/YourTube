import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,     
} from "../controllers/video.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middlewares.js"
import { updateWatchHistory } from "../controllers/video.controllers.js" // <-- Import the new controller function

const router = Router();

// Public routes (no authentication required)
router.route("/").get(getAllVideos); // Make video listing public

router.route("/:videoId").get(getVideoById); // Make video viewing public

// Protected routes (authentication required)
router.route("/").post(
    verifyJWT, // Only for uploading
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail", 
            maxCount: 1,
        },
    ]),
    publishAVideo
);

// Add the new route for updating watch history
router.route("/watch-update").patch(verifyJWT, updateWatchHistory); // <-- NEW ROUTE

router.route("/:videoId").delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"));

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router