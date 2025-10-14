const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected (config/db.js)");
});

module.exports = db;
