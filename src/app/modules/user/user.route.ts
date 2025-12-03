import { Router } from "express";
import { UserControllers } from "./user.controller";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "./user.interface";

const router = Router();

router.get("/all-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);

export const UserRoutes = router;
