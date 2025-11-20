import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateWatchHistory     
} from "../controllers/video.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();

// ============================================
// CRITICAL: ROUTE ORDER MATTERS!!!
// Static/specific routes MUST come BEFORE dynamic /:param routes
// ============================================

// 1. GET all videos (Public)
router.route("/").get(getAllVideos);

// 2. POST upload video (Protected) - MUST be on "/" path
router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

// 3. PATCH watch history (Protected) - BEFORE /:videoId
router.route("/watch-update").patch(verifyJWT, updateWatchHistory);

// 4. PATCH toggle publish (Protected) - BEFORE general /:videoId
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// 5. Dynamic /:videoId routes (MUST BE LAST)
router.route("/:videoId")
    .get(getVideoById)                      // Public - view video
    .delete(verifyJWT, deleteVideo)         // Protected - delete video
    .patch(verifyJWT, upload.single("thumbnail")); // Protected - update thumbnail

export default router;