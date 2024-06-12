import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import request from "supertest";
import app from "../../config/app";
import { Tenant } from "../../entity/Tenant";
import createJWKSMock from "mock-jwks";

describe("DELETE /tenants/id", () => {
    
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

        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        const output=await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send(tenantData);

        const response=await request(app)
        .delete(`/tenants/${Number(output.body.id)}`)
        .set("Cookie", [`accessToken=${adminToken};`])
        .send();

        expect(response.statusCode).toBe(200);

        const tenantRepository=connection.getRepository(Tenant);
        const tenant=await tenantRepository.find();

        expect(tenant).toHaveLength(0);
    });

    it("should return 401 if user is not authenticated", async ()=>{ 

        const response= await request(app)
        .delete(`/tenants/${1}`)
        // .set("Cookie", [`accessToken=${adminToken};`])
        .send();

        expect(response.statusCode).toBe(401);
    })

    it("should delete added tenant", async ()=>{
        const tenantData={
            name:"tenant1",
            address:"shirur"
        }

        const output=await request(app)
        .post('/tenants')
        .set("Cookie", [`accessToken=${adminToken};`])
        .send(tenantData);

        const response=await request(app)
        .delete(`/tenants/${Number(output.body.id)}`)
        .set("Cookie", [`accessToken=${adminToken};`])
        .send();

        expect(response.statusCode).toBe(200);

        const tenantRepository=connection.getRepository(Tenant);
        const tenant=await tenantRepository.find();

        expect(tenant).toHaveLength(0);
    })
    
});
