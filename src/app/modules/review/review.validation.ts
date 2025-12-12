import z from "zod";

export const createReviewZodSchema = z.object({
  bookingId: z
    .string({ error: "Booking ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),

  rating: z
    .coerce
    .number({ error: "Rating is required" })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),

  comment: z
    .string({ error: "Comment is required" })
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
});
