# ☕ The Coffee Atelier - Boutique E-Commerce Ecosystem

A high-performance, full-stack **Next.js 15** application engineered for the modern specialty coffee connoisseur. The Coffee Atelier offers a premium digital experience to discover, purchase, and manage artisanal coffee collections. The project features a refined **Mochar-Inspired** architecture, utilizing a specialized dark palette of Deep Espresso, Warm Charcoal, and Cream, optimized for hardware efficiency and a high-end boutique user experience.

## 🚀 Live Links

* **Production Application (Vercel):** [https://the-coffee-atelier.vercel.app/](https://the-coffee-atelier.vercel.app/)
* **GitHub Repository:** [The-Coffee-Atelier](https://github.com/islamrakibul9274/The-Coffee-Atelier)

---

## ✨ Key Features

### ☕ Connoisseur Features

* **Boutique Discovery:** Advanced search and real-time filtering by roast profile, category, and flavor notes.
* **Premium Product Suite:** Detailed coffee listings featuring high-fidelity imagery, tasting notes, and brewing recommendations.
* **Seamless Checkout:** Fully integrated **Stripe** payment gateway with secure processing and real-time validation.
* **Order Tracking:** Personalized user profiles featuring detailed order history and live shipping status updates.

### 🛠️ Manager Dashboard Features

* **Inventory Control:** Dedicated suite for adding, editing, and managing coffee origins, stock levels, and product metadata.
* **Promotional Engine:** Real-time management of active banners and discount codes powered by **Firebase Realtime Database**.
* **Order Management:** Optimized interface for processing incoming orders, managing fulfillment status (Pending/Packaging/Shipping), and customer communication.
* **Live Notifications:** Integrated status update system notifying users instantly when their order progress changes.

### 🛡️ Admin "Command Center"

* **User Management:** Granular control over platform users, including role assignments (User, Manager, Admin).
* **Analytics Dashboard:** Real-time data visualization for platform sales, popular products, and customer engagement metrics.
* **Security & Stability:** Utilizes **Next.js Middleware** for Role-Based Access Control (RBAC) and Mongoose schema pre-registration to ensure architectural stability in serverless environments.
* **Webhook Reliability:** Robust **Stripe Webhook** pipeline to ensure database consistency for payment events and automatic order creation.

---

## 💻 Tech Stack

**Frontend & Framework:**

* **Next.js 15 (App Router):** Utilizing the latest React features and Server Components for peak performance.
* **Tailwind CSS:** Custom design system focusing on "Mochar Aesthetics" with precise dark-mode and transparency optimizations.
* **Framer Motion:** High-performance micro-interactions, boutique-style transitions, and staggered reveals.
* **Lucide React:** Consistent, professional iconography tailored for an elegant e-commerce interface.

**Backend & Database:**

* **MongoDB Atlas:** Scalable cloud database for user data, product catalogs, and order history.
* **Mongoose:** Structured ODM for complex schema relationships (Products/Categories) and efficient validation.
* **Firebase (RTDB & Auth):** Real-time layer for secure authentication and instant UI updates for promotional content.
* **Stripe API:** Industry-standard payment processing with custom webhook handlers for production reliability.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites

* Node.js (v18 or higher)
* MongoDB Atlas account
* Firebase Project and Stripe account

### 2. Clone the Repository

```bash
git clone https://github.com/rumel9274-6063/the-coffee-atelier.git
cd the-coffee-atelier

```

### 3. Install Dependencies

```bash
npm install

```

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Firebase (Client & Server)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key

```

### 5. Build and Start

```bash
# Optimized for 8GB RAM MacBook Air devices
npm run build
npm start

```

---

## ⚙️ Production Architecture

The Coffee Atelier is optimized for **Vercel** deployment with global edge distribution. To ensure 100% stability, it utilizes **Mongoose Schema Pre-registration** to prevent race conditions and **Dynamic Server Rendering** for authenticated administrative routes.

---

## 👤 Author

**Rakibul Islam Rumel**

* **GitHub:** [@islamrakibul9274](https://github.com/islamrakibul9274)
* **Project:** [The Coffee Atelier Production](https://the-coffee-atelier-gb22.vercel.app)

---
