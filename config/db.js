// config/db.js
const mysql = require("mysql2");
const mysqlPromise = require("mysql2/promise");

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking",
};

// --- Callback-style connection (for legacy code) ---
const db = mysql.createConnection(DB_CONFIG);
db.connect(err => {
  if (err) {
    console.error("❌ MySQL Connection Error (config/db.js):", err);
    throw err;
  }
  console.log("✅ MySQL Connected (callback-style)");
});

// --- Promise-style pool (for async/await) ---
const dbPromise = mysqlPromise.createPool(DB_CONFIG);

// --- Export both ---
module.exports = {
  db,         // callback-style
  dbPromise,  // promise-style
};
