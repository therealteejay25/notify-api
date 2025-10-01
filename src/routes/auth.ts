import { Router } from "express";
import { logout, refreshAccessToken, requestMagicLink, verifyMagicLink } from "../controllers/auth";
const router = Router();

router.post("/link", requestMagicLink);
router.get("/verify", verifyMagicLink);
router.get("/logout", logout);
router.get("refresh", refreshAccessToken);

export default router;