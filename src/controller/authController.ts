import fs from "fs";
import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from "../config/logger";
import { Config } from "../config/config";
import path from "path";

interface userData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role:string;
}

interface RegisteredUser extends Request {
  body: userData;
}

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

export class AuthController {
  
  async register(req: RegisteredUser, res: Response, next: NextFunction) {
    try {
      let { firstName, lastName, email, password, role } = req.body;

      if (!email) {
        const err = createHttpError(400, "email field is empty");
        throw err;
      }

      firstName=firstName.trim();
      lastName=lastName.trim();
      email=email.trim();
      password=password.trim();
      role=role.trim()

      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({ where: { email: email }, select:["email","password", "id", "role"] });
      if (user) {
        const err = createHttpError(400, "User is already present in db");
        throw err;
      }

      const saltRound = 10;
      const hashedPassword = await bcrypt.hash(password, saltRound);

      const newuser = await userRepository.save({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
      });

      (Config.node_env === "prod" || Config.node_env === "dev") &&
        logger.info(`User is registered ${newuser.id}`);

      // const secretKey = "secret";
      // const payload = {
      //   userid: newuser.id,
      // };
      // const accessToken = jwt.sign(payload, secretKey, {
      //   expiresIn: "1h",
      //   algorithm: "HS256",
      // });
      let privatekey: Buffer;

      try {
        privatekey = fs.readFileSync(
          path.join(__dirname, "../../certs/private.pem"),
        );
      } catch (err) {
        const error = createHttpError(500, "Error while reading private key");
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(newuser.id),
        role: newuser.role,
        firstName: newuser.firstName,
        lastName: newuser.lastName,
        email: newuser.email
      };

      const accessToken = jwt.sign(payload, privatekey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
      });

      // Persist the refresh token in DB

      const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user: newuser,
        expiresAt: new Date(Date.now() + MS_IN_YEAR),
      });

      const refreshToken = jwt.sign({...payload, id:newRefreshToken.id}, Config.refresh_secret_key!, {
        algorithm: "HS256",
        expiresIn: "1y",
        issuer: "auth-service",
        jwtid: String(newRefreshToken.id),
      });

      // console.log("Registration -> Refresh Token ID - ",newRefreshToken.id);

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, //expires in 1h
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, //expires in 1Year
        httpOnly: true,
      });

      res.status(201).json({
        message: "Registration Successful",
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: RegisteredUser, res: Response, next: NextFunction) {
    try {
      let {email, password } = req.body;

      if (!email || !password) {
        const err = createHttpError(400, "email or password field is empty");
        throw err;
      }

      email=email.trim();
      password=password.trim();

      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({ 
        where: { email: email }, 
        select:["email","password", "id", "role", "tenant", "firstName", "lastName"], 
        relations:{ tenant:true }
       });

      if (!user) {
        const err = createHttpError(404, "Email or Password does not match");
        throw err;
      }

      const passwordMatch=await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        const err = createHttpError(404, "Email or Password does not match");
        throw err;
      }

      let privatekey: Buffer;

      try {
        privatekey = fs.readFileSync(
          path.join(__dirname, "../../certs/private.pem"),
        );
      } catch (err) {
        const error = createHttpError(500, "Error while reading private key");
        next(error);
        return;
      }


      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
        tenant: user.tenant ? user.tenant.id : "",
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      const accessToken = jwt.sign(payload, privatekey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
      });

      // Persist the refresh token in DB

      const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_YEAR),
      });

      const refreshToken = jwt.sign({...payload, id:newRefreshToken.id}, Config.refresh_secret_key!, {
        algorithm: "HS256",
        expiresIn: "1y",
        issuer: "auth-service",
        jwtid: String(newRefreshToken.id),
      });

      // console.log("Login -> Refresh Token ID - ",newRefreshToken.id);

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, //expires in 1h
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, //expires in 1Year
        httpOnly: true,
      });

      logger.info(`User is logged in successfully ${user.id}`);

      res.status(200).json({
        id:user.id,
        message: "Login Successful",
      });
    } catch (err) {
      next(err);
    }
  }

  async self(req: AuthRequest, res: Response) {

    // console.log(req.auth);

    const userRepository = AppDataSource.getRepository(User);
    const user=await userRepository.findOne(
      {
        where:{
          id: Number(req.auth.sub)
        },
        relations:{
          tenant:true
        }
      
      });

    res.status(200).json(user);
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction){
    // console.log("req auth ------------> ",req.auth);

    try{

    const userRepository = AppDataSource.getRepository(User);

    const user= await userRepository.findOne({ 
      where: { id: Number(req.auth.sub) }, 
      select:["email","password", "id", "role", "tenant"],
      relations:{ tenant:true }
    });

    if (!user) {
      const err = createHttpError(404, "USER not present for given Token");
      throw err;
    }

      const payload: JwtPayload = {
        sub: String(req.auth.sub),
        role: req.auth.role,
        tenant: req.auth.tenant,
        email: req.auth.email,
        firstName: req.auth.firstName,
        lastName: req.auth.lastName
      };

      let privatekey: Buffer;

      try {
        privatekey = fs.readFileSync(
          path.join(__dirname, "../../certs/private.pem"),
        );
      } catch (err) {
        const error = createHttpError(500, "Error while reading private key");
        next(error);
        return;
      }

      const accessToken = jwt.sign(payload, privatekey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
      });

      // Persist the refresh token in DB

      const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_YEAR),
      });


      // delete old refresh token id's from RefreshToken db.
      await refreshTokenRepository.delete({id: Number(req.auth.id)});

      const refreshToken = jwt.sign({...payload, id:newRefreshToken.id}, Config.refresh_secret_key!, {
        algorithm: "HS256",
        expiresIn: "1y",
        issuer: "auth-service",
        jwtid: String(newRefreshToken.id),
      });

      console.log("Login -> Refresh Token ID - ",newRefreshToken.id);

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, //expires in 1h
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, //expires in 1Year
        httpOnly: true,
      });

      logger.info(`User is logged in successfully ${user.id}`);

      res.status(200).json({
        id:user.id,
        message: "Login Successful",
      });

    }
    catch(err){
      next(err);
    }
  }

  async logout(req:AuthRequest, res: Response, next:NextFunction){
    try{
      
      // console.log(req.auth);
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      await refreshTokenRepository.delete({id: Number(req.auth.id)});

      logger.info("Refresh token has been deleted", {id:req.auth.id});
      logger.info("User has been logged Out", {id:req.auth.sub});

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({message:"User is logged out"});

    }catch(err){
      next(err);
    }
  }
}
