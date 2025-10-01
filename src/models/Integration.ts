import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIntegration extends Document {
    userId: string;
    provider: string;
    accountId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    scopes: [];
};

export const IntegrationSchema = new Schema({
    userId: { type: String, required: true },
    provider: { type: String, required: true },
    accountId: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    scope: { type: Schema.Types.Mixed },
  });

const Integration = mongoose.model<IIntegration>("Integration", IntegrationSchema);
export default Integration;