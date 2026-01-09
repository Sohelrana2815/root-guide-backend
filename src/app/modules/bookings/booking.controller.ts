import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { BookingServices } from "./booking.service";
import { Request, Response } from "express";
import { AuthPayload } from "@/app/auth/interface";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { BookingStatus } from "./booking.interface";

// 1. CREATE BOOKING
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

// 2. GET MY BOOKINGS (Tourist's bookings)
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

// Get all admin bookings

const getAdminBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.getAdminBookings(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All Bookings retrieved successfully for admin",
    data: result.data,
    meta: result.meta,
  });
});

// 3. GET GUIDE BOOKINGS
const getGuideBookings = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  // সরাসরি authUser.userId পাস করুন, নতুন করে ObjectId তৈরি করার দরকার নেই
  const result = await BookingServices.getGuideBookings(
    authUser.userId,
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guide bookings retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// 4. GET BOOKING BY ID

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;
  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  const { id } = req.params;

  const result = await BookingServices.getBookingById(
    id,
    authUser.userId,
    authUser.role
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: result,
  });
});

// 5. UPDATE BOOKING STATUS (Guide only)
const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as AuthPayload;
  const { id } = req.params;
  const { status } = req.body;

  if (!authUser?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found in request");
  }

  // Send userId and userRole

  const result = await BookingServices.updateBookingStatus(
    id,
    authUser.userId,
    authUser.role,
    status as BookingStatus
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking status updated successfully",
    data: result,
  });
});

const toggleBookingActiveStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BookingServices.toggleBookingActiveStatus(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Booking is now ${
        result.isActive ? "Activated" : "Deactivated"
      }`,
      data: result,
    });
  }
);
// soft delete booking
const softDeleteBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingServices.softDeleteBooking(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking soft deleted successfully",
    data: result,
  });
});
// 6. CANCEL BOOKING
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

export const BookingControllers = {
  createBooking,
  getMyBookings,
  getGuideBookings,
  getAdminBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingById,
  toggleBookingActiveStatus,
  softDeleteBooking,
};
