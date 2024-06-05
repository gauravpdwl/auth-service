import { config } from "dotenv";
import path from "path";

config({ path: path.join(__dirname, `../../.env.${process.env.node_env}`) });

const {
  port,
  dbport,
  node_env,
  dbhost,
  dbusername,
  dbpassword,
  dbdatabasename,
  refresh_secret_key,
} = process.env;

// console.log(node_env, dbhost, dbusername, dbpassword);

export const Config = {
  port,
  dbport,
  node_env,
  dbhost,
  dbusername,
  dbpassword,
  dbdatabasename,
  refresh_secret_key,
};
