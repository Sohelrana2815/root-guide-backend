import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { TourServices } from "./tour.service";
import { Request, Response } from "express";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { AuthPayload } from "@/app/auth/interface";

const createTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const guideId = authUser.userId;
  const tourData = {
    ...req.body,
    guideId,
  };

  const result = await TourServices.createTour(tourData);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tour created successfully",
    data: result,
  });
});

export const TourControllers = {
  createTour,
};
