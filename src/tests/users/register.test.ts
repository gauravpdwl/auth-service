import request from "supertest";
import app from "../../config/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
// import { truncateTables } from "../utilities";
import { User } from "../../entity/User";
import { RefreshToken } from "../../entity/RefreshToken";

describe("POST /auth/register", () => {
  describe("given all fields", () => {
    let connection: DataSource;

    // before all test case runs
    beforeAll(async () => {
      connection = await AppDataSource.initialize();
    });

    // before each test case runs clear the tables
    beforeEach(async () => {
      // if we add new column in entity then it will drop database
      // rebuild.

      await connection.dropDatabase();
      await connection.synchronize();

      // await truncateTables(connection);
    });

    afterAll(async () => {
      await connection.destroy();
    });

    it("should return 201 code", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(201);
    });

    it("should return json response", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const response = await request(app).post("/auth/register").send(userData);
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });

    it("should persists the user in the database", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const userspr = userRepository.find();
      const users = await userspr.then((data) => {
        return data;
      });

      // console.log(users);
      expect(users).toHaveLength(1);
    });

    it("should check for customer role", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const userpr = userRepository.find();
      const users = await userpr.then((data) => {
        return data;
      });

      expect(users[0].role).toBe("customer");
    });

    it("should return hashed password", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const userpr = userRepository.find();
      const users = await userpr.then((data) => {
        return data;
      });

      expect(users[0].password).not.toBe(userData.password);
    });

    it("should have unique mail", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const userRepo = connection.getRepository(User);
      await userRepo.save({ ...userData, role: "customer" });

      const response = await request(app).post("/auth/register").send(userData);

      const users = await userRepo.find();

      // console.log(users);

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return access token", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      let accessToken = null;
      let refreshToken = null;

      interface Headers {
        ["set-cookie"]: string[];
      }

      const response = await request(app).post("/auth/register").send(userData);
      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];

      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }

        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();

      // console.log(response.body)
    });

    it("Should store the refresh token in the database", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(userData);

      const refreshTokenRepo = connection.getRepository(RefreshToken);
      const refreshTokens = await refreshTokenRepo.find();

      expect(refreshTokens).toHaveLength(1);
    });
  });

  //***********************************************************************************

  describe("fields are missing", () => {
    let connection: DataSource;

    // before all test case runs
    beforeAll(async () => {
      connection = await AppDataSource.initialize();
    });

    // before each test case runs clear the tables
    beforeEach(async () => {
      // if we add new column in entity then it will drop database
      // rebuild.

      await connection.dropDatabase();
      await connection.synchronize();

      // await truncateTables(connection);
    });

    afterAll(async () => {
      await connection.destroy();
    });

    it("if email field is empty then it should return 400 code", async () => {
      const userData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "",
        password: "secret",
      };

      const userRepository = connection.getRepository(User);

      const response = await request(app).post("/auth/register").send(userData);

      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });
  });
});
