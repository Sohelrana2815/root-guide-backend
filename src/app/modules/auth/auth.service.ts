import AppError from "@/app/errorHelpers/AppError";
import { IAuthProvider, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import httpStatus from "http-status";
import bcryptjs from "bcryptjs";
import { envVars } from "@/app/config/env";
import {
  createNewAccessTokenWithRefreshToken,
  createUserTokens,
} from "@/app/utils/userTokens";
import { JwtPayload } from "jsonwebtoken";

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

  const userTokens = createUserTokens(isUserExist);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: pass, ...rest } = isUserExist.toObject();

  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: rest,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );

  return {
    accessToken: newAccessToken,
  };
};
const resetPassword = async (oldPassword:string, newPassword: string,decodedToken:JwtPayload) => {

const user = await User.findById(decodedToken.userId) as JwtPayload;

const isOldPasswordMatch = await bcryptjs.compare(oldPassword,user?.password as string);
if(!isOldPasswordMatch){
  throw new AppError(httpStatus.UNAUTHORIZED,"Old password does not match")
}

user.password  = await bcryptjs.hash(newPassword,envVars.BCRYPT_SALT_ROUND);
await user?.save();
};

export const AuthServices = {
  createUser,
  credentialsLogin,
  getNewAccessToken,
  resetPassword,
};
