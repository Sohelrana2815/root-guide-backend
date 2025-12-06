import { Types } from "mongoose";

export interface ITour {
  _id?: Types.ObjectId;

  // 1. Relationship
  guideId: Types.ObjectId; // Reference to the User (Guide)

  // 2. Tour Details (Section 3.3)
  title: string;
  description: string;
  itinerary: string;

  // 3. Search & Categorization
  category: string; // CRITICAL for Filter (e.g., "History", "Food", "Adventure")
  city: string; // CRITICAL for Search (e.g., "Paris", "New Orleans"). Renamed 'location' to 'city' for clarity based on interface.

  // 4. Logistics & Pricing
  price: number;
  duration: number; // In hours (e.g., 4.5)
  meetingPoint: string; // Specific address
  maxGroupSize: number;
  images: string;

  // 5. Status & Statistics (Stored fields, not virtuals)
  isActive: boolean; // Default: true. Allows guide to "turn off" the listing.
  averageRating: number; // Stored for display performance (0.0 to 5.0)
  reviewCount: number; // Stored for display performance

  // 6. Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
