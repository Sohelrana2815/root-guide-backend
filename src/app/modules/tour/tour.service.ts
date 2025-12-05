import { ITour } from "./tour.interface";
import { Tour } from "./tour.model";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";

const createTour = async (payload: ITour) => {
  // Validate that guideId is provided
  if (!payload.guideId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Guide ID is required");
  }
  
  const tour = await Tour.create(payload);

  return tour;
};

export const TourServices = {
  createTour,
};
