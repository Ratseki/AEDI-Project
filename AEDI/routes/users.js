// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);

  db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPass],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "User registered successfully" });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  });
});
