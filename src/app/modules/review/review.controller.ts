import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { Request, Response } from "express";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { AuthPayload } from "@/app/auth/interface";
import { ReviewServices } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await ReviewServices.createReview(req.body, authUser.userId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getTourReviews = catchAsync(async (req: Request, res: Response) => {
  const { tourId } = req.params;

  const result = await ReviewServices.getTourReviews(tourId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getGuideReviews = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;

  const result = await ReviewServices.getGuideReviews(guideId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guide reviews retrieved successfully",
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  getTourReviews,
  getGuideReviews,
};
