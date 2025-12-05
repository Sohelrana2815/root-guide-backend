import { catchAsync } from "@/app/utils/catchAsync";
import { sendResponse } from "@/app/utils/sendResponse";
import { TourServices } from "./tour.service";
import { Request, Response } from "express";

const createTour = catchAsync(async (req: Request, res: Response) => {
  const result = await TourServices.createTour(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tour created successfully",
    data: result,
  });
});

export const TourControllers = {
  createTour,
};
