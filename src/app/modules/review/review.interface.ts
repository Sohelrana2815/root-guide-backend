import { Types } from "mongoose";

export interface IReview {
  _id?: Types.ObjectId;

  // 1. References (Who, What, and Validation)
  touristId: Types.ObjectId; // Reference to User (The reviewer)
  tourId: Types.ObjectId;    // Reference to Tour (The service being reviewed)
  guideId: Types.ObjectId;   // Reference to User (The guide being reviewed)
  
  // CRITICAL: Linking to booking ensures this is a "Verified Purchase"
  // It prevents users from reviewing tours they never actually took.
  bookingId: Types.ObjectId; 

  // 2. Content
  rating: number; // 1 to 5 (Integers or float like 4.5)
  comment: string; // The text feedback

  // 3. Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}