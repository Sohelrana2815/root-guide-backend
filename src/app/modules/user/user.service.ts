import { User } from "./user.model";

const getAllUsers = async () => {
  const users = await User.find({});
  return {
    data: users,
  };
};

export const UserServices = {
  getAllUsers,
};
