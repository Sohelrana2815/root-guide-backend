/* eslint-disable @typescript-eslint/no-unused-vars */
import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { UserServices } from "./user.service";

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Users Retrieved Successfully",
      data: result.data,
    });
  }
);

export const UserControllers = {
  getAllUsers,
};
