import { google } from "googleapis";
import Integration from "../models/Integration";
import { Request, Response } from "express";
import dotenv from "dotenv";
import User from "../models/User";
import { validateIntegration } from "../utils/integrationUtils";
import { fetchGmailNotifications } from "../services/gmail.ts";
dotenv.config();

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 6,
  premium: 10,
};

export const redirectToGoogle = async (req: Request, res: Response) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",  // read messages
    "https://www.googleapis.com/auth/userinfo.email",  // get account email
    "https://www.googleapis.com/auth/userinfo.profile", // profile info
    "openid"
  ];
  

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // ensures refresh token every time
  });

  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).json({ message: "Code not found." });
  
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!,
      );
  
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
  
      const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
      const { data: userInfo } = await oauth2.userinfo.get();
  
      const accountId = userInfo.id!;
      const email = userInfo.email!;
      const userId = (req as any).userId;
  
      // 🔥 Centralized check
      await validateIntegration(userId, "gmail", accountId);
  
      const integration = await Integration.create({
        userId,
        provider: "gmail",
        accountId,
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      });
  
      await User.findByIdAndUpdate(userId, { $addToSet: { integrations: integration._id } });
  
      return res.status(200).json({
        message: "Gmail connected successfully.",
        gmail: integration,
      });
    } catch (error) {
      console.error("Google callback error:", error);
      return res.status(500).json({ message: (error as any).message });
    }
  };

export const getGmailNotifications = async (req: Request, res: Response) => {
  try {
    const integrationId = req.params.integrationId;
    const notifications = await fetchGmailNotifications(integrationId);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: (error as any).message });
  }
};
