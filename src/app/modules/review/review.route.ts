import express from "express";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ReviewControllers } from "./review.controller";
import { createReviewZodSchema } from "./review.validation";

const router = express.Router();

// POST /api/reviews
// Tourist can review only after COMPLETED booking
router.post(
  "/",
  validateRequest(createReviewZodSchema),
  checkAuth(Role.TOURIST),
  ReviewControllers.createReview
);

// GET /api/reviews/tour/:tourId
router.get("/tour/:tourId", ReviewControllers.getTourReviews);

// GET /api/reviews/guide/:guideId
router.get("/guide/:guideId", ReviewControllers.getGuideReviews);

export const ReviewRoutes = router;
