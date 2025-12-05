import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { UserStatus } from "../modules/user/user.interface";
import { verifyToken } from "../utils/jwt";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import { User } from "../modules/user/user.model";
import { AuthPayload } from "../auth/interface";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        throw new AppError(403, "No Token Recieved");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      // Extract only the email from the JWT payload
      const email = verifiedToken.email;

      const isUserExist = await User.findOne({ email });

      if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
      }
      if (
        isUserExist.userStatus === UserStatus.BLOCKED ||
        isUserExist.userStatus === UserStatus.PENDING_APPROVAL
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `User is ${isUserExist.userStatus}`
        );
      }
      if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(403, "You are not permitted to view this route!!!");
      }

      // FIX: Cast the verified token to our custom AuthPayload type with userId
      // The global index.d.ts ensures 'req.user' exists
      req.user = {
        userId: isUserExist._id,
        email: verifiedToken.email,
        role: verifiedToken.role,
        iat: verifiedToken.iat,
        exp: verifiedToken.exp,
      } as AuthPayload;
      next();
    } catch (error) {
      // JWT verification failed or other auth error
      next(error);
    }
  };
