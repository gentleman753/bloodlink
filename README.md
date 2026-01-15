# Blood Link - Centralized Blood Bank Management Platform

A production-quality MERN stack application connecting Admins, Blood Banks, Hospitals, and Donors in a single system for efficient blood inventory tracking, requests, and donation management.

## Tech Stack

- **Frontend**: React.js + shadcn/ui + Socket.io-client
- **Backend**: Node.js + Express.js + Socket.io
- **Database**: MongoDB
- **Authentication**: JWT

## Features

### Real-time Updates & Notifications
- **Targeted Alerts**: Specific Blood Banks receive instant alerts when a Hospital requests blood from them.
- **Request Status**: Hospitals and Blood Banks receive instant updates on blood request status changes.
- **Live Chat**: Integrated chat feature for direct communication between Hospitals and Blood Banks regarding specific requests.
- **Nearby Donors**: Donors in the same city as the requesting hospital get real-time alerts.
- **Notification Center**: Persistent notification history with read/unread status for all users, accessible via the bell icon.

### Public
- Landing page with features overview
- Login and Registration for all roles

### Admin
- View and verify Blood Banks and Hospitals
- System-wide analytics dashboard
- User management

### Blood Bank
- **Dashboard Overview:** Metrics and Analytics Charts (Inventory, Request Status).
- **Inventory Management:** Add and manage blood units.
- **Request Management:** View, Approve, or Reject requests from hospitals (Real-time).
- **Communication:** Direct chat with hospitals.
- **Camp Management:** Organize donation camps.

### Hospital
- **Search:** Find blood banks by location and blood group.
- **Direct Request:** Request blood directly from search results.
- **Request Tracking:** Monitor the status of requests (Pending, Approved, Fulfilled) in real-time.
- **Communication:** Direct chat with blood banks.

### Donor
- **Dashboard:** View eligibility status.
- **Camp Discovery:** Search and register for upcoming donation camps.
- **History:** View past donations and download certificates.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local installation or Atlas)

### 1. Installation

Install dependencies for both backend and frontend:
```bash
npm run install-all
```

### 2. Environment Configuration

Create `.env` files for both backend and frontend.

**backend/.env**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blood-link
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Seeding (Optional)

To populate the database with test users (Admin, Hospital, Blood Bank, Donor) and sample data (customized for Indian context - Mumbai):
```bash
node backend/scripts/seedData.js
```

**Default Test Credentials:**
*   **Password:** `password123` (for all accounts)
*   **Admin:** `admin@bloodlink.com`
*   **Blood Bank:** `bb@bloodlink.com` (Lilavati Blood Bank, Mumbai)
*   **Hospital:** `hospital@bloodlink.com` (Nanavati Hospital, Mumbai)
*   **Donor:** `donor@bloodlink.com` (Rajesh Sharma, Mumbai)

### 4. Running the App

Start both servers concurrently:
```bash
npm run dev
```

*   **Frontend:** http://localhost:5173
*   **Backend:** http://localhost:5000

---

## Deployment

The project is configured for deployment on **Render** (Backend) and **Vercel** (Frontend).

### Backend (Render)
1.  Push code to GitHub.
2.  Create a new **Blueprint** on Render.
3.  Connect repository. Render will auto-detect `render.yaml`.
4.  Add Environment Variables in Render Dashboard (`MONGODB_URI`, `JWT_SECRET`).

### Frontend (Vercel)
1.  Import repository to Vercel.
2.  Framework Preset: **Vite**.
3.  Root Directory: `frontend`.
4.  Add Environment Variable: `VITE_API_URL` (Your Render Backend URL + `/api`).

---

## License

ISC
