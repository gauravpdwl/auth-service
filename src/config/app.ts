import express, { NextFunction, Request, Response } from "express";
import logger from "./logger";
import { HttpError } from "http-errors";
import { router as authRouter } from "../routes/auth";
import tenantRouter from '../routes/tenant';
import userRouter from '../routes/user';
import "reflect-metadata";
import { Config } from "./config";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
  origin:["http://localhost:5173"],
  credentials: true
}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  // const err=createHttpError(401, "You are not allowed to access the page");
  //   throw err;

  res.send("Welcome to Express Server");
});

app.use("/auth", authRouter);

app.use("/tenants", tenantRouter);

app.use('/users', userRouter)

// global error handler middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  (Config.node_env === "prod" || Config.node_env === "dev") &&
  
  logger.error(err.message);

  const statusCode = err.statusCode || err.status || 500;

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
