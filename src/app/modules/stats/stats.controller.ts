/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";
import httpStatus from "http-status";

const getAdminSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsService.getAdminDashboardSummary();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin dashboard summary fetched successfully",
    data: result,
  });
});

const getGuideSummary = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as any;

  const result = await StatsService.getGuideDashboardSummary(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guide dashboard summary fetched successfully",
    data: result,
  });
});

const getTouristSummary = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as any;

  const result = await StatsService.getTouristDashboardSummary(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tourist dashboard summary fetched successfully",
    data: result,
  });
});

const getGlobalMeta = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsService.getGlobalMeta();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Global metadata fetched successfully",
    data: result,
  });
});

export const StatsController = {
  getAdminSummary,
  getGuideSummary,
  getTouristSummary,
  getGlobalMeta,
};
