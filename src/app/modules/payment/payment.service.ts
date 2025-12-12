/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "@/app/errorHelpers/AppError";
import { Payment } from "./payment.model";

import httpStatus from "http-status";
import { Booking } from "../bookings/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { BookingStatus } from "../bookings/booking.interface";


const initPayment = async (bookingId: string) => {
  // Find payment by bookingId
  const payment = await Payment.findOne({ bookingId });

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment Not Found. You have not booked this tour"
    );
  }

  // Load booking and tourist details
  const booking = await Booking.findById(bookingId).populate("touristId");
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const tourist: any = (booking as any).touristId;

  // If already paid, don't init again
  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new AppError(httpStatus.BAD_REQUEST, "This booking is already paid");
  }

  // Generate a fresh transaction id for re-payments
  const transactionId = `TXN-${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Update payment record with new transaction id and mark UNPAID
  payment.transactionId = transactionId;
  payment.status = PAYMENT_STATUS.UNPAID;
  await payment.save();

  const sslPayload: ISSLCommerz = {
    address: tourist?.address || "N/A",
    email: tourist?.email || "N/A",
    phoneNumber: tourist?.phoneNumber || "N/A",
    name: tourist?.name || "N/A",
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    paymentUrl: sslPayment?.GatewayPageURL,
    raw: sslPayment,
  };
};
const successPayment = async (query: Record<string, string>) => {
  // Update Booking Status to COnfirm
  // Update Payment Status to PAID

  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const tx = (query.transactionId || query.tran_id || query.tranId || query.tranID) as string;
    if (!tx) {
      throw new AppError(httpStatus.BAD_REQUEST, "No transaction identifier provided");
    }

    const payment = await Payment.findOne({ transactionId: tx }).session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, `Payment record not found for transaction ${tx}`);
    }

    payment.status = PAYMENT_STATUS.PAID;
    payment.paymentGatewayData = { ...(payment.paymentGatewayData || {}), receivedQuery: query };
    await payment.save({ session });

    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: BookingStatus.PAID },
      { runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Payment Completed Successfully" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const failPayment = async (query: Record<string, string>) => {
  // Update Booking Status to FAIL
  // Update Payment Status to FAIL

  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const tx = (query.transactionId || query.tran_id || query.tranId || query.tranID) as string;
    if (!tx) {
      throw new AppError(httpStatus.BAD_REQUEST, "No transaction identifier provided");
    }

    const payment = await Payment.findOne({ transactionId: tx }).session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, `Payment record not found for transaction ${tx}`);
    }

    payment.status = PAYMENT_STATUS.FAILED;
    payment.paymentGatewayData = { ...(payment.paymentGatewayData || {}), receivedQuery: query };
    await payment.save({ session });

    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: BookingStatus.FAILED },
      { runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return { success: false, message: "Payment Failed" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const cancelPayment = async (query: Record<string, string>) => {
  // Update Booking Status to CANCEL
  // Update Payment Status to CANCEL

  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const tx = (query.transactionId || query.tran_id || query.tranId || query.tranID) as string;
    if (!tx) {
      throw new AppError(httpStatus.BAD_REQUEST, "No transaction identifier provided");
    }

    const payment = await Payment.findOne({ transactionId: tx }).session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, `Payment record not found for transaction ${tx}`);
    }

    payment.status = PAYMENT_STATUS.CANCELLED;
    payment.paymentGatewayData = { ...(payment.paymentGatewayData || {}), receivedQuery: query };
    await payment.save({ session });

    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: BookingStatus.CANCELLED },
      { runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return { success: false, message: "Payment Cancelled" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const PaymentServices = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};
