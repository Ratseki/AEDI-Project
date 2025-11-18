# Project Setup & Guide

**Prerequisites:**
* **Node.js** installed.
* **.env file:** Located in the **#resource** channel on the AEDI Discord server.
* **ngrok.exe:** You need the **AMD64 Windows version** placed inside the root `/AEDI` folder for payments to work.

---

## 🚀 HOW TO START THE WEBSITE

1.  Start **XAMPP** (Apache & MySQL).
2.  Make a new file named `.env` and paste the contents from Discord.
3.  Open Command Prompt or a separate terminal inside VS Code.
4.  Run Ngrok:

    ./ngrok http 3000

5.  Open a second terminal and start the server:

    node server.js


## 💾 Git Push Instructions

*⚠️ Note: Ensure `.env` is ignored (via .gitignore) before committing.*

# Check what files are new/modified
git status

# Add all new files
git add .

# Commit with a message
git commit -m "Fixed payments, profile, gallery, and webhooks"

# Push to GitHub (Use your specific branch to be safe)
git push origin fix-payment-and-profile