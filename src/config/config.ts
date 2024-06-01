import { config } from "dotenv";
import path from "path";

config({ path: path.join(__dirname, `../../.env.${process.env.node_env}`) });

const { port, node_env, dbhost, dbusername, dbpassword, dbdatabasename } =
  process.env;

export const Config = {
  port,
  node_env,
  dbhost,
  dbusername,
  dbpassword,
  dbdatabasename,
};
