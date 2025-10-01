import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotification extends Document {
    userId: string;
    integrationId: string;
    provider: string;
    type: "mention" | "dm" | "tweet",
    title: string;
    content: string;
    link: string;
    read: boolean;
    createdAt: Date;
};


const notificationSchema = new Schema({
    userId: { type: String, ref: "User", required: true },
    integrationId: { type: String, ref: "Integration", required: true },
    provider: String,
    type: { type: String, enum: [ "mention", "dm", "tweet" ]  },
    title: String,
    content: String,
    link: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;