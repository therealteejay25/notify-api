import { google, gmail_v1 } from "googleapis";
import Notification from "../models/Notification";
import Integration from "../models/Integration";
import { Types } from "mongoose";

interface GmailNotification {
  userId: string;
  integrationId: string;
  provider: "gmail";
  type: "dm";
  title: string;
  content: string;
  link: string;
}

export const fetchGmailNotifications = async (
  integrationId: string
): Promise<GmailNotification[]> => {
  const integration = await Integration.findById(integrationId);
  if (!integration) throw new Error("Integration not found");

  const { accessToken } = integration;
  if (!accessToken) throw new Error("No access token for Gmail integration");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail: gmail_v1.Gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const res = await gmail.users.messages.list({ userId: "me", maxResults: 10 });
  if (!res.data.messages) return [];

  const notifications: GmailNotification[] = [];

  for (const msg of res.data.messages) {
    if (!msg.id) continue;

    const msgDetail = await gmail.users.messages.get({ userId: "me", id: msg.id });
    const headers = msgDetail.data.payload?.headers;
    const subjectHeader = headers?.find(h => h.name === "Subject")?.value || "No subject";

    notifications.push({
      userId: integration.userId,
      integrationId: integration._id as string,
      provider: "gmail",
      type: "dm",
      title: subjectHeader,
      content: msgDetail.data.snippet || "",
      link: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
    });
  }

  await Notification.insertMany(notifications);
  return notifications;
};
