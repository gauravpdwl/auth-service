import express from 'express';
import { TenantController } from '../controller/tenantController';
import authenticate from '../middlewares/authenticate';
import tenantadmincheck from '../middlewares/tenantadmincheck';

const router=express.Router();

const tenantController=new TenantController()

router.post('/', authenticate, tenantadmincheck(['admin']), (req, res, next)=> tenantController.create(req, res, next));

export default router;