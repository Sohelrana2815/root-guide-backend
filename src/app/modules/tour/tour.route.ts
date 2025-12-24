import express from "express";
import { TourControllers } from "./tour.controller";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { createTourZodSchema, updateTourZodSchema } from "./tour.validation";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { multerUpload } from "@/app/config/multer.config";
const router = express.Router();

router.post(
  "/create-tour",
  checkAuth(Role.GUIDE),
  multerUpload.single("file"),
  validateRequest(createTourZodSchema),

  TourControllers.createTour
);

// see all tours admin only
router.get("/all-tours", checkAuth(Role.ADMIN), TourControllers.getAllTours);
router.get("/", TourControllers.getTours);
// see my tours guide only
router.get("/my-tours", checkAuth(Role.GUIDE), TourControllers.getMyTours);

// update tour guide only
router.patch(
  "/:id",

  checkAuth(Role.GUIDE),
  multerUpload.single("file"),
  validateRequest(updateTourZodSchema),
  TourControllers.updateTour
);

// view single tour by id all types of users can view tour details
router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  TourControllers.getSingleTour
);

// deactivate tour and guide only
router.patch(
  "/:id/deactivate",
  checkAuth(Role.GUIDE || Role.ADMIN),
  TourControllers.deActivateTour
);

// reactivate tour and guide only
router.patch(
  "/:id/reactivate",
  checkAuth(Role.GUIDE || Role.ADMIN),
  TourControllers.reactivateTour
);

router.patch(
  "/softDelete/:id",
  checkAuth(Role.GUIDE || Role.ADMIN),
  TourControllers.softDeleteTour
);

router.delete(
  "/:id",
  checkAuth(Role.GUIDE || Role.ADMIN),
  TourControllers.deleteTour
);

export const TourRoutes = router;
