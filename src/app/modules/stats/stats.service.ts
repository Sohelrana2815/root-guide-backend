import { Booking } from "../bookings/booking.model";
import { BookingStatus } from "../bookings/booking.interface";
import { Tour } from "../tour/tour.model";
import { User } from "../user/user.model";
import { Role } from "../user/user.interface";
import { Types } from "mongoose";
import { Review } from "../review/review.model";

// হেল্পার ফাংশন: মাসের নাম বের করার জন্য
const getMonthName = (monthNum: number) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[monthNum - 1];
};

const getAdminDashboardSummary = async () => {
  // ১. আগের সাধারণ স্ট্যাটসগুলো (Revenue, Users, Tours)
  const [revenueStats, bookingSplit, userStats, tourStats] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          status: { $in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
        },
      },
      {
        $group: {
          _id: null,
          totalGrossVolume: { $sum: "$totalPrice" },
          totalAdminProfit: { $sum: "$commissionAmount" },
        },
      },
    ]),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Tour.aggregate([
      { $match: { isDelete: { $ne: true } } },
      { $group: { _id: "$isActive", count: { $sum: 1 } } },
    ]),
  ]);

  // ২. বার চার্টের জন্য গত ৬ মাসের বুকিং কাউন্ট
  const monthlyBookingStats = await Booking.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const barChartData = monthlyBookingStats.map((item) => ({
    month: `${getMonthName(item._id.month)} ${item._id.year}`,
    count: item.count,
  }));

  return {
    revenue: {
      adminProfit: revenueStats[0]?.totalAdminProfit || 0,
      totalTransaction: revenueStats[0]?.totalGrossVolume || 0,
    },
    bookings: {
      total: bookingSplit.reduce((acc, curr) => acc + curr.count, 0),
      split: bookingSplit,
    },
    users: {
      tourists: userStats.find((u) => u._id === Role.TOURIST)?.count || 0,
      guides: userStats.find((u) => u._id === Role.GUIDE)?.count || 0,
      admins: userStats.find((u) => u._id === Role.ADMIN)?.count || 0,
    },
    tours: {
      active: tourStats.find((t) => t._id === true)?.count || 0,
      inactive: tourStats.find((t) => t._id === false)?.count || 0,
    },
    barChartData, // নতুন যোগ করা হলো
  };
};

