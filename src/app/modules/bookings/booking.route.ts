import { checkAuth } from "@/app/middlewares/checkAuth";
import express from "express";
import { Role } from "../user/user.interface";
import { BookingControllers } from "./booking.controller";
import { validateRequest } from "@/app/middlewares/validateRequest";
import {
  createBookingZodSchema,
  updateBookingStatusZodSchema,
} from "./booking.validation";

const router = express.Router();

// ============================================
// 1. CREATE BOOKING (Tourist only)
// ============================================
// POST /api/bookings
// Auth: Any authenticated user (will use touristId from token)
router.post(
  "/",
  validateRequest(createBookingZodSchema),
  checkAuth(Role.TOURIST),
  BookingControllers.createBooking
);

// ============================================
// 2. GET MY BOOKINGS (Tourist's own bookings)
// ============================================
// GET /api/bookings/my-bookings
// Auth: Tourist role required
router.get(
  "/my-bookings",
  checkAuth(Role.TOURIST),
  BookingControllers.getMyBookings
);

// ============================================
// 3. GET GUIDE BOOKINGS
// ============================================
// GET /api/bookings/guide-bookings
// Auth: Guide role required
// Returns all bookings for the guide's tours
router.get(
  "/guide-bookings",
  checkAuth(Role.GUIDE || Role.ADMIN),
  BookingControllers.getGuideBookings
);

// ============================================
// 4. GET BOOKING BY ID
// ============================================
// GET /api/bookings/:id
// Auth: Any authenticated user (must be tourist or guide of the booking)

router.get(
  "/:id",
  checkAuth(Role.TOURIST, Role.GUIDE, Role.ADMIN),
  BookingControllers.getBookingById
);

// ============================================
// 5. UPDATE BOOKING STATUS (Guide only)
// ============================================
// PATCH /api/bookings/:id/status
// Auth: Guide role required
// Updates booking status (Accept/Reject)
router.patch(
  "/:id/status",
  validateRequest(updateBookingStatusZodSchema),
  checkAuth(Role.GUIDE),
  BookingControllers.updateBookingStatus
);

// ============================================
// 6. CANCEL BOOKING
// ============================================
// DELETE /api/bookings/:id
// Auth: Tourist or Guide
router.delete(
  "/:id",
  checkAuth(Role.TOURIST, Role.GUIDE),
  BookingControllers.cancelBooking
);

// ============================================
// 7. GET ALL BOOKINGS (Admin only)
// ============================================
// GET /api/bookings/admin/all
// Auth: Admin role required
// Query filters: ?status=PENDING&tourId=xxx&guideId=yyy
router.get(
  "/admin/all",
  checkAuth(Role.ADMIN),
  BookingControllers.getAllBookings
);

export const BookingRoutes = router;
