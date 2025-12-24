import { deleteImageFromCLoudinary } from "@/app/config/cloudinary.config";
import { ITour } from "./tour.interface";
import { Tour } from "./tour.model";
import AppError from "@/app/errorHelpers/AppError";
import httpStatus from "http-status";
import { Types } from "mongoose";

interface TourListQuery {
  searchTerm?: string;
  category?: string;
  city?: string;
  page?: string | number;
  limit?: string | number;
}

const createTour = async (payload: ITour) => {
  // Validate that guideId is provided
  if (!payload.guideId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Guide ID is required");
  }

  const tour = await Tour.create(payload);

  return tour;
};

const getTours = async () => {
  const tours = await Tour.find({});
  const total = await Tour.countDocuments();
  return {
    data: tours,
    meta: {
      total,
    },
  };
};

const notDeletedFilter: Record<string, unknown> = {
  $or: [{ isDelete: false }, { isDelete: { $exists: false } }],
};

const buildTourListFilters = (
  query: TourListQuery,
  baseFilter: Record<string, unknown>
) => {
  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  const category =
    typeof query.category === "string" ? query.category : undefined;
  const city = typeof query.city === "string" ? query.city : undefined;

  const andConditions: Record<string, unknown>[] = [baseFilter];

  if (category) {
    andConditions.push({ category });
  }

  if (city) {
    andConditions.push({ city });
  }

  if (searchTerm) {
    const regex = { $regex: searchTerm, $options: "i" };
    andConditions.push({
      $or: [{ title: regex }, { itinerary: regex }, { city: regex }],
    });
  }

  return andConditions.length > 1 ? { $and: andConditions } : baseFilter;
};

const parsePagination = (query: TourListQuery) => {
  const pageRaw =
    typeof query.page === "string" ? Number(query.page) : query.page;
  const limitRaw =
    typeof query.limit === "string" ? Number(query.limit) : query.limit;

  const page = typeof pageRaw === "number" && pageRaw > 0 ? pageRaw : 1;
  const limit = typeof limitRaw === "number" && limitRaw > 0 ? limitRaw : 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getAllTours = async (query: TourListQuery = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildTourListFilters(query, notDeletedFilter);

  const tours = await Tour.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Tour.countDocuments(filter);

  return { data: tours, meta: { total, page, limit } };
};

const getMyTours = async (
  guideId: Types.ObjectId,
  query: TourListQuery = {}
) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildTourListFilters(query, { guideId, ...notDeletedFilter });

  const tours = await Tour.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Tour.countDocuments(filter);
  return { data: tours, meta: { total, page, limit } };
};

const getSingleTour = async (tourId: string) => {
  const tour = await Tour.findById(tourId);
  return tour;
};

const updateTour = async (
  tourId: string,
  guideId: Types.ObjectId,
  payload: Partial<ITour>
) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update your own created tours"
    );
  }

  const updateData = { ...payload };

  delete updateData.guideId;

  const updatedTour = await Tour.findByIdAndUpdate(tourId, updateData, {
    new: true,
    runValidators: true,
  });

  if (payload.image && tour.image) {
    await deleteImageFromCLoudinary(tour.image);
  }

  return updatedTour;
};

const deActivateTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only deactivate your own tours"
    );
  }

  // If already deactivated, return the tour (idempotent)
  if (!tour.isActive) {
    return tour;
  }

  // Set explicitly to false (deactivate) and return updated document
  tour.isActive = false;
  const updatedTour = await tour.save();
  return updatedTour;
};

const reactivateTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only reactivate your own tours"
    );
  }

  // If already active, return the tour (idempotent)
  if (tour.isActive) {
    return tour;
  }

  // Set explicitly to true (reactivate) and return updated document
  tour.isActive = true;
  const updatedTour = await tour.save();
  return updatedTour;
};

const softDeleteTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only soft delete your own tours"
    );
  }

  tour.isDelete = true;
  await tour.save();
  return null;
};

const deleteTour = async (tourId: string, guideId: Types.ObjectId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found");
  }

  if (tour.guideId.toString() !== guideId.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only delete your own tours"
    );
  }

  await Tour.findByIdAndDelete(tourId);
  return null;
};

export const TourServices = {
  createTour,
  getTours,
  getAllTours,
  getMyTours,
  getSingleTour,
  updateTour,
  deActivateTour,
  reactivateTour,
  softDeleteTour,
  deleteTour,
};
