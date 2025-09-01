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

router.route("/:videoId").delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"));

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router