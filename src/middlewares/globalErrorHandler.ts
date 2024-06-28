import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";

export const globalErrorHandler=(
    err:HttpError,
    req:Request,
    res:Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next:NextFunction,
)=>{
    const errorId=uuidv4()

    const statusCode = err.statusCode || err.status || 500;

    const isProduction = process.env.node_env === "prod";

    const message=isProduction ? "Internal Server Error" : err.message;

    logger.error(err.message, {
        id:errorId,
        statusCode,
        error: err.stack,
        path:req.path,
        method:req.method
    })

    res.status(statusCode).json({
        error:[
            {
                ref: errorId,
                type: err.name,
                msg: message,
                path: req.path,
                method: req.method,
                location: "server",
                stack: isProduction ? null : err.stack
            }
        ]
    })

}
    
