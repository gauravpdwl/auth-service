import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import request from "supertest";
import app from "../../config/app";
import { Tenant } from "../../entity/Tenant";
import createJWKSMock from "mock-jwks";

describe("GET /tenants/all", () => {
    
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

    it("should return 200 status code", async () => {

        const response= await request(app)
        .get('/tenants/all')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send();

        expect(response.statusCode).toBe(200);
    });

    it("should return 401 if user is not authenticated", async ()=>{
        
        const response= await request(app)
        .get('/tenants/all')
        .send();

        expect(response.statusCode).toBe(401);
    })

    it("should return array of tenants", async ()=>{
        const tenantData1={
            name:"tenant1",
            address:"shirur"
        }

        const tenantData2={
            name:"tenant2",
            address:"shirur"
        }

        await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send(tenantData1);

        await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send(tenantData2);

        const tenantRepository=connection.getRepository(Tenant);
        const tenants=await tenantRepository.find();
        
        expect(tenants).toHaveLength(2);
        expect(tenants[0].name).toBe(tenantData1.name);
        expect(tenants[1].name).toBe(tenantData2.name);
    })
    
});
