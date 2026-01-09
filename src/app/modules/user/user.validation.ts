import { z } from "zod";
import { Role, UserStatus } from "./user.interface";

export const createUserZodSchema = z
  .object({
    name: z
      .string({
        error: "Name is required",
      })
      .trim()
      .min(3, "Name must be at least 3 characters long")
      .max(50, "Name must be at most 50 characters long"),

    email: z.email({ error: "Email is required" }),

    // Role (Mandatory for creation)
    role: z.enum(Role, {
      error: "Role (GUIDE, or TOURIST) is required",
    }),

    password: z
      .string()
      .min(6, { error: "Password must be at least 6 characters" })
      // Must have at least 1 uppercase letter
      .regex(/^(?=.*[A-Z]).+$/, {
        error: "Password must contain at least 1 uppercase letter",
      })
      // Must have at least 1 digit
      .regex(/^(?=.*\d).+$/, {
        error: "Password must contain at least one digit",
      })
      // Must have at least 1 special character (!@#$%^&*)
      .regex(/^(?=.*[!@#$%^&*]).+$/, {
        error:
          "Password must contain at least one special character (!@#$%^&*)",
      }),
    languages: z
      .array(z.string({ error: "Languages must be array of strings" }))
      .min(1, { error: "Languages must be at least 1 item long" }),
    expertise: z
      .array(z.string({ error: "Expertise must be array of strings" }))
      .optional(),
  })
  .refine(
    (data) =>
      data.role !== "GUIDE" ||
      (Array.isArray(data.expertise) && data.expertise.length > 0),
    {
      message: "At least one expertise is required for guides.",
      path: ["expertise"],
    }
  );

export const updateUserZodSchema = z.object({
  name: z
    .string({ error: "Name must be string" })
    .min(3, { error: "Name must be at least 3 characters long." })
    .max(50, { error: "Name cannot exceed 50 characters." })
    .optional(),
  password: z
    .string()
    .min(6, { error: "Password must be at least 6 characters" })
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\s\S]{6,}$/,
      "Password must contain at least 1 uppercase letter, 1 digit, and 1 special character (!@#$%^&*)"
    )
    .optional(),
  // Must have at least 1 uppercase letter

  userStatus: z.enum(Object.values(UserStatus) as [string]).optional(),

  role: z
    // .enum(["ADMIN", "GUIDE", "USER", "SUPER_ADMIN"])
    .enum(Object.values(Role) as [string])
    .optional(),
  isDeleted: z.boolean({ error: "isDeleted must be true or false" }).optional(),
  isVerified: z
    .boolean({ error: "isVerified must be true or false" })
    .optional(),
  address: z
    .string({ error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
  photo: z.url({ error: "Photo must be url" }).optional(),
  bio: z
    .string({ error: "Bio must be string" })
    .min(5, { error: "Bio must be at least 5 characters long." })
    .max(200, { message: "Bio cannot exceed 200 characters." })
    .optional(),
  languages: z
    .array(z.string({ error: "Languages must be array of strings" }))
    .min(1, {
      error: "Languages must be at least 1 item long",
    })
    .optional(),
  expertise: z
    .array(z.string({ error: "Expertise must be array of strings" }))
    .min(1, {
      error: "Expertise must be at least 1 item long",
    })
    .optional(),
  dailyRate: z.coerce
    .number({ error: "DailyRate must be number" })
    .min(1, { error: "DailyRate must be at least 1" })
    .optional(),

  preferences: z
    .array(z.string({ error: "Preferences must be array of strings" }))
    .min(1, {
      error: "Preferences must be at least 1 item long",
    })
    .optional(),
  phoneNumber: z
    .string({ error: "Phone number must be a string" })
    .min(7, { error: "Phone number must be at least 7 characters long" })
    .max(20, { error: "Phone number cannot exceed 20 characters" })
    .regex(/^\+?[0-9\s-]{7,20}$/, {
      message:
        "Phone number must contain only digits, spaces, hyphens and an optional leading +",
    })
    .optional(),
});
