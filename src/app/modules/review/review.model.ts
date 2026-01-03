/* eslint-disable @typescript-eslint/no-explicit-any */
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

reviewSchema.statics.calculateAverageRatings = async function (
  tourId,
  guideId
) {
  // --- TOUR CALCULATION ---
  const tourStats = await this.aggregate([
    { $match: { tourId: tourId } },
    {
      $group: {
        _id: "$tourId",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (tourStats.length > 0) {
    await model("Tour").findByIdAndUpdate(tourId, {
      reviewCount: tourStats[0].nRating,
      averageRating: Math.round(tourStats[0].avgRating * 10) / 10, // Round to 1 decimal (e.g., 4.5)
    });
  } else {
    await model("Tour").findByIdAndUpdate(tourId, {
      reviewCount: 0,
      averageRating: 0,
    });
  }

  // --- GUIDE CALCULATION ---
  // We calculate average based on EVERY review this guide has ever received across all their tours
  const guideStats = await this.aggregate([
    { $match: { guideId: guideId } },
    {
      $group: {
        _id: "$guideId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (guideStats.length > 0) {
    await model("User").findByIdAndUpdate(guideId, {
      averageRating: Math.round(guideStats[0].avgRating * 10) / 10,
    });
  } else {
    await model("User").findByIdAndUpdate(guideId, {
      averageRating: 0,
    });
  }
};

// 2. Middleware to trigger calculation after a review is saved
reviewSchema.post("save", function () {
  // 'this' refers to the review document that was just saved
  (this.constructor as any).calculateAverageRatings(this.tourId, this.guideId);
});

// 3. Middleware to trigger calculation after a review is deleted (optional but recommended)
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await (doc.constructor as any).calculateAverageRatings(
      doc.tourId,
      doc.guideId
    );
  }
});

// Ensure a user can only leave one review per booking
reviewSchema.index({ bookingId: 1, touristId: 1 }, { unique: true });

// Create a compound index for faster queries
reviewSchema.index({ tourId: 1, guideId: 1 });

export const Review = model<IReview>("Review", reviewSchema);
