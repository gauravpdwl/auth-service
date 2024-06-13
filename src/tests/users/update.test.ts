import request from "supertest";
import app from "../../config/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import createJWKSMock from 'mock-jwks';

describe("PATCH /users/id", () => {
  describe("With token", () => {
    
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

    it("should update single user", async ()=>{
        
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

        const updatedData = {
            firstName: "atharva2",
            lastName: "Padwal",
            email: "atharva2@gmail.com",
            password: "secret",
            role:"manager",
            tenantId:"2"
        };

        await request(app)
        .post("/users")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(data1);

        const output = await request(app)
        .post("/users")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(data2);

        const response=await request(app)
        .patch(`/users/${output.body.id}`)
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(updatedData);

        expect(response.statusCode).toBe(200);
        expect(response.body.firstName).toBe(output.body.firstName);
    })

    it("should return 403 if non admin user tries to update user", async ()=>{
        
        const adminToken=jwks.token({
            sub: "1", 
            role:"customer"
        });

        const updatedData = {
            firstName: "atharva2",
            lastName: "Padwal",
            email: "atharva2@gmail.com",
            password: "secret",
            role:"manager",
            tenantId:"2"
        };

        const resposne=await request(app)
        .patch(`/users/1`)
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(updatedData);

        expect(resposne.statusCode).toBe(403);
      })

      it("should return 404 if non admin user tries to update non existing user", async ()=>{
        
        const adminToken=jwks.token({
            sub: "1", 
            role:"admin"
        });

        const updatedData = {
            firstName: "atharva2",
            lastName: "Padwal",
            email: "atharva2@gmail.com",
            password: "secret",
            role:"manager",
            tenantId:"2"
        };

        const resposne=await request(app)
        .patch(`/users/1`)
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(updatedData);

        expect(resposne.statusCode).toBe(404);
      })
  });
});
