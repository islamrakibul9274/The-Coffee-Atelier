# ☕ Obsidian Coffee Ordering Platform

A premium, real-time coffee ordering experience built with Next.js 14, MongoDB, Firebase, and Stripe.

## 🚀 Features

- **Authentication**: Google Sign-In via Firebase Auth + MongoDB user synchronization.
- **Role-Based Access**: Specialized dashboards for Customers, Managers, and Admins.
- **Real-Time Infrastructure**: Live banner updates, flash discounts with countdowns, and order tracking via Firebase Realtime DB.
- **E-Commerce Flow**: Advanced product grid, slide-out cart, and secure Stripe Checkout integration.
- **Admin Suite**: Full user management, banner scheduling, announcement broadcasting, and global order fulfillment.
- **Search & Discovery**: Fuse.js powered search modal for products and categories.
- **Engagement**: Star-rating review system and "Notify Me" for coming soon products.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Lucide React.
- **State Management**: Zustand.
- **Backend**: Next.js API Routes (Node.js).
- **Database**: MongoDB (Mongoose).
- **Real-Time/Auth**: Firebase (Client & Admin SDK).
- **Payments**: Stripe Checkout.
- **Images**: Cloudinary.

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd coffee-shop
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and populate it with your credentials:

```env
# MongoDB
MONGODB_URI="mongodb+srv://..."

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_DATABASE_URL="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase Admin SDK
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 4. Run the development server
```bash
npm run dev
```

## 💳 Testing Payments

Use the following Stripe test card details in demo mode:

| Detail | Value |
|--------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry Date | Any future date (e.g., `12/30`) |
| CVC | `123` |
| ZIP Code | Any valid ZIP (e.g., `90210`) |

## 🔐 Role Testing

- **Customer**: Default role on first sign-in.
- **Manager/Admin**: Use the Admin Dashboard (`/admin/users`) to promote a user to `manager` or manually update the `role` field in your MongoDB `users` collection.

## 📄 License

This project is for demonstration purposes under the Obsidian Coffee brand.
