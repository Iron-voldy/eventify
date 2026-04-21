# Eventify - Modern Event Management Mobile App

A full-stack, premium, dark-themed futuristic Event Management mobile application.

## Tech Stack
- **Frontend**: React Native, Expo, React Navigation, Axios, Expo Secure Store, Expo Image Picker, Reanimated
- **Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, bcryptjs, Multer
- **Design System**: Custom dark futuristic aesthetic with glassmorphism elements, electric blue/violet accents, and smooth typography.

## Features
- **Two User Roles**: Admin and Normal User
- **Admin Dashboard**: Manage statistics, users, events, bookings, reviews, complaints, and promo codes.
- **User Experience**: Explore events, search/filter, book tickets, apply promo codes, submit reviews and support tickets.
- **Security**: JWT-based authentication, password hashing, role-based protection routes.
- **Database**: Full CRUD for 7 MongoDB Collections, including venues linked to events.
- **Media**: Profile and event image uploading using Multer and Expo Image Picker.

## Setup Instructions

### 1. Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Variables:
   - A `.env` file is already created. It defaults to a local MongoDB instance (`mongodb://127.0.0.1:27017/event_management`) for ease of testing. 
   - *Optional:* You can replace `MONGO_URI` with your own MongoDB Atlas connection string.
4. Start the server (development mode):
   ```bash
   npm run dev
   ```
   *The server should now be running on `http://localhost:5000`*

### 2. Seeding the Database

We've provided a seed script with Sri Lankan sample users, venues, events, bookings, reviews, complaints, and promo codes so you can test the app immediately without manual data entry.

1. Ensure your MongoDB is running.
2. Run the seed script:
   ```bash
   cd backend
   node seed/seed.js
   ```
   *Note: This will clear the existing database and insert fresh sample data.*

**Test Accounts:**
- **Admin**: `admin@eventify.com` / `admin123`
- **User 1**: `hasindut1@gmail.com` / `password123`
- **User 2**: `thisara.fernando@gmail.com` / `password123`

### 3. Frontend Setup

1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. API Configuration:
   - Open `frontend/src/constants/api.js`.
   - The `DEV_API_URL` uses `http://10.0.2.2:5000` for Android Emulators and `http://localhost:5000` for iOS Simulators.
   - **IMPORTANT:** If you are testing on a *physical device* via Expo Go, you MUST change `DEV_API_URL` to your computer's local Wi-Fi IP address (e.g., `http://192.168.1.5:5000`).
4. Start the Expo app:
   ```bash
   npx expo start
   ```
5. Press `a` to open in Android Emulator, `i` to open in iOS Simulator, or scan the QR code with the Expo Go app on your physical device.

## Application Architecture

### Backend Modules
- **Auth**: Login, Register, Admin Login, Token generation/validation.
- **Users**: Admin CRUD, User profile view/edit, Profile picture upload.
- **Events**: Public listing, Search/Filter, Admin CRUD, Event banner upload.
- **Bookings**: Create booking (with promo validation and seat deduction), Cancel booking (with seat restoration), View histories.
- **Reviews**: Create (only if user booked the event), View all, Admin moderation (hide/approve).
- **Complaints**: User creates and views support tickets, Admin responds and resolves.
- **Promos**: Admin CRUD, validation logic against subtotal.
- **Dashboard**: Aggregate financial and engagement statistics for the Admin console.

### Frontend App Flow
- **Splash & Onboarding**: Animated welcome and introduction flow.
- **Authentication**: JWT stored securely using `expo-secure-store`. User object globally available via React Context.
- **User Navigation (Bottom Tabs)**: Home, Explore (Events), Bookings, Profile. Additional nested screens inside Stacks (Event Details, Checkout).
- **Admin Navigation (Bottom Tabs)**: Dashboard, Manage Events, Manage Users, with secondary quick actions for Reviews, Promos, and Support Tickets.

---
