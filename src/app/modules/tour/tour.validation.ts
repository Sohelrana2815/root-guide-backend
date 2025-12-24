import z from "zod";

export const createTourZodSchema = z.object({
  // 1. Basic Details
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters long")
    .max(100, "Title cannot exceed 100 characters"),

  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters long"),

  itinerary: z
    .string({ error: "Itinerary is required" })
    .trim()
    .min(10, "Itinerary details must be provided"),

  // 2. Search & Filter Fields
  category: z.string({ error: "Category is required" }).trim(),

  city: z.string({ error: "City is required" }).trim(),

  // 3. Logistics & Pricing
  price: z
    .number({ error: "Price is required" })
    .min(0, "Price cannot be negative"),

  duration: z
    .number({ error: "Duration is required" })
    .min(0.5, "Duration must be at least 30 minutes (0.5 hours)"),

  meetingPoint: z.string({ error: "Meeting point is required" }).trim(),

  maxGroupSize: z
    .number({ error: "Max group size is required" })
    .int("Group size must be an integer")
    .min(1, "At least 1 guest is required"),

  // 4. Images
  image: z.url({ error: "At least one image is required" }).optional(),

  // 5. Optional Fields
  // Guide ID is typically handled by the auth middleware (req.user),
  // but if you send it in body, validate it as string here.
  // guideId: z.string().optional(),

  isActive: z.boolean().optional().default(true),
  isDeleted: z.boolean().optional().default(false),
});

export const updateTourZodSchema = createTourZodSchema.partial();
