/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from "jsonwebtoken";
import { IUser, Role } from "./user.interface";
import { User } from "./user.model";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { envVars } from "@/app/config/env";
import bcryptjs from "bcryptjs";

const getAllUsers = async () => {
  const users = await User.find({});
  return {
    data: users,
  };
};
const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  /**
   * email cannot be updated
   * name, password, addresses, languages can be updated
   * only admin can block, delete make user admin
   */

  if (payload.role) {
    if (
      decodedToken.role === Role.TOURIST ||
      decodedToken.role === Role.GUIDE
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    if (payload.userStatus === payload.isDeleted || payload.isVerified) {
      if (
        decodedToken.role === Role.TOURIST ||
        decodedToken.role === Role.GUIDE
      ) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
      }
    }
  }

  if (payload.password) {
    payload.password = await bcryptjs.hash(
      payload.password,
      envVars.BCRYPT_SALT_ROUND
    );
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  return newUpdatedUser;
};

const deleteUser = async (userId: string, decodedToken: JwtPayload) => {
  // Only admin can delete users
  if (decodedToken.role !== Role.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Soft delete: Set isDeleted flag to true
  const deletedUser = await User.findByIdAndUpdate(
    userId,
    { isDeleted: true },
    { new: true, runValidators: true }
  );

  return deletedUser;
};

export const UserServices = {
  getAllUsers,
  updateUser,
  deleteUser,
};
