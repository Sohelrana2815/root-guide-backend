import { Router } from "express";
import { UserControllers } from "./user.controller";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "./user.interface";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { updateUserZodSchema } from "./user.validation";

const router = Router();

router.get("/all-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
router.patch("/:id",validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserControllers.updateUser);

export const UserRoutes = router;
