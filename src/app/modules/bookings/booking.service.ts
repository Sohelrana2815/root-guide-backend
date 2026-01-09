/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { getTransactionId } from "@/app/utils/getTransactionId";
import { Role } from "../user/user.interface";

interface BookingQuery {
  page?: string | number;
  limit?: string | number;
  searchTerm?: string;
  status?: string;
  guideId?: string;
  days?: string; // last 7 or 30 days
  isActive?: string;
  isDeleted?: string;
}

const buildBookingFilters = async (query: BookingQuery) => {
  const { searchTerm, status, guideId, days, isActive, isDeleted } = query;

  const andConditions: any[] = [];
  // filter deleted booking vs non deleted
  if (isDeleted === "true") {
    andConditions.push({ isDeleted: true });
  } else {
    andConditions.push({ isDeleted: { $ne: true } });
  }

  // Filter active and deactive booking

  if (isActive === "true") {
    andConditions.push({ isActive: true });
  } else if (isActive === "false") {
    andConditions.push({ isActive: false });
  }

  // 1. Normal filter

  if (status) andConditions.push({ status });
  if (guideId) andConditions.push({ guideId: new Types.ObjectId(guideId) });

  // 2. date range filter
  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    andConditions.push({ createdAt: { $gte: startDate } });
  }

  // 3. Search term (TXN ID or Tourist Name)

  if (searchTerm) {
    // search/find bookingId using TXN ID form Payment model

    const payments = await Payment.find({
      transactionId: { $regex: searchTerm, $options: "i" },
    }).select("bookingId");
    const bookingIdsFromPayment = payments.map((p) => p.bookingId);

    // Find tourist id using the username from USER model
    const tourists = await User.find({
      name: { $regex: searchTerm, $options: "i" },
    }).select("_id");
    const touristIds = tourists.map((t) => t._id);

    andConditions.push({
      $or: [
        { _id: { $in: bookingIdsFromPayment } },
        { touristId: { $in: touristIds } },
      ],
    });
  }

  return andConditions.length > 0 ? { $and: andConditions } : {};
};

// 1. CREATE BOOKING
const createBooking = async (
  payload: Partial<IBooking>,
  touristId: Types.ObjectId
) => {
  const transactionId = getTransactionId();
  const session = await Booking.startSession();

  try {
    let resultBooking: any = null;
    let createdPaymentId: Types.ObjectId | null = null;
    let sslPaymentResponse: any = null;
    let sslPayload: ISSLCommerz | null = null;

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
          "Please add a phone number and address to your profile before booking a tour"
        );
      }
      if (!tourist.address) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Please add an address to your profile before booking a tour"
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

      // 15 % commission calculation
      const commissionAmount = totalPrice * 0.15;

      // Guide solid income 85 % of total price
      const guideEarnings = totalPrice - commissionAmount;

      // Create booking document within session
      const bookingDoc = new Booking({
        touristId,
        tourId: payload.tourId,
        guideId: tour.guideId,
        guestCount: payload.guestCount,
        // bookingDate: payload.bookingDate,
        totalPrice,
        commissionAmount,
        guideEarnings,
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
      createdPaymentId = createdPayment._id;

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

      // Prepare SSL payload to call AFTER transaction commits
      sslPayload = {
        address: tourist.address || "N/A",
        email: tourist.email || "N/A",
        phoneNumber: tourist.phoneNumber || "N/A",
        name: tourist.name || "N/A",
        amount: totalPrice,
        transactionId: transactionId,
      } as ISSLCommerz;
    });

    // Call external payment gateway after DB transaction commits
    try {
      if (sslPayload) {
        sslPaymentResponse = await SSLService.sslPaymentInit(sslPayload);
      }
    } catch (sslError: any) {
      // Mark payment as failed if gateway call fails
      if (createdPaymentId) {
        await Payment.findByIdAndUpdate(createdPaymentId, {
          status: PAYMENT_STATUS.FAILED,
        });
      }
      session.endSession();
      throw sslError;
    }

    session.endSession();
    return {
      paymentUrl: sslPaymentResponse.GatewayPageURL,
      booking: resultBooking,
    };
  } catch (error: any) {
    // withTransaction will abort on thrown error; ensure session closed
    session.endSession();
    throw error;
  }
};

