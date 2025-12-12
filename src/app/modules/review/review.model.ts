import { Schema, model } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    touristId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tourId: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    guideId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // Ensure one review per booking
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
  }
);

// Ensure a user can only leave one review per booking
reviewSchema.index({ bookingId: 1, touristId: 1 }, { unique: true });

// Create a compound index for faster queries
reviewSchema.index({ tourId: 1, guideId: 1 });

export const Review = model<IReview>("Review", reviewSchema);
