import { Router } from "express";
import { redirectToGoogle, googleCallback, getGmailNotifications } from "../controllers/gmail.ts";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/auth", requireAuth, redirectToGoogle);  
router.get("/callback", requireAuth, googleCallback); 
router.get("/:integrationId/notifications", requireAuth, getGmailNotifications);


export default router;