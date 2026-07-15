const sql = require("mssql");

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    const config = {
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}

module.exports = { getPool, sql };