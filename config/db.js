// config/db.js
const mysql = require("mysql2");
const mysqlPromise = require("mysql2/promise");

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking",
};

// original callback-style connection (keeps existing code working)
const db = mysql.createConnection(DB_CONFIG);
db.connect(err => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err);
    throw err;
  }
  console.log("✅ MySQL Connected");
});

// optional promise-based pool for newer async code
const dbPromise = mysqlPromise.createPool(DB_CONFIG);

module.exports = { db, dbPromise };
