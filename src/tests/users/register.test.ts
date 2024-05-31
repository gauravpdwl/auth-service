import request from "supertest";
import app from "../../config/app";

describe("POST /auth/register", () => {
  describe("given all fields", () => {
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
  });
});
