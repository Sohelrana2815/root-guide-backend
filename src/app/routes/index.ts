import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { TourRoutes } from "../modules/tour/tour.route";
import { BookingRoutes } from "../modules/bookings/booking.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { StatsRoutes } from "../modules/stats/stats.route";
// import { PaymentRoutes } from "../modules/payment/payment.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/tours",
    route: TourRoutes,
  },
  {
    path: "/bookings",
    route: BookingRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/stats",
    route: StatsRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
