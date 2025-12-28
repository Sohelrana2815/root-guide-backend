/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { UserServices } from "./user.service";
import { JwtPayload } from "jsonwebtoken";
import AppError from "@/app/errorHelpers/AppError";
import { Role } from "./user.interface";

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Users Retrieved Successfully",
      data: result.data,
      meta: { total: result.meta },
    });
  }
);
const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const verifiedToken = req.user as JwtPayload;
    const payload = {
      ...req.body,
      photo: (req as any).file?.path,
    };

    const user = await UserServices.updateUser(userId, payload, verifiedToken);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User updated Successfully",
      data: user,
    });
  }
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "MY profile Retrieved Successfully",
      data: result.data,
    });
  }
);

export const updateUserRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const bodyRole = req.body?.role as string | undefined;

    if (!bodyRole) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "role is required in request body"
      );
    }

    // sanitized upper-case
    const desiredRole = bodyRole.toUpperCase();

    // (Optional) provide clearer error before calling service
    if (!Object.values(Role).includes(desiredRole as Role)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid role. Allowed roles: ${Object.values(Role).join(", ")}`
      );
    }

    const verifiedToken = req.user as JwtPayload;
    if (!verifiedToken) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Missing authentication token"
      );
    }

    const result = await UserServices.updateUserRole(
      userId,
      desiredRole as Role,
      verifiedToken
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `User role updated to ${desiredRole} successfully`,
      data: result,
    });
  }
);

// const blockUser = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = req.params.id;
//     const verifiedToken = req.user as JwtPayload;
//     const result = await UserServices.blockUser(userId, verifiedToken);

//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "User blocked successfully",
//       data: result,
//     });
//   }
// );

// const unblockUser = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = req.params.id;
//     const verifiedToken = req.user as JwtPayload;
//     const result = await UserServices.unblockUser(userId, verifiedToken);

//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "User unblocked successfully",
//       data: result,
//     });
//   }
// );

const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const verifiedToken = req.user as JwtPayload;
    const result = await UserServices.deleteUser(userId, verifiedToken);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User soft deleted successfully",
      data: result,
    });
  }
);

export const UserControllers = {
  getAllUsers,
  updateUser,
  deleteUser,
  getMe,
  updateUserRole,
  // blockUser,
  // unblockUser,
};
