import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";

import { Config } from "./config";
import { RefreshToken } from "../entity/RefreshToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: Config.dbhost,
  port: Number(Config.dbport),
  username: Config.dbusername,
  password: Config.dbpassword,
  database: Config.dbdatabasename,
  // make it false in production
  // if it detects any changes in db schema it creates new database
  synchronize: true,
  logging: false,
  entities: [User, RefreshToken],
  migrations: [],
  subscribers: [],
});
