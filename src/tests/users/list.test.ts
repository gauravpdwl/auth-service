import request from "supertest";
import app from "../../config/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import createJWKSMock from 'mock-jwks';

describe("GET /users/all", () => {
  describe("Login with token", () => {
    
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
      jwks=createJWKSMock('http://localhost:8000');
      connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
      await connection.dropDatabase();
      await connection.synchronize();
      jwks.start();
    });

    afterEach(()=>{
      jwks.stop();
    })

    afterAll(async () => {
      await connection.destroy();
    });

    it("should return all the users", async ()=>{
        
        const adminToken=jwks.token({
            sub: "1", 
            role:"admin"
        });

        const data1 = {
            firstName: "manas",
            lastName: "Padwal",
            email: "manas@gmail.com",
            password: "secret",
            role:"manager",
            tenantId:"1"
        };

        const data2 = {
            firstName: "atharva",
            lastName: "Padwal",
            email: "atharva@gmail.com",
            password: "secret",
            role:"manager",
            tenantId:"2"
        };
    

        await request(app)
        .post("/users")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(data1);

        await request(app)
        .post("/users")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(data2);

        const resposne=await request(app)
        .get("/users/all")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send();

        expect(resposne.statusCode).toBe(200);
        // console.log(resposne);
        expect(resposne.body).toHaveLength(2);
    })

    it("should return 403 if non admin user tries to access all users", async ()=>{
        
        const adminToken=jwks.token({
            sub: "1", 
            role:"customer"
        });

        const resposne=await request(app)
        .get("/users/all")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send();

        expect(resposne.statusCode).toBe(403);
      })
  });
});
