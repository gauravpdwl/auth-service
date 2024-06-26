import express, { Request } from 'express';
import authenticate from '../middlewares/authenticate';
import tenantadmincheck from '../middlewares/tenantadmincheck';
import { UserController } from '../controller/userController';

interface AuthRequest extends Request{
    auth:{
      sub:string;
      role:string;
      id:string;
    }   
}

interface QueryRequest extends AuthRequest{
  query: {
    currentPage: string;
    perPage: string;
    q:string;
    role:string;
  }
}

const router=express.Router();
const userController=new UserController();

router.post('/', authenticate, tenantadmincheck(['admin','customer']), (req, res, next)=> userController.create(req, res, next));

router.get('/all', authenticate, tenantadmincheck(['admin','customer']), (req:Request, res, next)=> userController.all(req as QueryRequest, res, next));

router.get('/:id', authenticate, tenantadmincheck(['admin','customer']), (req:Request, res, next)=> userController.single(req as AuthRequest, res, next));

router.patch('/:id', authenticate, tenantadmincheck(['admin','customer']), (req:Request, res, next)=> userController.update(req as AuthRequest, res, next));

router.delete('/:id', authenticate, tenantadmincheck(['admin','customer']), (req:Request, res, next)=> userController.destroy(req as AuthRequest, res, next));

export default router;