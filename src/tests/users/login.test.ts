import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import app from "../../config/app";
import request from "supertest";

describe.skip("POST /auth/login", () => {
  describe("For all fields", () => {
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

    it("should return statuscode 200 for correct password", async () => {
      const loginData = {
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const registerData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(registerData);

      const response = await request(app).post("/auth/login").send(loginData);

      expect(response.statusCode).toBe(200);
    });

    it("should return statuscode 404 for incorrect password", async () => {
      const loginData = {
        email: "gaurav@gmail.com",
        password: "secrett",
      };

      const registerData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(registerData);

      const response = await request(app).post("/auth/login").send(loginData);

      expect(response.statusCode).toBe(404);
    });

    it("should return statuscode 404 for incorrect email", async () => {
      const loginData = {
        email: "gauravv@gmail.com",
        password: "secrett",
      };

      const registerData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      await request(app).post("/auth/register").send(registerData);

      const response = await request(app).post("/auth/login").send(loginData);

      expect(response.statusCode).toBe(404);
    });
  });
});