//  get all bookings (admin)

const getAdminBookings = async (query: BookingQuery) => {
  // Pagination setup

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;

  // Build filter
  const filters = await buildBookingFilters(query);

  // Data fetch with population

  const bookings = await Booking.find(filters)
    .populate("touristId", "name email photo address")
    .populate("tourId", "title price city")
    .populate("guideId", "name email")
    .populate("paymentId", "transactionId status amount")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(filters);
  return {
    data: bookings,
    meta: { total, page, limit },
  };
};

// 2. GET MY BOOKINGS (Tourist's bookings)
const getMyBookings = async (touristId: Types.ObjectId) => {
  const bookings = await Booking.find({ touristId })
    .populate("tourId", "title description price city images")
    .populate(
      "guideId",
      "name bio photo languages averageRating isVerified expertise address phoneNumber email"
    )
    .populate("paymentId", "status amount transactionId paymentUrl")
    .sort({ createdAt: -1 });

  return bookings;
};

// 3. GET GUIDE BOOKINGS (Guide's tour bookings)
const getGuideBookings = async (
  guideId: Types.ObjectId,
  query: BookingQuery
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // guideId যেহেতু অলরেডি ObjectId, তাই ফিল্টার পাঠানোর সময় .toString() করে পাঠানো নিরাপদ
  const filter = await buildBookingFilters({
    ...query,
    guideId: guideId.toString(), // buildBookingFilters string এক্সপেক্ট করলে এটি কাজ করবে
  });

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("touristId", "name email phoneNumber address")
      .populate("tourId", "title price")
      .populate("paymentId", "status amount transactionId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    data: bookings,
    meta: { total, page, limit },
  };
};

// update booking status
const updateBookingStatus = async (
  bookingId: string,
  userId: Types.ObjectId,
  userRole: string,
  newStatus: BookingStatus
) => {
  if (newStatus === BookingStatus.PAID) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot manually set status to PAID. Payment must be verified via gateway."
    );
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  // Check user is not admin and valid guide for that booking
  if (userRole !== Role.ADMIN) {
    if (booking.guideId.toString() !== userId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only update your own bookings"
      );
    }
  }

  // Validate status transitions
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.PAID]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
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

// 6. CANCEL BOOKING
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

// 4. GET BOOKING BY ID

const getBookingById = async (
  bookingId: string,
  requesterId: Types.ObjectId,
  requesterRole?: Role
) => {
  const booking = await Booking.findById(bookingId)
    .populate("touristId", "name email phoneNumber")
    .populate("tourId", "title description price city image")
    .populate(
      "guideId",
      "name email bio photo languages averageRating isVerified expertise address"
    )
    .populate("paymentId")
    .populate("review")
    .exec();

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  // Admins can view any booking
  if (requesterRole === Role.ADMIN) {
    return booking;
  }
  // Otherwise ensure requester is either the tourist or the guide
  const requesterIdStr = requesterId.toString();
  const isTourist = booking.touristId._id?.toString() === requesterIdStr;
  const isGuide = booking.guideId._id?.toString() === requesterIdStr;

  if (!isTourist && !isGuide) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this booking"
    );
  }
  return booking;
};

// 8. CHECK IF BOOKING IS ELIGIBLE FOR REVIEW
const isBookingEligibleForReview = async (
  bookingId: string,
  userId: Types.ObjectId
): Promise<boolean> => {
  const booking = await Booking.findOne({
    _id: bookingId,
    touristId: userId,
    status: BookingStatus.COMPLETED,
  });

  return !!booking;
};

// Active deactivate booking

const toggleBookingActiveStatus = async (id: string) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // toggle true/false
  booking.isActive = !booking.isActive;
  booking.isDeleted = false;
  const result = await booking.save();
  return result;
};

// Soft delete booking

const softDeleteBooking = async (id: string) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  if (booking.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "Booking is already deleted");
  }

  booking.isDeleted = true;
  booking.isActive = false;
  const result = await booking.save();
  return result;
};

export const BookingServices = {
  createBooking,
  getMyBookings,
  getGuideBookings,
  getAdminBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingById,
  isBookingEligibleForReview,
  toggleBookingActiveStatus,
  softDeleteBooking,
};
