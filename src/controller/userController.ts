import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Config } from "../config/config";
import logger from "../config/logger";

interface userData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantId: string;
}

interface RegisteredUser extends Request {
  body: userData;
}

interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id: string;
  };
}

export class UserController {
  async create(req: RegisteredUser, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password, tenantId } = req.body;

      if (!email) {
        const err = createHttpError(400, "email field is empty");
        throw err;
      }

      firstName.trim();
      lastName.trim();
      email.trim();
      password.trim();

      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({ where: { email: email } });
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
        role: "manager",
        tenantId,
      });

      (Config.node_env === "prod" || Config.node_env === "dev") &&
        logger.info(`User is registered ${newuser.id}`);

      res.status(201).json({
        message: "Registration Successful",
        id: newuser.id,
      });
    } catch (err) {
      next(err);
    }
  }

  async all(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantRepository = AppDataSource.getRepository(User);
      const allUsers = await tenantRepository.find();

      // console.log("req auth id", req.auth.sub);

      logger.info("All users are fetched from db by", { id: req.auth.sub });

      res.json(allUsers);
    } catch (err) {
      next(err);
    }
  }

  async single(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;

      if (!id) {
        const err = createHttpError(400, "id param is empty");
        throw err;
      }

      // console.log("params id -> ",id);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: Number(id) } });

      if (!user) {
        next(createHttpError(400, "user does not exist."));
        return;
      }

      logger.info(`user fetched from DB`, { id: id });

      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password, role, tenantId } = req.body;
      const id = req.params.id;

      if (!id) {
        const err = createHttpError(400, "id param is empty");
        throw err;
      }

      if (
        !email ||
        !firstName ||
        !lastName ||
        !password ||
        !role ||
        !tenantId
      ) {
        const err = createHttpError(400, "Fields are empty");
        throw err;
      }

      // console.log("params id -> ",id);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.update(id, {
        firstName,
        lastName,
        email,
        password,
        role,
      });

      if (!user) {
        next(createHttpError(400, "User does not exist."));
        return;
      }

      if (user.affected===0) {
        next(createHttpError(404, "User does not exist."));
        return;
      }

      logger.info("User updated in DB", { id: id });

      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async destroy(req:AuthRequest, res:Response, next:NextFunction){
    try{
        const id=req.params.id;

        if (!id) {
            const err = createHttpError(400, "id param is empty");
            throw err;
        }
        // console.log("params id -> ",id);

        const userRepository = AppDataSource.getRepository(User);
        const user=await userRepository.delete(id);

        if (!user) {
            next(createHttpError(400, "User does not exist."));
            return;
        }

        if (user.affected===0) {
            next(createHttpError(404, "User does not exist."));
            return;
          }

        logger.info("user deleted in DB", {id: id});

        res.json({
            message:"user is deleted",
            id:id
        });

    }catch(err){
        next(err);
    }
}
}
