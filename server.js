const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // change if needed
  password: "",       // change if needed
  database: "multimedia_booking"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

// Secret key for JWT
const JWT_SECRET = "supersecretkey";
