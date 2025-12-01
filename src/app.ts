import express, { Request, Response } from "express";
import httpStatus from "http-status";
const app = express();

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    message: "Welcome to Root Guide Backend",
  });
});

export default app;
