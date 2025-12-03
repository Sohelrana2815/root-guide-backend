import AppError from "@/app/errorHelpers/AppError";
import { IAuthProvider, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import httpStatus from "http-status";
import bcryptjs from "bcryptjs";
import { envVars } from "@/app/config/env";
// import jwt from "jsonwebtoken";
import { generateToken } from "@/app/utils/jwt";
const createUser = async (payload: Partial<IUser>) => {
  const { name, email, password, role, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    auths: [authProvider],
    ...rest,
  });

  return user;
};

const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
  }
  const isPasswordMatch = await bcryptjs.compare(
    password as string,
    isUserExist.password as string
  );

  if (!isPasswordMatch) {
    throw new AppError(httpStatus.BAD_REQUEST, "Incorrect password");
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return {
    accessToken,
  };
};

export const AuthServices = {
  createUser,
  credentialsLogin,
};
