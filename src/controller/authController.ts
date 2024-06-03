import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

interface userData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface RegisteredUser extends Request {
  body: userData;
}

export class AuthController {
  async register(req: RegisteredUser, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;

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
        role: "customer",
      });

      const secretKey = "secret";

      const payload = {
        userid: newuser.id,
      };

      const accessToken = jwt.sign(payload, secretKey, {
        expiresIn: "1h",
        algorithm: "HS256",
      });

      res.status(201).json({
        message: "Registration Successful",
        accessToken: accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
}
