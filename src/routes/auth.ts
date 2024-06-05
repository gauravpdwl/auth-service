import express from "express";
import { AuthController } from "../controller/authController";

const router = express.Router();
const authController = new AuthController();

router.post("/register", (req, res, next) =>
  authController.register(req, res, next),
);

router.post("/login", (req, res, next) => authController.login(req, res, next));

router.post("/self", (req, res) => {
  authController.self(req, res);
});

export { router };
