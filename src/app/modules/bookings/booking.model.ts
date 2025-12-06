import { model, Schema } from "mongoose";
import { BookingStatus, IBooking } from "./booking.interface";

const bookingSchema = new Schema<IBooking>(
  {
    touristId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tourist ID is required"],
    },
    tourId: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Tour ID is required"],
    },
    guideId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guide ID is required"],
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      // Not required initially; populated after successful payment logic
      default: null,
    },
    guestCount: {
      type: Number,
      required: [true, "Guest count is required"],
      min: [1, "At least 1 guest is required"],
    },
    bookingDate: {
      type: Date,
      // required: [true, "Booking date is required"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(BookingStatus),
        message: "{VALUE} is not a valid booking status",
      },
      default: BookingStatus.PENDING,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optimization: Indexes for faster queries on Dashboards
// 1. Tourist Dashboard: "Show my bookings"
bookingSchema.index({ touristId: 1 });
// 2. Guide Dashboard: "Show who booked me"
bookingSchema.index({ guideId: 1 });
// 3. Tour Page: "Show bookings for this specific tour"
bookingSchema.index({ tourId: 1 });

export const Booking = model<IBooking>("Booking", bookingSchema);
