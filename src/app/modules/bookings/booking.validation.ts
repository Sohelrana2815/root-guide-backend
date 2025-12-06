import z from "zod";

export const createBookingZodSchema = z.object({
  tourId: z
    .string({ error: "Tour ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid tour ID format"),

  guestCount: z
    .number({ error: "Guest count is required" })
    .int("Guest count must be a whole number")
    .min(1, "Guest count must be at least 1"),

  bookingDate: z.date({ error: "Booking date is required" }).optional(),
});

export const updateBookingStatusZodSchema = z.object({
  status: z.enum(
    ["PENDING", "PAID", "CONFIRMED", "CANCELLED", "COMPLETED", "FAILED"],
    {
      error: "Invalid booking status",
    }
  ),
});
