import request from "supertest";
import app from "../../config/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import createJWKSMock from 'mock-jwks';
import { User } from "../../entity/User";

describe("POST /users", () => {
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

    it("should persist the user in database", async ()=>{
        const data = {
            firstName: "manas",
            lastName: "Padwal",
            email: "manas@gmail.com",
            password: "secret",
            role:"manager",
            tenantId:"1"
        };

        const adminToken=jwks.token({
            sub: "1", 
            role:"admin"
        });

        await request(app)
        .post("/users")
        .set('Cookie',[`accessToken=${adminToken}`])
        .send(data);

        const userRepository=connection.getRepository(User);
        const users=await userRepository.find();

        expect(users).toHaveLength(1);
        expect(users[0].role).toBe("manager")
    })

    it("should return 403 if non admin user tries to create a user", async ()=>{
      const data = {
        firstName: "manas",
        lastName: "Padwal",
        email: "manas@gmail.com",
        password: "secret",
        role:"manager",
        tenantId:"1"
      };

      const adminToken=jwks.token({
          sub: "1", 
          role:"customer"
      });

      const resposne=await request(app)
      .post("/users")
      .set('Cookie',[`accessToken=${adminToken}`])
      .send(data);

      expect(resposne.statusCode).toBe(403);
    })
  });
});
