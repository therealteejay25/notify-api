import axios from "axios";
import Integration from "../models/Integration";
import Notification from "../models/Notification";

const BASE_URL = "https://api.twitter.com/2";

/**
 * 🔄 Refresh Twitter access token
 */
export const refreshTwitterToken = async (integrationId: string) => {
  const integration = await Integration.findById(integrationId);
  if (!integration) throw new Error("Integration not found");

  const res = await axios.post(
    "https://api.twitter.com/2/oauth2/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.TWITTER_CLIENT_ID!,
      refresh_token: integration.refreshToken!,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, refresh_token } = res.data;
  integration.accessToken = access_token;
  if (refresh_token) integration.refreshToken = refresh_token;
  await integration.save();

  return integration.accessToken;
};

/**
 * Helper: perform API call with auto-refresh
 */
const fetchWithAuth = async (integrationId: string, url: string) => {
  const integration = await Integration.findById(integrationId);
  if (!integration) throw new Error("Integration not found");

  let token = integration.accessToken;

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { data: res.data, integration };
  } catch (err: any) {
    if (err.response?.status === 401) {
      token = await refreshTwitterToken(integrationId);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: res.data, integration };
    }
    throw err;
  }
};

/**
 * 🐦 Mentions
 */
export const getMentions = async (integrationId: string) => {
  const { integration } = await fetchWithAuth(integrationId, "");
  if (!integration) throw new Error("Integration not found");

  const { data } = await fetchWithAuth(
    integrationId,
    `${BASE_URL}/users/${integration.accountId}/mentions?max_results=5`
  );

  const notifications = (data.data || []).map((mention: any) => ({
    userId: integration.userId,
    integrationId,
    provider: "twitter",
    type: "mention",
    title: `New mention`,
    content: mention.text,
    link: `https://twitter.com/i/web/status/${mention.id}`,
  }));

  if (notifications.length) await Notification.insertMany(notifications);
  return notifications;
};

/**
 * ❤️ Likes
 */
export const getLikes = async (integrationId: string, tweetId: string) => {
  const { data, integration } = await fetchWithAuth(
    integrationId,
    `${BASE_URL}/tweets/${tweetId}/liking_users`
  );

  const notifications = (data.data || []).map((user: any) => ({
    userId: integration!.userId,
    integrationId,
    provider: "twitter",
    type: "like",
    title: `New like from @${user.username}`,
    content: `@${user.username} liked your tweet.`,
    link: `https://twitter.com/i/web/status/${tweetId}`,
  }));

  if (notifications.length) await Notification.insertMany(notifications);
  return notifications;
};

/**
 * 🔁 Retweets
 */
export const getRetweets = async (integrationId: string, tweetId: string) => {
  const { data, integration } = await fetchWithAuth(
    integrationId,
    `${BASE_URL}/tweets/${tweetId}/retweeted_by`
  );

  const notifications = (data.data || []).map((user: any) => ({
    userId: integration!.userId,
    integrationId,
    provider: "twitter",
    type: "retweet",
    title: `Retweet from @${user.username}`,
    content: `@${user.username} retweeted your tweet.`,
    link: `https://twitter.com/i/web/status/${tweetId}`,
  }));

  if (notifications.length) await Notification.insertMany(notifications);
  return notifications;
};

/**
 * 👥 New Followers
 */
export const getFollowers = async (integrationId: string) => {
    const { data, integration } = await fetchWithAuth(
      integrationId,
      `${BASE_URL}/users/${integrationId}/followers?max_results=5`
    );
  
    const notifications = (data.data || []).map((user: any) => ({
      userId: integration.userId,
      integrationId,
      provider: "twitter",
      type: "follow",
      title: `New follower`,
      content: `@${user.username} followed you.`,
      link: `https://twitter.com/${user.username}`,
    }));
  
    if (notifications.length) await Notification.insertMany(notifications);
    return notifications;
  };
  