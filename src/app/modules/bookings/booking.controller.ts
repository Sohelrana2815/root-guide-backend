import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { BookingServices } from "./booking.service";
import { Request, Response } from "express";
import { AuthPayload } from "@/app/auth/interface";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { BookingStatus } from "./booking.interface";

// ============================================
// 1. CREATE BOOKING
// ============================================
const createBooking = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await BookingServices.createBooking(req.body, authUser.userId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created successfully",
    data: result,
  });
});

// ============================================
// 2. GET MY BOOKINGS (Tourist's bookings)
// ============================================
const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await BookingServices.getMyBookings(authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your bookings retrieved successfully",
    data: result,
  });
});

// ============================================
// 3. GET GUIDE BOOKINGS
// ============================================
const getGuideBookings = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await BookingServices.getGuideBookings(authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guide bookings retrieved successfully",
    data: result,
  });
});

// ============================================
// 4. GET BOOKING BY ID
// ============================================
const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;
  const { id } = req.params;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await BookingServices.getBookingById(id, authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: result,
  });
});

// ============================================
// 5. UPDATE BOOKING STATUS (Guide only)
// ============================================
const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;
  const { id } = req.params;
  const { status } = req.body;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await BookingServices.updateBookingStatus(
    id,
    authUser.userId,
    status as BookingStatus
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking status updated successfully",
    data: result,
  });
});

// ============================================
// 6. CANCEL BOOKING
// ============================================
const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;
  const { id } = req.params;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const result = await BookingServices.cancelBooking(id, authUser.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking cancelled successfully",
    data: result,
  });
});

// ============================================
// 7. GET ALL BOOKINGS (Admin only)
// ============================================
const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const { status, tourId, guideId } = req.query;

  const filters = {
    status: status as BookingStatus | undefined,
    tourId: tourId as string | undefined,
    guideId: guideId as string | undefined,
  };

  const result = await BookingServices.getAllBookings(filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All bookings retrieved successfully",
    data: result,
  });
});

export const BookingControllers = {
  createBooking,
  getMyBookings,
  getGuideBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
};
