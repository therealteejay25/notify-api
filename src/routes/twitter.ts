import { Router } from "express";
import { redirectToTwitter, twitterCallback, fetchTwitterNotifications } from "../controllers/twitter.ts";
const router = Router();

/**
 * @route   GET /api/twitter/connect
 * @desc    Redirect user to Twitter OAuth page
 */
router.get("/auth", redirectToTwitter);

/**
 * @route   GET /api/twitter/callback
 * @desc    Twitter OAuth callback
 */
router.get("/callback", twitterCallback);

/**
 * @route   GET /api/twitter/:integrationId/notifications
 * @desc    Fetch Twitter notifications (mentions, followers, likes, retweets)
 * @query   tweetId? -> Required only for likes/retweets
 */
router.get("/:integrationId/notifications", fetchTwitterNotifications);

export default router;
