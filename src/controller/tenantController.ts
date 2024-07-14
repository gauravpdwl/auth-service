import { NextFunction, Request, Response } from "express";
import { Tenant } from "../entity/Tenant";
import { AppDataSource } from "../config/data-source";
import logger from "../config/logger";
import createHttpError from "http-errors";

interface TenantData{
    name:string,
    address:string
}

interface TenantRequest extends Request{
    body:TenantData
}

interface QueryRequest extends TenantRequest{
    query: {
      currentPage: string;
      perPage: string;
      q:string;
    }
}


export class TenantController{

    async create(req: TenantRequest, res: Response, next:NextFunction){
        const {name, address}=req.body;
        try{

            if (!name || !address) {
                const err = createHttpError(400, "name or address field is empty");
                throw err;
            }

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

    async all(req: QueryRequest, res: Response, next:NextFunction){

    let currentPage = 1,
      perPage = 10,
      q = "";

        if (req.query) {
        if (req.query.currentPage) {
            const cp = req.query.currentPage.trim();
            currentPage = Number(cp);
        }

        if (req.query.perPage) {
            const pp = req.query.perPage.trim();
            perPage = Number(pp);
        }

        if (req.query.q) {
            const searchquery = req.query.q.trim();
            q = `%${searchquery}%`;
        }
        }

        try{

            const tenantRepository = AppDataSource.getRepository(Tenant);
            const queryBuilder = tenantRepository.createQueryBuilder("tenant");
            if(q){
                queryBuilder.where("tenant.name ILike :q", {q:q})
            }

            const result=await queryBuilder
                .skip((currentPage - 1) * perPage)
                .take(perPage)
                .orderBy("tenant.id", "DESC")
                .getManyAndCount();

            const allTenants={
                currentPage,
                perPage,
                data: result[0],
                total: result[1],
            }

            logger.info("All tenants are fetched from db");

            res.json(allTenants);

        }catch(err){
            next(err);
        }
    }

    async single(req:TenantRequest, res:Response, next:NextFunction){
        try{

            const id=req.params.id;

            if (!id) {
                const err = createHttpError(400, "id param is empty");
                throw err;
            }

            // console.log("params id -> ",id);

            const tenantRepository = AppDataSource.getRepository(Tenant);
            const tenant=await tenantRepository.findOne({where:{id: Number(id)}});

            if (!tenant) {
                next(createHttpError(400, "Tenant does not exist."));
                return;
            }

            logger.info("Tenant fetched from DB", {id: id});

            res.json(tenant);

        }catch(err){
            next(err);
        }
    }

    async update(req:TenantRequest, res:Response, next:NextFunction){
        try{

            const {name, address}=req.body;
            const id=req.params.id;

            if (!id) {
                const err = createHttpError(400, "id param is empty");
                throw err;
            }

            if (!name || !address) {
                const err = createHttpError(400, "name or address field is empty");
                throw err;
            }

            // console.log("params id -> ",id);

            const tenantRepository = AppDataSource.getRepository(Tenant);
            const tenant=await tenantRepository.update(id, {name, address});

            if (!tenant) {
                next(createHttpError(400, "Tenant does not exist."));
                return;
            }

            logger.info("Tenant updated in DB", {id: id});

            res.json(tenant);

        }catch(err){
            next(err);
        }
    }

    async destroy(req:TenantRequest, res:Response, next:NextFunction){
        try{
            const id=req.params.id;

            if (!id) {
                const err = createHttpError(400, "id param is empty");
                throw err;
            }
            // console.log("params id -> ",id);

            const tenantRepository = AppDataSource.getRepository(Tenant);
            const tenant=await tenantRepository.delete(id);

            if (!tenant) {
                next(createHttpError(400, "Tenant does not exist."));
                return;
            }

            logger.info("Tenant deleted in DB", {id: id});

            res.json({
                message:"Tenant is deleted"
            });

        }catch(err){
            next(err);
        }
    }
}

