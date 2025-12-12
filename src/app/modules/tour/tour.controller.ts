import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { TourServices } from "./tour.service";
import { Request, Response } from "express";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { AuthPayload } from "@/app/auth/interface";

const createTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;
  // throw new Error("fake error");
  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const guideId = authUser.userId;
  const tourData = {
    ...req.body,
    guideId,
    image: req.file?.path,
  };

  const result = await TourServices.createTour(tourData);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tour created successfully",
    data: result,
  });
});

const getAllTours = catchAsync(async (req: Request, res: Response) => {
  const result = await TourServices.getAllTours();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tours retrieved successfully",
    data: result,
  });
});

const getMyTours = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await TourServices.getMyTours(authUser.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your tours retrieved successfully",
    data: result,
  });
});

const getSingleTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }
  const { id } = req.params;

  const result = await TourServices.getSingleTour(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Single tour retrieved successfully",
    data: result,
  });
});

const updateTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const { id } = req.params;
  const updatePayload = {
    ...req.body,
    image: req.file?.path,
  };

  const result = await TourServices.updateTour(id, authUser.userId, updatePayload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour updated successfully",
    data: result,
  });
});

const deActivateTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const { id } = req.params;
  const result = await TourServices.deActivateTour(id, authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour deactivated successfully",
    data: result,
  });
});

const reactivateTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const { id } = req.params;
  const result = await TourServices.reactivateTour(id, authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour reactivated successfully",
    data: result,
  });
});

const deleteTour = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const { id } = req.params;
  await TourServices.deleteTour(id, authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour deleted successfully",
    data: null,
  });
});

export const TourControllers = {
  createTour,
  getAllTours,
  getMyTours,
  updateTour,
  deActivateTour,
  reactivateTour,
  deleteTour,
  getSingleTour,
};
