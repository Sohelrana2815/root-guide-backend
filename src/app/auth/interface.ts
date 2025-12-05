import { Types } from "mongoose";
import { Role } from "../modules/user/user.interface";

export interface AuthPayload {
  userId: Types.ObjectId;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}
