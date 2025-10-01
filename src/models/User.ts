import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  magicLinkToken: string | null;
  magicLinkExpires: Date | null;
  magicLinkUsed: boolean;
  plan: "free" | "pro" | "premium";
  planDue: Date;
  timeZone: string;
  workDayStart: Date;
  workDayEnd: Date;
  integrations: Types.ObjectId[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    magicLinkToken: { type: String, required: false },
    magicLinkExpires: { type: Date, required: false },
    magicLinkUsed: { type: Boolean, required: false },
    plan: { type: String, enum: ["free", "pro", "premium"], default: "free" },
    planDue: { type: Date, required: false },
    timeZone: { type: String },
    workDayStart: { type: Date },
    workDayEnd: { type: Date },
    integrations: [{ type: Schema.Types.ObjectId, ref: "Tool" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
