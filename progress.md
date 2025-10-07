# 📸 AEDI Project Development Progress Tracker

**Project Goal:**  
A multimedia booking system that allows customers to book photography/videography services online, while enabling admins and staff to manage schedules, payments, and client interactions.

---

## ✅ System Requirements Progress

### 1. System Objectives
| Objective | Status | Notes |
|------------|---------|-------|
| Allow customers to book multimedia services | 🟡 In Progress | Backend routes partially set up. |
| Real-time scheduling (avoid double bookings) | 🔴 Not Started | Needs calendar & date validation logic. |
| Enable payments, confirmations, and notifications | 🔴 Not Started | Payment and email/SMS APIs to be integrated. |
| Admin & staff management tools | 🟡 In Progress | Admin HTML + CRUD functionality under development. |

---

### 2. Functional Requirements
| Module | Status | Notes |
|---------|---------|-------|
| **User Management** | 🟡 In Progress | Login & signup routes available. Needs profile page & password hashing. |
| **Service Catalog** | ✅ Done | Admin can add/view/edit/delete services. |
| **Booking Module** | 🟡 In Progress | Booking CRUD started, needs frontend integration. |
| **Payment Integration** | 🔴 Not Started | GCash/PayPal planned later. |
| **Notifications** | 🔴 Not Started | Email/SMS/WhatsApp API planned. |
| **Reports & Analytics** | 🔴 Not Started | Income & booking summary still to be added. |

---

### 3. Non-Functional Requirements
| Requirement | Status | Notes |
|--------------|---------|-------|
| Security | 🟡 In Progress | Basic validation exists; needs encryption & 2FA. |
| Scalability | 🟡 In Progress | Node.js + MySQL scalable; further optimization later. |
| Usability | 🟡 In Progress | Admin panel present; user UI pending. |
| Reliability | 🟡 In Progress | Server stable; no uptime monitoring yet. |
| Performance | 🟡 In Progress | Basic CRUD performance okay; optimize later. |

---

### 4. System Users (Actors)
| Actor | Status | Notes |
|--------|---------|-------|
| Customer | 🟡 In Progress | Login/Signup started; booking UI pending. |
| Admin | ✅ Done | Admin HTML + CRUD working. |
| Staff/Photographers | 🔴 Not Started | Module to assign jobs still missing. |
| System Automation | 🔴 Not Started | Needs booking validation + auto notifications. |

---

### 5. Use Case Flow Progress
| Step | Status | Notes |
|------|---------|-------|
| Customer logs in | 🟡 In Progress |
| Browse services | ✅ Done |
| Select date/time | 🔴 Not Started |
| Confirm & pay | 🔴 Not Started |
| Receive confirmation | 🔴 Not Started |
| Staff notified | 🔴 Not Started |
| Admin monitors reports | 🟡 In Progress |

---

### 6. Technologies
| Tech | Current | Planned |
|------|----------|----------|
| Frontend | Basic HTML/CSS/JS | React.js (future) |
| Backend | Node.js (Express) | ✅ Stable |
| Database | MySQL | ✅ Connected |
| Payment | None | 🔜 GCash / PayPal |
| Notification | None | 🔜 Email API (SMTP) / SMS API |

---

## 🧩 Next Steps
1. Finalize MySQL database tables (users, services, bookings).  
2. Complete user login/signup with password hashing.  
3. Build customer-facing booking page.  
4. Integrate calendar for real-time availability.  
5. Add payment and notification APIs.  
6. Create admin reports (income & bookings summary).  
7. Deploy system online (e.g., Render or Vercel).  

---

### 🗓️ Last Updated
**Date:** October 7, 2025  
**Developer:** @Ratseki  
