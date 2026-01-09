import express from "express";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";

const router = express.Router();

// Admin Dashboard Summary API
router.get(
  "/admin-summary",
  checkAuth(Role.ADMIN),
  StatsController.getAdminSummary
);

// Guide Dashboard Summary API
router.get(
  "/guide-summary",
  checkAuth(Role.GUIDE),
  StatsController.getGuideSummary
);
export const StatsRoutes = router;

// Tourist Dashboard Summary API
router.get(
  "/tourist-summary",
  checkAuth(Role.TOURIST),
  StatsController.getTouristSummary
);
