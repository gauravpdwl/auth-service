import request from "supertest";
import app from "../../config/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import createJWKSMock from 'mock-jwks';
import { User } from "../../entity/User";

describe.skip("GET auth/self/", () => {
  describe("Login with token", () => {
    
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
      jwks=createJWKSMock('http://localhost:8000');
      connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
      jwks.start();
      await connection.dropDatabase();
      await connection.synchronize();
    });

    afterEach(()=>{
      jwks.stop();
    })

    afterAll(async () => {
      await connection.destroy();
    });

    it("should return 200 status", async () => {

      const accessToken=jwks.token({
        sub: "11111", 
        role:"customer"
      });

      const response = await request(app)
      .get("/auth/self")
      .set("Cookie", [`accessToken=${accessToken};`])
      .send();

      expect(response.statusCode).toBe(200);
    });

    it("should return user data", async () => {
      // register user first to get the data

      const registerData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const userRepository=connection.getRepository(User);
      const data=await userRepository.save({...registerData, role:"customer"});

      // Generate token
      const accessToken=jwks.token({sub: String(data.id), role:data.role});

      // Add token to cookie

      const response=await request(app)
      .get("/auth/self")
      .set("Cookie", [`accessToken=${accessToken};`])
      .send();

      expect(response.body as Record<string, string>).toBe(data.id);
    });

    it("should not return the passwod field", async ()=>{
      const registerData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const userRepository=connection.getRepository(User);
      const data=await userRepository.save({...registerData, role:"customer"});

      // Generate token
      const accessToken=jwks.token({sub: String(data.id), role:data.role});

      // Add token to cookie

      const response=await request(app)
      .get("/auth/self")
      .set("Cookie", [`accessToken=${accessToken};`])
      .send();

      expect(response.body as Record<string, string>).not.toHaveProperty('password')
    })

    it("should return 401 code if token not exists in request", async ()=>{
      const registerData = {
        firstName: "Gaurav",
        lastName: "Padwal",
        email: "gaurav@gmail.com",
        password: "secret",
      };

      const userRepository=connection.getRepository(User);
      await userRepository.save({...registerData, role:"customer"});

      // Generate token
      // const accessToken=jwks.token({sub: String(data.id), role:data.role});

      // Add token to cookie

      const response=await request(app)
      .get("/auth/self")
      .send();

      expect(response.statusCode).toBe(401);
    })

  });
});
