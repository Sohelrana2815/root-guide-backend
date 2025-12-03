import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";
import { envVars } from "../config/env";
import { IAuthProvider, IUser, Role } from "../modules/user/user.interface";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      email: envVars.ADMIN_EMAIL,
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    console.log("Trying to create Super Admin...");

    const hashedPassword = await bcryptjs.hash(
      envVars.ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVars.ADMIN_EMAIL,
    };

    const payload: IUser = {
      name: "Super admin",
      role: Role.ADMIN,
      email: envVars.ADMIN_EMAIL,
      password: hashedPassword,
      isVerified: true,
      auths: [authProvider],
    };

    const superadmin = await User.create(payload);
    console.log("Super Admin Created Successfuly! \n");
    console.log(superadmin);
  } catch (error) {
    console.log(error);
  }
};
