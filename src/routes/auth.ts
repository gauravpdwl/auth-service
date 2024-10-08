import express, { NextFunction } from "express";
import { AuthController } from "../controller/authController";
import authenticate from "../middlewares/authenticate";
import { Request, Response  } from "express";
import validateRefreshToken from "../middlewares/validateRefreshToken";
import parseRefreshToken from "../middlewares/parseRefreshToken";

const router = express.Router();
const authController = new AuthController();

interface AuthRequest extends Request{
  auth:{
      sub:string;
      firstName: string;
      lastName: string;
      email: string;
      role:string;
      id:string;
      tenant:string;
  }   
}

router.post("/register", (req, res, next) =>
  authController.register(req, res, next),
);

router.post("/login", (req, res, next) => authController.login(req, res, next));

router.get("/self", authenticate , (req: Request, res) => {
  return authController.self(req as AuthRequest , res);
});

// post is more secure than get
router.post("/refresh", validateRefreshToken , (req:Request, res:Response, next: NextFunction)=>{
  authController.refresh(req as AuthRequest, res, next);
})

router.post("/logout", authenticate, parseRefreshToken , (req: Request, res, next) => {
  return authController.logout(req as AuthRequest , res, next);
});

export { router };