const getGuideDashboardSummary = async (guideId: string) => {
  const guideObjectId = new Types.ObjectId(guideId);

  // ১. সাধারণ বুকিং স্ট্যাটস
  const bookingStats = await Booking.aggregate([
    { $match: { guideId: guideObjectId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalEarnings: {
          $sum: {
            $cond: [
              {
                $in: ["$status", [BookingStatus.PAID, BookingStatus.COMPLETED]],
              },
              "$guideEarnings",
              0,
            ],
          },
        },
        activeBookings: {
          $sum: {
            $cond: [
              {
                $in: ["$status", [BookingStatus.PAID, BookingStatus.CONFIRMED]],
              },
              1,
              0,
            ],
          },
        },
        completedTours: {
          $sum: {
            $cond: [{ $eq: ["$status", BookingStatus.COMPLETED] }, 1, 0],
          },
        },
        pendingRequests: {
          $sum: { $cond: [{ $eq: ["$status", BookingStatus.PENDING] }, 1, 0] },
        },
      },
    },
  ]);

  // ২. গাইডের জন্য মান্থলি আর্নিং চার্ট (Bar Chart)
  const monthlyEarnings = await Booking.aggregate([
    {
      $match: {
        guideId: guideObjectId,
        status: { $in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        earnings: { $sum: "$guideEarnings" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const barChartData = monthlyEarnings.map((item) => ({
    month: getMonthName(item._id.month),
    count: item.earnings, // এখানে count আসলে ডলার/টাকা ভ্যালু
  }));

  // ৩. গাইডের জন্য বুকিং স্ট্যাটাস স্প্লিট (Pie Chart)
  const bookingStatusSplit = await Booking.aggregate([
    { $match: { guideId: guideObjectId, isDeleted: { $ne: true } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const ratingStats = await Review.aggregate([
    { $match: { guideId: guideObjectId } },
    {
      $group: {
        _id: "$guideId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return {
    earnings: bookingStats[0]?.totalEarnings || 0,
    activeBookings: bookingStats[0]?.activeBookings || 0,
    completedTours: bookingStats[0]?.completedTours || 0,
    pendingRequests: bookingStats[0]?.pendingRequests || 0,
    averageRating: ratingStats[0]?.averageRating?.toFixed(1) || "0.0",
    totalReviews: ratingStats[0]?.totalReviews || 0,
    barChartData,
    pieChartData: bookingStatusSplit,
  };
};
const getTouristDashboardSummary = async (touristId: string) => {
  const touristObjectId = new Types.ObjectId(touristId);

  const monthlySpending = await Booking.aggregate([
    {
      $match: {
        touristId: touristObjectId,
        status: { $in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: "$totalPrice" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const barChartData = monthlySpending.map((item) => ({
    month: getMonthName(item._id.month),
    count: item.total,
  }));

  // ৩. পর্যটকের জন্য বুকিং স্ট্যাটাস স্প্লিট (Pie Chart)
  const bookingStatusSplit = await Booking.aggregate([
    { $match: { touristId: touristObjectId, isDeleted: { $ne: true } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // ১. মোট খরচ এবং সফল ট্যুর সংখ্যা (Spendings & Trips Taken)
  const tripStats = await Booking.aggregate([
    {
      $match: {
        touristId: touristObjectId,
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        // মোট কত খরচ করেছেন (PAID এবং COMPLETED স্ট্যাটাসগুলো যোগ হবে)
        totalSpent: {
          $sum: {
            $cond: [
              {
                $in: ["$status", [BookingStatus.PAID, BookingStatus.COMPLETED]],
              },
              "$totalPrice",
              0,
            ],
          },
        },
        // এ পর্যন্ত কয়টি ট্যুর শেষ করেছেন
        tripsTaken: {
          $sum: {
            $cond: [{ $eq: ["$status", BookingStatus.COMPLETED] }, 1, 0],
          },
        },
        // আপকামিং ট্যুর (যা বুক করা হয়েছে কিন্তু এখনো শুরু হয়নি)
        upcomingTrips: {
          $sum: { $cond: [{ $eq: ["$status", BookingStatus.PAID] }, 1, 0] },
        },
      },
    },
  ]);

  // ২. পেন্ডিং রিভিউ (Pending Reviews)
  // লজিক: বুকিং স্ট্যাটাস COMPLETED কিন্তু রিভিউ কালেকশনে এই bookingId নেই
  const pendingReviewsCount = await Booking.aggregate([
    {
      $match: {
        touristId: touristObjectId,
        status: BookingStatus.COMPLETED,
      },
    },
    {
      // রিভিউ কালেকশনের সাথে কানেক্ট করা
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "bookingId",
        as: "reviewData",
      },
    },
    {
      // শুধুমাত্র সেই বুকিংগুলো নেওয়া যেগুলোর রিভিউ অ্যারে খালি (অর্থাৎ রিভিউ দেওয়া হয়নি)
      $match: {
        reviewData: { $size: 0 },
      },
    },
    {
      $count: "count",
    },
  ]);

  return {
    tripsTaken: tripStats[0]?.tripsTaken || 0,
    totalSpent: tripStats[0]?.totalSpent || 0,
    upcomingTrips: tripStats[0]?.upcomingTrips || 0,
    pendingReviews: pendingReviewsCount[0]?.count || 0,
    barChartData,
    pieChartData: bookingStatusSplit,
  };
};

const getGlobalMeta = async () => {
  const [touristsCount, guidesCount, uniqueCities] = await Promise.all([
    User.countDocuments({ role: Role.TOURIST, isDeleted: { $ne: true } }),
    User.countDocuments({ role: Role.GUIDE, isDeleted: { $ne: true } }),
    Tour.distinct("city", { isDeleted: { $ne: true }, isActive: true }),
  ]);

  return {
    totalTourists: touristsCount,
    totalGuides: guidesCount,
    totalDestinations: uniqueCities.length,
  };
};

export const StatsService = {
  getAdminDashboardSummary,
  getGuideDashboardSummary,
  getTouristDashboardSummary,
  getGlobalMeta,
};
