import { Router } from "express";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { createUserZodSchema } from "../user/user.validation";
import { AuthControllers } from "./auth.controller";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  AuthControllers.createUser
);

router.post('/login',AuthControllers.credentialsLogin)

export const AuthRoutes = router;
