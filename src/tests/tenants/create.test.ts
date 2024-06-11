import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import request from "supertest";
import app from "../../config/app";
import { Tenant } from "../../entity/Tenant";
import createJWKSMock from "mock-jwks";

describe("POST /tenants", () => {
  describe("Given all fields", () => {
    
        let connection: DataSource;
        let jwks: ReturnType<typeof createJWKSMock>;
        let adminToken: string;

    beforeAll(async () => {
        jwks=createJWKSMock('http://localhost:8000');
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        
        await connection.dropDatabase();
        await connection.synchronize();

        jwks.start();

        adminToken=jwks.token({
            sub:"1",
            role:"admin"
        })
    });

    afterEach(()=>{
        jwks.stop();
    })

    afterAll(async () => {
        await connection.destroy();
    });

    it("should return 201 status code", async () => {
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        const response= await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send(tenantData);

        expect(response.statusCode).toBe(201);
    });

    it("should create tenant in database", async () => {
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send(tenantData);

        const tenantRepository=connection.getRepository(Tenant);
        const tenants=await tenantRepository.find();

        expect(tenants).toHaveLength(1);
        expect(tenants[0].name).toBe(tenantData.name);
    });

    it("should return 401 if user is not authenticated", async ()=>{
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        const response=await request(app).post('/tenants').send(tenantData);
        expect(response.statusCode).toBe(401);

        const tenantRepository=connection.getRepository(Tenant);
        const tenants=await tenantRepository.find();

        expect(tenants).toHaveLength(0);
    })
    
    it("should return 403 if user is not admin", async ()=>{
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        const managerToken=jwks.token({
            sub:"1",
            role:"manager"
        })

        await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${managerToken};`])
        .send(tenantData);

        const tenantRepository=connection.getRepository(Tenant);
        const tenants=await tenantRepository.find();

        expect(tenants).toHaveLength(0);
    })

  });
});
