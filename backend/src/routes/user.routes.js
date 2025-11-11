// This connects URLs to controller functions.
import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken,
    changeCurrentPassword,getCurrentUser,updateAccountDetails,
    updateUserAvatar,updateUserCoverImage,getUserChannelProfile,
    getWatchHistory } from "../controllers/user.controllers.js";
    
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()


// let say koi user "/api/v1/users/register" type krta hai toh hum use controll denge userRouter ka (user.routes.js): jise below code handle krega
// '/users' hit hote hi '/register' hit hoga , register ke through registerUser (jo ki user.controller.js me define hai) call hua
// ab registerUser jo ki controller me define hai, wo function, ek response bhejega.
// to check whetehr response i.e api response is wroking or not: search thunder client(vsCode plugin) or postman (we'll down download postman)
// If someone sends POST /api/v1/users/register → runs registerUser.
//  search this on postman http://localhost:8000/users/register 
router.route("/register").post(
    
    upload.fields([    // upload humne multer se liya so that images ya file user se lya ja sake
        {
            name: "avatar",
            maxCount:1
        },
        {
            name : "coverImage",
            maxCount: 1
        }
    ]),
    
    registerUser

)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router

// now call this router in app.js