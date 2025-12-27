import { Schema, model, models } from "mongoose";
import { ITour } from "./tour.interface";

const tourSchema = new Schema<ITour>(
  {
    // 1. Relationship
    guideId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guide ID is required"],
    },

    // 2. Tour Details (Section 3.3)
    title: {
      type: String,
      required: [true, "Tour title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Tour description is required"],
      trim: true,
    },
    itinerary: {
      type: String,
      required: [true, "Tour itinerary is required"],
      trim: true,
    },

    // 3. Search & Categorization
    category: {
      type: String,
      required: [true, "Tour category is required"],
      trim: true,
    },
    city: {
      // Correctly mapping 'city' from the interface
      type: String,
      required: [true, "City/Location is required"],
      trim: true,
    },
    languages: [{ type: String, required: true }],
    expertise: [{ type: String, required: true }],
    // 4. Logistics & Pricing
    price: {
      type: Number,
      required: [true, "Tour price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: Number,
      required: [true, "Tour duration is required"],
      min: [0.5, "Duration must be at least 30 minutes"], // Changed min to 0.5 hours
    },
    meetingPoint: {
      type: String,
      required: [true, "Meeting point is required"],
      trim: true,
    },
    maxGroupSize: {
      type: Number,
      required: [true, "Maximum group size is required"],
      min: [1, "Group size must be at least 1"],
    },
    image: {
      type: String,
    },

    // 5. Status & Statistics (Stored Fields)
    isActive: {
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    // Mongoose handles createdAt and updatedAt
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for fast searching and filtering
tourSchema.index({ guideId: 1 }); // For Guide's dashboard list
tourSchema.index({ city: 1, category: 1 }); // For filtering results
tourSchema.index({ title: "text", description: "text" }); // For full-text search

export const Tour = models.Tour || model<ITour>("Tour", tourSchema);
