import express from 'express';
import { TenantController } from '../controller/tenantController';

const router=express.Router();

const tenantController=new TenantController()

router.post('/', (req, res, next)=> tenantController.create(req, res, next));

export default router;