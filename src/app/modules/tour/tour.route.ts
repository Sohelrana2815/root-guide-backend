import express from "express";
import { TourControllers } from "./tour.controller";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { createTourZodSchema } from "./tour.validation";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "../user/user.interface";
const router = express.Router();

router.post(
  "/create-tour",
  validateRequest(createTourZodSchema),
  checkAuth(Role.GUIDE),
  TourControllers.createTour
);

export const TourRoutes = router;
