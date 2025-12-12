import { catchAsync } from "@/app/utils/catchAsync";
import { Request, Response } from "express";
import { PaymentServices } from "./payment.service";
import { sendResponse } from "@/app/utils/sendResponse";
import { envVars } from "@/app/config/env";

const initPayment = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const result = await PaymentServices.initPayment(bookingId as string);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment done successfully",
    data: result,
  });
});
const successPayment = catchAsync(async (req: Request, res: Response) => {
  const data = { ...(req.query as Record<string, string>), ...(req.body as Record<string, string>) };
  const result = await PaymentServices.successPayment(data);

  const tx = data.transactionId || data.tran_id || "";
  const amount = data.amount || "";

  if (result.success) {
    res.redirect(
      `${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${tx}&message=${encodeURIComponent(result.message)}&amount=${amount}&status=success`
    );
  }
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const data = { ...(req.query as Record<string, string>), ...(req.body as Record<string, string>) };
  const result = await PaymentServices.failPayment(data);

  const tx = data.transactionId || data.tran_id || "";
  const amount = data.amount || "";

  if (!result.success) {
    res.redirect(
      `${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${tx}&message=${encodeURIComponent(result.message)}&amount=${amount}&status=failed`
    );
  }
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const data = { ...(req.query as Record<string, string>), ...(req.body as Record<string, string>) };
  const result = await PaymentServices.cancelPayment(data);

  const tx = data.transactionId || data.tran_id || "";
  const amount = data.amount || "";

  if (!result.success) {
    res.redirect(
      `${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${tx}&message=${encodeURIComponent(result.message)}&amount=${amount}&status=cancelled`
    );
  }
});

export const PaymentController = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};
