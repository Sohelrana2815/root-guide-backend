import { Router } from "express";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: "",
  },
  // {
  //     path: "/tour",
  //     route: TourRoutes
  // },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// router.use("/user", UserRoutes)
// router.use("/tour", TourRoutes)0
// router.use("/division", DivisionRoutes)
// router.use("/booking", BookingRoutes)
// router.use("/user", UserRoutes)
