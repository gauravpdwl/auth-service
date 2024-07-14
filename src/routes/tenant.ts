import express, { Request } from 'express';
import { TenantController } from '../controller/tenantController';
import authenticate from '../middlewares/authenticate';
import tenantadmincheck from '../middlewares/tenantadmincheck';

interface QueryRequest extends Request{
    query: {
      currentPage: string;
      perPage: string;
      q:string;
    }
}

const router=express.Router();
const tenantController=new TenantController()

router.post('/', authenticate, tenantadmincheck(['admin','customer']), (req, res, next)=> tenantController.create(req, res, next));

router.get('/all', authenticate, tenantadmincheck(['admin', 'customer']), (req, res, next)=> tenantController.all(req as QueryRequest, res, next));

router.get('/:id', authenticate, tenantadmincheck(['admin']), (req, res, next)=> tenantController.single(req, res, next));

router.patch('/:id', authenticate, tenantadmincheck(['admin']), (req, res, next)=> tenantController.update(req, res, next));

router.delete('/:id', authenticate, tenantadmincheck(['admin']), (req, res, next)=> tenantController.destroy(req, res, next));

export default router;