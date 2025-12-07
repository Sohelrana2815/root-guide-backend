import { ITour } from "./tour.interface";
import { Tour } from "./tour.model";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { Types } from "mongoose";

const createTour = async (payload: ITour) => {
  // Validate that guideId is provided
  if (!payload.guideId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Guide ID is required");
  }

  const tour = await Tour.create(payload);

  return tour;
};

const getAllTours = async () => {
  const tours = await Tour.find();
  return tours;
};

const getMyTours = async (guideId: Types.ObjectId) => {
  const tours = await Tour.find({ guideId });
  return tours;
};

const getSingleTour = async (tourId: string) => {
  const tour = await Tour.findById(tourId);
  return tour;
};

const updateTour = async (
  tourId: string,
  guideId: Types.ObjectId,
  payload: Partial<ITour>
) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update your own created tours"
    );
  }

  const updateData = { ...payload };

  delete updateData.guideId;

  const updatedTour = await Tour.findByIdAndUpdate(tourId, updateData, {
    new: true,
    runValidators: true,
  });
  return updatedTour;
};

const deActivateTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only deactivate your own tours"
    );
  }

  // If already deactivated, return the tour (idempotent)
  if (!tour.isActive) {
    return tour;
  }

  // Set explicitly to false (deactivate) and return updated document
  tour.isActive = false;
  const updatedTour = await tour.save();
  return updatedTour;
};

const reactivateTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only reactivate your own tours"
    );
  }

  // If already active, return the tour (idempotent)
  if (tour.isActive) {
    return tour;
  }

  // Set explicitly to true (reactivate) and return updated document
  tour.isActive = true;
  const updatedTour = await tour.save();
  return updatedTour;
};

const deleteTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only delete your own tours"
    );
  }

  await Tour.findByIdAndDelete(tourId);
  return null;
};

export const TourServices = {
  createTour,
  getAllTours,
  getMyTours,
  updateTour,
  deActivateTour,
  reactivateTour,
  deleteTour,
  getSingleTour,
};
