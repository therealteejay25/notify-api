import Integration from "../models/Integration";
import User from "../models/User";

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 6,
  premium: 10,
};

/**
 * Validates whether a user can add a new integration.
 * - Checks if the user exists
 * - Checks for duplicates (same provider + accountId)
 * - Enforces plan limits
 */
export const validateIntegration = async (
  userId: string,
  provider: string,
  accountId: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  // 🔁 Duplicate check
  const existing = await Integration.findOne({ userId, provider, accountId });
  if (existing) throw new Error(`This ${provider} account is already connected.`);

  // 📊 Plan limit check
  const limit = PLAN_LIMITS[user.plan];
  const currentCount = await Integration.countDocuments({ userId });
  if (currentCount >= limit) {
    throw new Error(`Plan limit reached. ${user.plan} plan allows ${limit} integrations.`);
  }

  return user;
};
