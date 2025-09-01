// routes/subscription.routes.js
import { Router } from 'express';
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
  checkSubscriptionStatus,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(verifyJWT);


router.route("/status/c/:channelId")
  .get(checkSubscriptionStatus);

router.route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

router.route("/u/:subscriberId")
  .get(getSubscribedChannels);

export default router;