to start the server using "node server.js"

you need a .env file first which is located in the #resource channel
on the AEDI discord server

before commiting a push, you must remove the .env file otherwise it would fail

# Check what files are new/modified
git status

# Add all new files
git add .

# Or add specific files
git add services.html server.js

# Commit with a message
git commit -m "Add services page and route"

# Push to GitHub
git push origin main

