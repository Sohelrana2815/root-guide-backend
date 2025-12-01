import express, { Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status";
import { envVars } from "./app/config/env";
const app = express();
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  })
);
app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    message: "Welcome to Root Guide Backend",
  });
});

export default app;
