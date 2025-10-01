import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import Integration from "../models/Integration";
import User from "../models/User";
import { getMentions } from "../services/twitter.ts";
import dotenv from "dotenv";

dotenv.config();

const TWITTER_SCOPES = ["tweet.read", "users.read", "offline.access"];

// 🔐 PKCE Helpers
const generateCodeVerifier = () => crypto.randomBytes(32).toString("hex");
const generateCodeChallenge = (verifier: string) =>
  crypto.createHash("sha256").update(verifier).digest("base64url");

// ⚡ Temporary memory store (state → verifier)
let codeVerifierCache: Record<string, string> = {};

// 🔹 Redirect user to Twitter auth
export const redirectToTwitter = (req: Request, res: Response) => {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = crypto.randomBytes(16).toString("hex");

  // Store verifier keyed by state
  codeVerifierCache[state] = verifier;

  const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${
    process.env.TWITTER_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(process.env.TWITTER_REDIRECT_URI!)}&scope=${encodeURIComponent(
    TWITTER_SCOPES.join(" ")
  )}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;

  return res.redirect(url);
};

// 🔹 Handle Twitter callback
export const twitterCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).json({ message: "Missing code or state" });

    const verifier = codeVerifierCache[state as string];
    if (!verifier) return res.status(400).json({ message: "Missing or expired PKCE verifier" });

    // ⚡ Exchange code for access token
    const tokenRes = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code: code as string,
        grant_type: "authorization_code",
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: process.env.TWITTER_REDIRECT_URI!,
        code_verifier: verifier,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenRes.data;

    // ✅ Fetch user profile
    const profileRes = await axios.get("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const accountId = profileRes.data.data.id;
    const username = profileRes.data.data.username;

    // 🔎 Get userId from your session/JWT
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 🔎 Prevent duplicate connection
    const exists = await Integration.findOne({ userId, provider: "twitter", accountId });
    if (exists) return res.status(400).json({ message: "This Twitter account is already connected." });

    // ✅ Save integration
    const integration = await Integration.create({
      userId,
      provider: "twitter",
      accountId,
      username,
      email: null,
      accessToken: access_token,
      refreshToken: refresh_token,
      scopes: TWITTER_SCOPES,
    });

    await User.findByIdAndUpdate(userId, { $addToSet: { integrations: integration._id } });

    // Clean up cache
    delete codeVerifierCache[state as string];

    return res.status(200).json({
      message: "Twitter connected successfully",
      twitter: integration,
    });
  } catch (err: any) {
    console.error("Twitter callback error:", err.response?.data || err.message);
    return res.status(500).json({
      message: "Twitter auth failed",
      error: err.response?.data || err.message,
    });
  }
};

// 🔹 Fetch Twitter notifications (mentions)
export const fetchTwitterNotifications = async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const notifications = await getMentions(integrationId); // add likes, retweets, followers in your service
    res.status(200).json({ notifications });
  } catch (err: any) {
    console.error("Twitter fetch error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
