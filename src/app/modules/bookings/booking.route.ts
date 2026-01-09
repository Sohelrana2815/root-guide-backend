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

// 1. CREATE BOOKING (Tourist only)
router.post(
  "/",
  validateRequest(createBookingZodSchema),
  checkAuth(Role.TOURIST),
  BookingControllers.createBooking
);

// 7. GET ALL BOOKINGS (Admin only)
router.get(
  "/admin/all-bookings",
  checkAuth(Role.ADMIN),
  BookingControllers.getAdminBookings
);

// 2. GET MY BOOKINGS (Tourist's own bookings)
router.get(
  "/my-bookings",
  checkAuth(Role.TOURIST),
  BookingControllers.getMyBookings
);

// 3. GET GUIDE BOOKINGS
router.get(
  "/guide-bookings",
  checkAuth(Role.GUIDE, Role.ADMIN),
  BookingControllers.getGuideBookings
);

// Toggle Active/Deactive (Admin Only)

router.patch(
  "/admin/:id/toggle-active",
  checkAuth(Role.ADMIN),
  BookingControllers.toggleBookingActiveStatus
);

// Soft Delete (Admin Only)
router.patch(
  "/admin/:id/soft-delete",
  checkAuth(Role.ADMIN),
  BookingControllers.softDeleteBooking
);
// 4. GET BOOKING BY ID
router.get(
  "/:id",
  checkAuth(Role.TOURIST, Role.GUIDE, Role.ADMIN),
  BookingControllers.getBookingById
);

// 5. UPDATE BOOKING STATUS (Guide adm ADMIN only)
router.patch(
  "/:id/status",
  validateRequest(updateBookingStatusZodSchema),
  checkAuth(Role.GUIDE, Role.ADMIN),
  BookingControllers.updateBookingStatus
);

// 6. CANCEL BOOKING
router.delete(
  "/:id",
  checkAuth(Role.TOURIST, Role.GUIDE),
  BookingControllers.cancelBooking
);

export const BookingRoutes = router;
