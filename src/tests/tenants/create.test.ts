import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import request from "supertest";
import app from "../../config/app";
import { Tenant } from "../../entity/Tenant";

describe("POST /tenants", () => {
  describe("Given all fields", () => {
    
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

    it("should return 201 status code", async () => {
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        const response= await request(app).post('/tenants').send(tenantData);
        expect(response.statusCode).toBe(201);
    });

    it("should should create tenant in database", async () => {
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        await request(app).post('/tenants').send(tenantData);

        const tenantRepository=connection.getRepository(Tenant);
        const tenants=await tenantRepository.find();

        expect(tenants).toHaveLength(1);
        expect(tenants[0].name).toBe(tenantData.name);
    });

  });
});
