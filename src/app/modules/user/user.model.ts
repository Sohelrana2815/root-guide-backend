import { model, Schema } from "mongoose";
import { IAuthProvider, IUser, Role, UserStatus } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: {
      type: String,
      required: true,
      enum: ["google", "credentials", "github"],
    },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    userStatus: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    auths: { type: [authProviderSchema], required: true },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    passwordChangedAt: { type: Date },
    photo: { type: String },
    bio: { type: String },
    phoneNumber: { type: String },
    languages: [{ type: String }],
    address: { type: String },
    expertise: [{ type: String }],
    dailyRate: { type: Number, min: 0 },
    averageRating: { type: Number, min: 1, max: 5 },
    preferences: [{ type: String }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model<IUser>("User", userSchema);
