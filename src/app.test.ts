import app from "./config/app";
import { calculateDiscount } from "./config/utils";
import request from "supertest";

describe.skip("App", () => {
  it("should calculate discount", () => {
    const result = calculateDiscount(100, 10);

    expect(result).toBe(10);
  });

  it("should return 200 status code", async () => {
    const response = await request(app).get("/").send();
    expect(response.statusCode).toBe(200);
  });
});
