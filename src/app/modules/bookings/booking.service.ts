import httpStatus from "http-status";
import { Booking } from "./booking.model";
import AppError from "@/app/errorHelpers/AppError";
import { BookingStatus, IBooking } from "./booking.interface";
import { Tour } from "../tour/tour.model";
import { Payment } from "../payment/payment.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { User } from "../user/user.model";
import { Types } from "mongoose";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";

// ============================================
// HELPER FUNCTION: Generate Transaction ID
// ============================================
const getTransactionId = () => {
  return `TXN-${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// ============================================
// 1. CREATE BOOKING
// ============================================
const createBooking = async (
  payload: Partial<IBooking>,
  touristId: Types.ObjectId
) => {
  const transactionId = getTransactionId();
  const session = await Booking.startSession();

  try {
    let resultBooking: any = null;

    await session.withTransaction(async () => {
      // Validate tourist exists and has required information
      const tourist = await User.findById(touristId).session(session);

      if (!tourist) {
        throw new AppError(httpStatus.NOT_FOUND, "Tourist not found");
      }

      // Enforce phone number requirement (from profile)
      if (!tourist.phoneNumber) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Please add a phone number to your profile before creating a booking"
        );
      }

      if (!tourist.address) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Please add an address to your profile before creating a booking"
        );
      }

      // Validate tour exists
      const tour = await Tour.findById(payload.tourId).session(session);

      if (!tour) {
        throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
      }

      // Validate guest count
      if (!payload.guestCount || payload.guestCount < 1) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Guest count must be at least 1"
        );
      }

      if (payload.guestCount > (tour.maxGroupSize ?? Number.MAX_SAFE_INTEGER)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Guest count cannot exceed maximum group size of ${tour.maxGroupSize}`
        );
      }

      // Calculate total price
      const totalPrice = Number(tour.price) * Number(payload.guestCount);

      // Create booking document within session
      const bookingDoc = new Booking({
        touristId,
        tourId: payload.tourId,
        guideId: tour.guideId,
        guestCount: payload.guestCount,
        // bookingDate: payload.bookingDate,
        totalPrice,
        status: BookingStatus.PENDING,
      });

      const createdBooking = await bookingDoc.save({ session });

      // Create payment record within session
      const paymentDoc = new Payment({
        bookingId: createdBooking._id,
        status: PAYMENT_STATUS.UNPAID,
        transactionId,
        amount: totalPrice,
      });

      const createdPayment = await paymentDoc.save({ session });

      // Link payment to booking and persist
      createdBooking.paymentId = createdPayment._id;
      await createdBooking.save({ session });

      // Populate the booking to return
      resultBooking = await Booking.findById(createdBooking._id)
        .populate("touristId", "name email phoneNumber")
        .populate("tourId", "title price duration")
        .populate("guideId", "name email")
        .populate("paymentId")
        .session(session);

      const userAddress = tourist.address || "N/A";
      const userEmail = tourist.email || "N/A";
      const userPhoneNumber = tourist.phoneNumber || "N/A";
      const userName = tourist.name || "N/A";

      const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: totalPrice,
        transactionId: transactionId,
      };
      const sslPayment = await SSLService.sslPaymentInit(sslPayload);
      session.endSession();
      return {
        payment: sslPayment,
        booking: resultBooking,
      };
    });
  } catch (error: any) {
    // withTransaction will abort on thrown error; ensure session closed
    session.endSession();
    throw error;
  }
};

// ============================================
// 2. GET MY BOOKINGS (Tourist's bookings)
// ============================================
const getMyBookings = async (touristId: Types.ObjectId) => {
  const bookings = await Booking.find({ touristId })
    .populate("tourId", "title description price city images")
    .populate("guideId", "name bio photo")
    .populate("paymentId", "status amount transactionId")
    .sort({ createdAt: -1 });

  return bookings;
};

// ============================================
// 3. GET GUIDE BOOKINGS (Guide's tour bookings)
// ============================================
const getGuideBookings = async (guideId: Types.ObjectId) => {
  const bookings = await Booking.find({ guideId })
    .populate("touristId", "name email")
    .populate("tourId", "title price")
    .populate("paymentId", "status amount transactionId")
    .sort({ createdAt: -1 });

  return bookings;
};

// ============================================
// 4. GET BOOKING BY ID
// ============================================
const getBookingById = async (bookingId: string, userId: Types.ObjectId) => {
  const booking = await Booking.findById(bookingId)
    .populate("touristId", "name email address")
    .populate("tourId", "title description price duration city guideId")
    .populate("guideId", "name bio email")
    .populate("paymentId");

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // Verify user is either tourist or guide of this booking
  if (
    booking.touristId.toString() !== userId.toString() &&
    booking.guideId.toString() !== userId.toString()
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this booking"
    );
  }

  return booking;
};

// ============================================
// 5. UPDATE BOOKING STATUS (Guide accepts/rejects)
// ============================================
const updateBookingStatus = async (
  bookingId: string,
  guideId: Types.ObjectId,
  newStatus: BookingStatus
) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // Verify guide owns this booking
  if (booking.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update your own bookings"
    );
  }

  // Validate status transitions
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.PAID]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.COMPLETED]: [],
    [BookingStatus.CANCELLED]: [],
    [BookingStatus.FAILED]: [BookingStatus.PENDING],
  };

  if (!validTransitions[booking.status as BookingStatus]?.includes(newStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot transition from ${booking.status} to ${newStatus}`
    );
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: newStatus },
    { new: true }
  )
    .populate("touristId", "name email")
    .populate("tourId", "title")
    .populate("guideId", "name email")
    .populate("paymentId");

  return updatedBooking;
};

// ============================================
// 6. CANCEL BOOKING
// ============================================
const cancelBooking = async (bookingId: string, userId: Types.ObjectId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // Verify user is either tourist or guide
  if (
    booking.touristId.toString() !== userId.toString() &&
    booking.guideId.toString() !== userId.toString()
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to cancel this booking"
    );
  }

  // Cannot cancel completed or already cancelled bookings
  if (
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.CANCELLED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel a ${booking.status.toLowerCase()} booking`
    );
  }

  // Update booking status to cancelled
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: BookingStatus.CANCELLED },
    { new: true }
  );

  // Update payment status to cancelled
  if (booking.paymentId) {
    await Payment.findByIdAndUpdate(booking.paymentId, {
      status: PAYMENT_STATUS.CANCELLED,
    });
  }

  return updatedBooking;
};

// ============================================
// 7. GET ALL BOOKINGS (Admin only)
// ============================================
const getAllBookings = async (filters?: {
  status?: BookingStatus;
  tourId?: string;
  guideId?: string;
}) => {
  const query: Record<string, BookingStatus | string> = {};

  if (filters?.status) {
    query.status = filters.status;
  }
  if (filters?.tourId) {
    query.tourId = filters.tourId;
  }
  if (filters?.guideId) {
    query.guideId = filters.guideId;
  }

  const bookings = await Booking.find(query)
    .populate("touristId", "name email")
    .populate("tourId", "title price")
    .populate("guideId", "name email")
    .populate("paymentId", "status amount")
    .sort({ createdAt: -1 });

  return bookings;
};

export const BookingServices = {
  createBooking,
  getMyBookings,
  getGuideBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
};
