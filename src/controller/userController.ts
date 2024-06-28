import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Config } from "../config/config";
import logger from "../config/logger";
import { Brackets } from "typeorm";

interface userData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  tenantId: string;
}

interface RegisteredUser extends Request {
  body: userData;
}

interface AuthRequest extends RegisteredUser {
  auth: {
    sub: string;
    role: string;
    id: string;
  };
}

interface QueryRequest extends AuthRequest {
  query: {
    currentPage: string;
    perPage: string;
    q: string;
    role: string;
  };
}

export class UserController {
  async create(req: RegisteredUser, res: Response, next: NextFunction) {
    try {
      let { firstName, lastName, email, password, role, tenantId } = req.body;

      if (!email) {
        const err = createHttpError(400, "email field is empty");
        throw err;
      }

      firstName=firstName.trim();
      lastName=lastName.trim();
      email=email.trim();
      password=password.trim();
      role=role.trim();

      // eslint-disable-next-line no-self-assign
      tenantId=tenantId

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
        role,
        tenant: tenantId ? { id: Number(tenantId) } : undefined,
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

  async all(req: QueryRequest, res: Response, next: NextFunction) {
    let currentPage = 1,
      perPage = 10,
      q = "",
      role = "";

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

      if (req.query.role) {
        const rq = req.query.role.trim();
        role = rq;
      }

      // console.log("Req query currentPage", currentPage);
      // console.log("Req query perPage ", perPage);
    }

    try {
      const usersRepository = AppDataSource.getRepository(User);
      const queryBuilder = usersRepository.createQueryBuilder("user");

      // here first q referes the q inside the string and second q refers the declared q
      if (q) {
        queryBuilder.where(
          new Brackets((qb) => {
            // *****VERSION 3
            qb.where("CONCAT(user.firstName, ' ', user.lastName) ILike :q",{q:q})
              .orWhere("user.email ILike :q", { q: q });

              // *****VERSION 2
            // qb.where("user.firstName ILike :q", { q: q })
            //   .orWhere("user.lastName ILike :q", { q: q })
            //   .orWhere("user.email ILike :q", { q: q });
          }),
        );

        // *****VERSION 1
        // queryBuilder.where("firstName ILike :q", {q:q})
        //           .orWhere("lastName ILike :q", {q:q})
        //           .orWhere("email ILike :q",{q:q});
      }

      // here we have used andWhere because we have query above if that is also containing
      // query then we have to seach query and role together so that's why andWhere
      if (role) {
        queryBuilder.andWhere("user.role =:role", { role: role });
      }

      const result = await queryBuilder
        .leftJoinAndSelect("user.tenant","tenant")
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .orderBy("user.id", "DESC")
        .getManyAndCount();

      // console.log(result);
      // const allUsers = await usersRepository.find();
      // console.log(queryBuilder.getSql());

      const allUsers = {
        currentPage,
        perPage,
        data: result[0],
        total: result[1],
      };

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
      let { firstName, lastName, role, tenantId } = req.body;
      const id = req.params.id;

      if (!id) {
        const err = createHttpError(400, "id param is empty");
        throw err;
      }

      if (
        !firstName ||
        !lastName ||
        !role
      ) {
        const err = createHttpError(400, "Fields are empty");
        throw err;
      }

      console.log("tenant value - ", tenantId);

      firstName=firstName.trim();
      lastName=lastName.trim();
      role=role.trim();
      // eslint-disable-next-line no-self-assign
      tenantId=tenantId

      // console.log("params id -> ",id);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.update(id, {
        firstName,
        lastName,
        role,
        tenant: tenantId ? { id: Number(tenantId) } : null,
      });

      if (!user) {
        next(createHttpError(400, "User does not exist."));
        return;
      }

      if (user.affected === 0) {
        next(createHttpError(404, "User does not exist."));
        return;
      }

      logger.info("User updated in DB", { id: id });

      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;

      if (!id) {
        const err = createHttpError(400, "id param is empty");
        throw err;
      }
      // console.log("params id -> ",id);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.delete(id);

      if (!user) {
        next(createHttpError(400, "User does not exist."));
        return;
      }

      if (user.affected === 0) {
        next(createHttpError(404, "User does not exist."));
        return;
      }

      logger.info("user deleted in DB", { id: id });

      res.json({
        message: "user is deleted",
        id: id,
      });
    } catch (err) {
      next(err);
    }
  }
}
