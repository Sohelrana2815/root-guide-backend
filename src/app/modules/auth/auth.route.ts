import { NextFunction, Request, Response, Router } from "express";
import { validateRequest } from "@/app/middlewares/validateRequest";
import {
  createAdminZodSchema,
  createUserZodSchema,
} from "../user/user.validation";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "../user/user.interface";
import passport from "passport";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  AuthControllers.createUser,
  checkAuth(Role.GUIDE, Role.TOURIST),
);

router.post(
  "/create-admin",
  validateRequest(createAdminZodSchema),
  checkAuth(Role.ADMIN),
  AuthControllers.createAdmin
);

router.post("/login", AuthControllers.credentialsLogin);
router.post("/refresh-token", AuthControllers.getNewAccessToken);
router.post("/logout", AuthControllers.logout);
router.post(
  "/reset-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.resetPassword,
);

//  /booking -> /login -> succesful google login -> /booking frontend
// /login -> succesful google login -> / frontend
router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  },
);

// api/v1/auth/google/callback?state=/booking
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  AuthControllers.googleCallbackController,
);

export const AuthRoutes = router;
