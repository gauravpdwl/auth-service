import request from "supertest";
import app from "../../config/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
// import { truncateTables } from "../utilities";
describe.skip("GET auth/self/", () => {
  describe("Login with token", () => {
    let connection: DataSource;

    beforeAll(async () => {
      connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
      await connection.dropDatabase();
      await connection.synchronize();
    });

    afterAll(async () => {
      await connection.destroy();
    });

    it("should return 200 status", async () => {
      const response = await request(app).post("/auth/self").send();
      expect(response.statusCode).toBe(200);
    });
  });
});
