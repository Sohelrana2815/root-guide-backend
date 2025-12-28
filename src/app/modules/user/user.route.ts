import { Router } from "express";
import { UserControllers } from "./user.controller";
import { checkAuth } from "@/app/middlewares/checkAuth";
import { Role } from "./user.interface";
import { validateRequest } from "@/app/middlewares/validateRequest";
import { updateUserZodSchema } from "./user.validation";
import { multerUpload } from "@/app/config/multer.config";

const router = Router();
// get all users admin only
router.get("/all-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);

// view single user profile by id all types of users can view user profile

// router.get("/:id",checkAuth(...Object.values(Role)), UserControllers.getSingleUser);

// action change user status

// update users all types of users can update their profile
router.patch(
  "/:id",
  checkAuth(...Object.values(Role)),
  multerUpload.single("file"),
  validateRequest(updateUserZodSchema),
  UserControllers.updateUser
);

// soft delte user
// admin-only actions: promote/block/unblock
// Only ADMIN may change user roles
router.patch(
  "/:id/role",
  checkAuth(Role.ADMIN),
  UserControllers.updateUserRole
);
// router.patch('/:id/block', checkAuth(Role.ADMIN), UserControllers.blockUser);
// router.patch('/:id/unblock', checkAuth(Role.ADMIN), UserControllers.unblockUser);

// soft delte user
router.delete("/:id", checkAuth(Role.ADMIN), UserControllers.deleteUser);

export const UserRoutes = router;
