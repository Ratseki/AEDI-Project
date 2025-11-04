const bcrypt = require("bcrypt");

const password = "password123"; // <-- replace with the password you want

bcrypt.hash(password, 10, (err, hash) => {
    if (err) return console.error(err);
    console.log("Your hashed password is:", hash);
});