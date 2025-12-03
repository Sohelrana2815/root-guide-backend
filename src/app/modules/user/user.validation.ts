import { z } from "zod";
import { Role } from "./user.interface";

export const createUserZodSchema = z.object({
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
      error: "Password must contain at least one special character (!@#$%^&*)",
    }),
});
