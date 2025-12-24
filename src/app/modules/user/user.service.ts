/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from "jsonwebtoken";
import { IUser, Role } from "./user.interface";
import { User } from "./user.model";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { deleteImageFromCLoudinary } from "@/app/config/cloudinary.config";
import { envVars } from "@/app/config/env";
import bcryptjs from "bcryptjs";

const getAllUsers = async () => {
  const users = await User.find({});
  const total = await User.countDocuments();
  return {
    data: users,
    meta: total,
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

  // Prevent email changes through this endpoint
  if (payload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email cannot be updated");
  }

  // Only admin or the user themself can update the user
  const requesterId = String((decodedToken as any).userId ?? "");
  const requesterRole = (decodedToken as any).role as Role | undefined;
  if (requesterRole !== Role.ADMIN && requesterId !== String(userId)) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this user"
    );
  }

  // Fields only admin can change
  const adminOnlyFields = ["role", "isDeleted", "isVerified", "userStatus"];
  for (const f of adminOnlyFields) {
    if (
      Object.prototype.hasOwnProperty.call(payload, f) &&
      requesterRole !== Role.ADMIN
    ) {
      throw new AppError(httpStatus.FORBIDDEN, `Only admin can update ${f}`);
    }
  }

  if (payload.password) {
    payload.password = await bcryptjs.hash(
      payload.password,
      Number(envVars.BCRYPT_SALT_ROUND)
    );
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  // If user updated their photo and there was a previous photo, delete the old one from Cloudinary
  if (payload.photo && isUserExist.photo) {
    try {
      await deleteImageFromCLoudinary(String(isUserExist.photo));
    } catch (err) {
      // Log and continue — do not stop the update if deletion fails
      // eslint-disable-next-line no-console
      console.warn(
        "Failed to delete previous user photo from Cloudinary:",
        err
      );
    }
  }

  return newUpdatedUser;
};
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};
// const promoteUser = async (userId: string, decodedToken: JwtPayload) => {
//   // only admin can promote
//   if ((decodedToken as any).role !== Role.ADMIN) {
//     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
//   }

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const updated = await User.findByIdAndUpdate(
//     userId,
//     { role: Role.ADMIN },
//     { new: true, runValidators: true }
//   );

//   return updated;
// };

// const blockUser = async (userId: string, decodedToken: JwtPayload) => {
//   if ((decodedToken as any).role !== Role.ADMIN) {
//     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
//   }

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const updated = await User.findByIdAndUpdate(
//     userId,
//     { userStatus: ("BLOCKED" as unknown) as any },
//     { new: true, runValidators: true }
//   );

//   return updated;
// };

// const unblockUser = async (userId: string, decodedToken: JwtPayload) => {
//   if ((decodedToken as any).role !== Role.ADMIN) {
//     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
//   }

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const updated = await User.findByIdAndUpdate(
//     userId,
//     { userStatus: ("ACTIVE" as unknown) as any },
//     { new: true, runValidators: true }
//   );

//   return updated;
// };

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
  getMe,
  // promoteUser,
  // blockUser,
  // unblockUser,
};
