import app from "./config/app";
import { Config } from "./config/config";
import { AppDataSource } from "./config/data-source";
import logger from "./config/logger";

const startServer = async () => {
  const port = Config.port;

  try {
    await AppDataSource.initialize();
    logger.info("Database Connected Successfully");

    // to test the logger error transport
    // throw new Error("Something went wrong");

    app.listen(port, () => {
      logger.info(`Listening on port ${port}`);
    });
  } catch (err) {
    logger.error(err);

    // console.error is asynchronous in nature
    // and we are exiting process hence we need to add some delay
    // for process to exit

    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

startServer();
