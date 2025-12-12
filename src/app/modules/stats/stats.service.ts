/* eslint-disable @typescript-eslint/no-explicit-any */

import { Booking } from "../bookings/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Tour } from "../tour/tour.model";
import { UserStatus } from "../user/user.interface";
import { User } from "../user/user.model";

const now = new Date();
const sevenDaysAgo = new Date(now);
sevenDaysAgo.setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(now.getDate() - 30);

const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();

  const totalActiveUsersPromise = User.countDocuments({
    userStatus: UserStatus.ACTIVE,
  });
  const totalBlockedUsersPromise = User.countDocuments({
    userStatus: UserStatus.BLOCKED,
  });

  const newUsersInLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const newUsersInLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const usersByRolePromise = User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalUsers,
    totalActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalBlockedUsersPromise,
    newUsersInLast7DaysPromise,
    newUsersInLast30DaysPromise,
    usersByRolePromise,
  ]);

  return {
    totalUsers,
    totalActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  };
};

const getTourStats = async () => {
  const totalTourPromise = Tour.countDocuments();

  // We don't have tour types or divisions in the current Tour model.
  // Compute only totals and average price.
  const avgTourCostPromise = Tour.aggregate([
    {
      $group: {
        _id: null,
        avgPrice: { $avg: "$price" },
      },
    },
  ]);

  const totalHighestBookedTourPromise = Booking.aggregate([
    // stage-1 : Group the tour by tourId
    {
      $group: {
        _id: "$tourId",
        bookingCount: { $sum: 1 },
      },
    },

    //stage-2 : sort the tour

    {
      $sort: { bookingCount: -1 },
    },

    //stage-3 : sort
    {
      $limit: 5,
    },

    //stage-4 lookup stage
      {
        $lookup: {
          from: "tours",
          let: { tourId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$tourId"] },
              },
            },
          ],
          as: "tour",
        },
      },
    //stage-5 unwind stage
    { $unwind: "$tour" },

    //stage-6 Project stage

    {
      $project: {
        bookingCount: 1,
        "tour.title": 1,
        "tour.slug": 1,
      },
    },
  ]);

  const [totalTour, avgTourCost, totalHighestBookedTour] = await Promise.all([
    totalTourPromise,
    avgTourCostPromise,
    totalHighestBookedTourPromise,
  ]);

  return {
    totalTour,
    avgTourCost,
    totalHighestBookedTour,
  };
};

const getBookingStats = async () => {
  const totalBookingPromise = Booking.countDocuments();

  const totalBookingByStatusPromise = Booking.aggregate([
    //stage-1 group stage
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const bookingsPerTourPromise = Booking.aggregate([
    //stage1 group stage

    {
      $group: {
        _id: "$tourId",
        bookingCount: { $sum: 1 },
      },
    },

    //stage-2 sort stage
    {
      $sort: { bookingCount: -1 },
    },

    //stage-3 limit stage
    {
      $limit: 10,
    },

    //stage-4 lookup stage
    {
      $lookup: {
        from: "tours",
        let: { tourId: "$_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$_id", "$$tourId"] } },
          },
          { $project: { title: 1, slug: 1 } },
        ],
        as: "tour",
      },
    },

    // stage5 - unwind stage
    {
      $unwind: "$tour",
    },

    // stage6 project stage

    {
      $project: {
        bookingCount: 1,
        _id: 1,
        "tour.title": 1,
        "tour.slug": 1,
      },
    },
  ]);

  const avgGuestCountPerBookingPromise = Booking.aggregate([
    // stage 1  - group stage
    {
      $group: {
        _id: null,
        avgGuestCount: { $avg: "$guestCount" },
      },
    },
  ]);

  const bookingsLast7DaysPromise = Booking.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const bookingsLast30DaysPromise = Booking.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const totalBookingByUniqueUsersPromise = Booking.distinct("user").then(
    (user: any) => user.length
  );

  const [
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking,
    bookingsLast7Days,
    bookingsLast30Days,
    totalBookingByUniqueUsers,
  ] = await Promise.all([
    totalBookingPromise,
    totalBookingByStatusPromise,
    bookingsPerTourPromise,
    avgGuestCountPerBookingPromise,
    bookingsLast7DaysPromise,
    bookingsLast30DaysPromise,
    totalBookingByUniqueUsersPromise,
  ]);
  return {
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking: avgGuestCountPerBooking?.[0]?.avgGuestCount ?? 0,
    bookingsLast7Days,
    bookingsLast30Days,
    totalBookingByUniqueUsers,
  };
};

const getPaymentStats = async () => {
  const totalPaymentPromise = Payment.countDocuments();

  const totalPaymentByStatusPromise = Payment.aggregate([
    //stage 1 group
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRevenuePromise = Payment.aggregate([
    //stage1 match stage
    {
      $match: { status: PAYMENT_STATUS.PAID },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  const avgPaymentAmountPromise = Payment.aggregate([
    //stage 1 group stage
    {
      $group: {
        _id: null,
        avgPaymentAMount: { $avg: "$amount" },
      },
    },
  ]);

  const paymentGatewayDataPromise = Payment.aggregate([
    //stage 1 group stage
    {
      $group: {
        _id: { $ifNull: ["$paymentGatewayData.status", "UNKNOWN"] },
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  ] = await Promise.all([
    totalPaymentPromise,
    totalPaymentByStatusPromise,
    totalRevenuePromise,
    avgPaymentAmountPromise,
    paymentGatewayDataPromise,
  ]);
  return {
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  };
};

/**
 * await Tour.updateMany(
        {
            // Only update where tourType or division is stored as a string
            $or: [
                { tourType: { $type: "string" } },
                { division: { $type: "string" } }
            ]
        },
        [
            {
                $set: {
                    tourType: { $toObjectId: "$tourType" },
                    division: { $toObjectId: "$division" }
                }
            }
        ]
    );
 */

export const StatsService = {
  getBookingStats,
  getPaymentStats,
  getTourStats,
  getUserStats,
};
