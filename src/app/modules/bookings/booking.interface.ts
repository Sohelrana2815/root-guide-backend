import { Types } from "mongoose";
import { IReview } from "../review/review.interface";

export enum BookingStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IBooking {
  _id?: Types.ObjectId;
  touristId: Types.ObjectId;
  tourId: Types.ObjectId;
  guideId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  guestCount: number;
  bookingDate: Date;
  totalPrice: number;
  status: BookingStatus;
  review?: IReview;
  createdAt?: Date;
  updatedAt?: Date;
}
