import { NextFunction, Request, Response } from "express";
import { Tenant } from "../entity/Tenant";
import { AppDataSource } from "../config/data-source";
import logger from "../config/logger";

interface TenantData{
    name:string,
    address:string
}

interface TenantRequest extends Request{
    body:TenantData
}


export class TenantController{

    async create(req: TenantRequest, res: Response, next:NextFunction){
        const {name, address}=req.body;
        try{

            const tenantRepository = AppDataSource.getRepository(Tenant);
            const newTenant=await tenantRepository.save({name, address});

            logger.info("Tenant has been created ",{id:newTenant.id});

            res.status(201).json({
                message:"Tenant Created Successfully",
                id:newTenant.id
            });

        }catch(err){
            next(err);
        }
    }
}