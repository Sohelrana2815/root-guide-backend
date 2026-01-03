import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "@/app/errorHelpers/AppError";
import { BookingStatus } from "../bookings/booking.interface";
import { Booking } from "../bookings/booking.model";
import { Review } from "./review.model";

interface TCreateReviewPayload {
  bookingId: string;
  rating: number;
  comment: string;
}

const createReview = async (
  payload: TCreateReviewPayload,
  touristId: Types.ObjectId
) => {
  const booking = await Booking.findOne({
    _id: payload.bookingId,
    touristId,
    status: BookingStatus.COMPLETED,
  });

  if (!booking) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can only review after completing the tour"
    );
  }

  const existingReview = await Review.findOne({ bookingId: booking._id });

  if (existingReview) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already reviewed this booking"
    );
  }

  const createdReview = await Review.create({
    touristId,
    bookingId: booking._id,
    tourId: booking.tourId,
    guideId: booking.guideId,
    rating: payload.rating,
    comment: payload.comment,
  });

  const result = await Review.findById(createdReview._id)
    .populate("touristId", "name email photo")
    .populate("tourId", "title")
    .populate("guideId", "name email photo");

  return result;
};

const getTourReviews = async (tourId: string) => {
  const total = await Review.countDocuments({ tourId });

  const result = await Review.find({ tourId })
    .populate("touristId", "name photo")
    .sort({ createdAt: -1 });

  return {
    data: result,
    meta: {
      total,
    },
  };
};

const getGuideReviews = async (guideId: string) => {
  const result = await Review.find({ guideId })
    .populate("touristId", "name photo")
    .populate("tourId", "title")
    .sort({ createdAt: -1 });

  return result;
};

export const ReviewServices = {
  createReview,
  getTourReviews,
  getGuideReviews,
};
