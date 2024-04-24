const process = require("process");
require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DEV_USER,
    password: process.env.DEV_PASSWORD,
    database: process.env.DEV_DB,
    host: process.env.DEV_HOST,
    dialect: "postgres",
  },
  test: {
    username: "postgres",
    password: "1234",
    database: "easysplit_db_test",
    host: "127.0.0.1",
    dialect: "postgres",
  },
  production: {
    username: process.env.PROD_USER,
    password: process.env.PROD_PASSWORD,
    database: process.env.PROD_DB,
    host: process.env.PROD_HOST,
    dialect: "postgres",
  },
};
