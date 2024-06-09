import express, { NextFunction, Request, Response } from "express";
import logger from "./logger";
import { HttpError } from "http-errors";
import { router as authRouter } from "../routes/auth";
import "reflect-metadata";
import { Config } from "./config";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  // const err=createHttpError(401, "You are not allowed to access the page");
  //   throw err;

  res.send("Welcome to Express Server");
});

app.use("/auth", authRouter);

// global error handler middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  (Config.node_env === "prod" || Config.node_env === "dev") &&
    logger.error(err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    errors: [
      {
        type: err.name,
        msg: err.message,
        path: "",
        location: "",
      },
    ],
  });
});

export default app;
