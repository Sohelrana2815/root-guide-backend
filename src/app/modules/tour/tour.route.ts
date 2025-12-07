import express from "express";
import { TourControllers } from "./tour.controller";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { createTourZodSchema, updateTourZodSchema } from "./tour.validation";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "../user/user.interface";
const router = express.Router();

router.post(
  "/create-tour",
  validateRequest(createTourZodSchema),
  checkAuth(Role.GUIDE),
  TourControllers.createTour
);

router.get("/", TourControllers.getAllTours);

router.get("/my-tours", checkAuth(Role.GUIDE), TourControllers.getMyTours);

router.patch(
  "/:id",
  validateRequest(updateTourZodSchema),
  checkAuth(Role.GUIDE),
  TourControllers.updateTour
);
router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  TourControllers.getSingleTour
);
router.patch("/:id", checkAuth(Role.GUIDE), TourControllers.deActivateTour);
router.patch(
  "/:id/reactivate",
  checkAuth(Role.GUIDE),
  TourControllers.reactivateTour
);
router.delete("/:id", checkAuth(Role.GUIDE), TourControllers.deleteTour);

export const TourRoutes = router;
