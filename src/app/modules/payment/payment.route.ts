import express from "express";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post("/init-payment/:bookingId", PaymentController.initPayment);
// Retrieve payment details (including paymentUrl) - for pay-later scenarios
router.get("/booking/:bookingId", PaymentController.getPaymentByBookingId);
// Payment gateways may POST or GET to callback URLs — support both methods
router.post("/success", PaymentController.successPayment);
router.get("/success", PaymentController.successPayment);
router.get("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);
router.get("/cancel", PaymentController.cancelPayment);
router.post("/validate-payment", PaymentController.validatePayment);
export const PaymentRoutes = router;
