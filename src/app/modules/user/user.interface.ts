import { Types } from "mongoose";

export enum Role {
  ADMIN = "ADMIN",
  GUIDE = "GUIDE",
  TOURIST = "TOURIST",
}

export enum UserStatus {
  ACTIVE = "ACTIVE", // User can log in and use all features for their role.
  BLOCKED = "BLOCKED", // Cannot log in (Admin action, usually permanent until unblocked).
  PENDING_APPROVAL = "PENDING_APPROVAL", // Useful for Guides who need manual vetting before listing tours.
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string; // The unique ID provided by the service (e.g., Google ID, user's email for credentials).
}

export interface IUser {
  _id?: Types.ObjectId;

  // 1. Core Identity & Authentication
  name: string;
  email: string;
  auths: IAuthProvider[];
  password?: string;
  isVerified: boolean;
  passwordChangedAt?: Date; // To invalidate old tokens upon password change.
  phoneNumber?: string;
  // 2. Role & Status Management
  role: Role;
  userStatus?: UserStatus;
  isDeleted?: boolean; // Soft Delete: If true, the user is logically inactive but their data (for bookings/payments) persists.

  // 3. Common Profile Details (Section 3.2)
  photo?: string; // URL to profile picture
  bio?: string;
  languages?: string[]; // e.g., ['English', 'Spanish', 'French']
  address?: string; // Optional: Can be used for guide location or primary residence.

  // 4. Guide Specific Fields (Only if role is GUIDE)
  expertise?: string[]; // e.g., ['History', 'Food', 'Nightlife']
  dailyRate?: number; // Base rate charged per day for custom tours/consultation
  averageRating?: number;

  // 5. Tourist Specific Fields (Only if role is TOURIST)
  preferences?: string[]; // e.g., ['Adventure', 'Budget', 'Relaxation', 'Family Friendly']

  // 6. Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
