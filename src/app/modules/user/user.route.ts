import { Router } from "express";
import { UserControllers } from "./user.controller";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "./user.interface";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { updateUserZodSchema } from "./user.validation";

const router = Router();
// get all users
router.get("/all-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
// update users
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(Role)),
  UserControllers.updateUser
);

// soft delte user
router.delete('/:id', checkAuth(Role.ADMIN), UserControllers.deleteUser);

export const UserRoutes = router;
