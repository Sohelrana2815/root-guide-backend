/* eslint-disable @typescript-eslint/no-unused-vars */
import { sendResponse } from "@/app/utils/sendResponse";
import httpStatus from "http-status";
import { catchAsync } from "@/app/utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import { AuthServices } from "./auth.service";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("from controller", req.body);
    const user = await AuthServices.createUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Created Successfully",
      data: user,
    });
  }
);

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged In Successfully",
      data: loginInfo,
    });
  }
);

export const AuthControllers = {
  createUser,
  credentialsLogin,
};
