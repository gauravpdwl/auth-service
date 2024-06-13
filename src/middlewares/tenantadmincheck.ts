import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

interface AuthRequest extends Request{
    auth:{
      sub:string;
      role:string;
    }   
}

export default function tenantAdminCheck(roles: string[]){
    return (req:Request, res:Response, next:NextFunction)=>{
        const _req=req as AuthRequest;
        const roleFromToken=_req.auth.role;
        
        if(!roles.includes(roleFromToken)){
            const err=createHttpError(403, "You don't have enough permissions");
            next(err);
            return;
        }
        next();
    }
}