import { ITour } from "./tour.interface";
import { Tour } from "./tour.model";

const createTour = async (payload: ITour) => {
  const tour = await Tour.create(payload);

  return tour;
};

export const TourServices = {
  createTour,
};
