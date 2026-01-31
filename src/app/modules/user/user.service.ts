/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from "jsonwebtoken";
import { IUser, Role, UserStatus } from "./user.interface";
import { User } from "./user.model";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { deleteImageFromCLoudinary } from "@/app/config/cloudinary.config";
import { envVars } from "@/app/config/env";
import bcryptjs from "bcryptjs";

interface UserListQuery {
  searchTerm?: string;
  role?: string;
  userStatus?: string;
  email?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
}
const buildUserFilters = (query: UserListQuery) => {
  const { searchTerm, role, userStatus, email } = query;
  const andConditions: Record<string, unknown>[] = [
    { isDeleted: { $ne: true } },
  ];

  if (searchTerm) {
    andConditions.push({ name: { $regex: searchTerm, $options: "i" } });
  }

  if (role) andConditions.push({ role });
  if (userStatus) andConditions.push({ userStatus });
  if (email) andConditions.push({ email });

  return andConditions.length > 0 ? { $and: andConditions } : {};
};

const getAllUsers = async (query: UserListQuery = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = buildUserFilters(query);

  const sortBy = (query.sortBy as string) || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ [sortBy]: sortOrder as 1 | -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    data: users,
    meta: { total, page, limit },
  };
};

const getHighRatedGuides = async () => {
  const result = await User.find({
    role: Role.GUIDE,
    isDelete: { $ne: true },
    userStatus: UserStatus.ACTIVE,
    averageRating: { $gte: 4 },
  })
    .sort({ averageRating: -1 })
    .limit(6)
    .select("name photo bio expertise averageRating languages");
  return result;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getGuideById = async (guideId: string) => {
  const guide = await User.findById(guideId).select("-password");
  const role = guide?.role;
  if (role !== Role.GUIDE) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not a guide");
  }
  return {
    data: guide,
  };
};

const getAllGuidesForFilter = async () => {
  const result = await User.find({
    role: Role.GUIDE,
    isDeleted: { $ne: true },
  }).select("_id name");
  return result;
};

const updateMyProfile = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
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
      "You are not authorized to update this user",
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
      Number(envVars.BCRYPT_SALT_ROUND),
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
        err,
      );
    }
  }

  return newUpdatedUser;
};

const updateUserRole = async (
  userId: string,
  targetRole: Role | string,
  decodedToken: JwtPayload,
) => {
  // only admin can change role

  if ((decodedToken as any).role !== Role.ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to perform this action",
    );
  }
  const normalizedRole = String(targetRole).toUpperCase();
  if (!Object.values(Role).includes(normalizedRole as Role)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid role. Allowed roles: ${Object.values(Role).join(", ")}`,
    );
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  // If already the same role, return the user unchanged
  if (user.role === (normalizedRole as Role)) {
    return user;
  }
  const updated = await User.findByIdAndUpdate(
    userId,
    { role: normalizedRole as Role },
    { new: true, runValidators: true },
  );
  return updated;
};

const blockUser = async (userId: string, decodedToken: JwtPayload) => {
  if (decodedToken.role !== Role.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "Only admins can block users");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return await User.findByIdAndUpdate(
    userId,
    { userStatus: UserStatus.BLOCKED },
    { new: true, runValidators: true },
  );
};

const unblockUser = async (userId: string, decodedToken: JwtPayload) => {
  if (decodedToken.role !== Role.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "Only admins can unblock users");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return await User.findByIdAndUpdate(
    userId,
    { userStatus: UserStatus.ACTIVE },
    { new: true, runValidators: true },
  );
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
    { new: true, runValidators: true },
  );

  return deletedUser;
};

export const UserServices = {
  getAllUsers,
  getHighRatedGuides,
  updateMyProfile,
  getAllGuidesForFilter,
  deleteUser,
  getMe,
  updateUserRole,
  blockUser,
  unblockUser,
  getGuideById,
};
