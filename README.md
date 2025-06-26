# 🛍️ Artisania - Celebrating Tunisian Craftsmanship

Artisania is a full-stack e-commerce platform designed to connect customers directly with talented Tunisian artisans. More than just a marketplace, Artisania aims to tell the story behind each handcrafted item, highlighting the artisans, their traditions, and the rich cultural heritage of Tunisia.

**Vision:** To develop a platform that not only sells products but fosters a connection between customers, artisans, and the traditions of Tunisia, offering a modern, smooth shopping experience while empowering local craftspeople.

---

## 🚀 Project Status

Currently in the **MVP (Minimum Viable Product) development phase**. The initial focus is on building the core web application within a rapid 6-day development sprint, leveraging AI-assisted "vibe coding" techniques.

**Initial Development Sprint Goal:** A functional web application demonstrating the core loop:
1.  Artisans can register and list their products.
2.  Customers can browse products, view artisan stories, and place orders (with "offline" payment arrangements for MVP).
3.  Admins can manage basic platform operations.

---

## 🛠️ Technology Stack

### Backend
*   **Framework:** Spring Boot (Java 17+)
*   **Database:** PostgreSQL
*   **Authentication:** Spring Security with JWT (JSON Web Tokens)
*   **Build Tool:** Maven

### Frontend (Web)
*   **Framework/Library:** ReactJS
*   **Build Tool/Bundler:** Vite
*   **API Communication:** Axios
*   **Styling:** (To be decided - likely Tailwind CSS or a similar utility-first/component library for rapid development, aiming for a custom "Traditional Tunisian, simple, minimalistic" aesthetic)

### AI-Assisted Development ("Vibe Coding")
*   **Primary IDE & Tools:** Cursor AI, Claude, other generative AI tools.
*   **Design & Branding Assistance:** Canva AI, Sora (for initial logo/branding elements), Google Stitch (for AI-generated wireframe inspiration).

---

## ✨ MVP Features (6-Day Web App Sprint)

### 1. User Roles & Authentication
*   **Customer:**
    *   Registration (Email/Password) & Login
    *   Browse products by category
    *   View product details
    *   View Artisan profiles & stories
    *   Add products to cart
    *   "Offline" Checkout (e.g., Cash on Delivery instructions)
    *   View own order history
*   **Artisan:**
    *   Registration (Email/Password - immediate activation for MVP)
    *   Login to Artisan Dashboard
    *   Manage own profile (bio/story, profile picture)
    *   Manage own products (CRUD operations: Add, Edit, Delete)
        *   Upload 1-3 images per product
        *   Set name, description, price, category, stock
    *   View orders for their products & update status (e.g., "Processing" -> "Shipped")
*   **Admin:**
    *   Pre-defined login credentials
    *   Admin Dashboard
    *   Manage Product Categories (CRUD)
    *   View all registered Artisans (with ability to manually deactivate/delete accounts for moderation)
    *   View all Products (with ability to flag products as "Featured" for homepage)
    *   View all Orders

### 2. Key Public-Facing Pages
*   **Homepage:**
    *   Dynamic Hero Section (Logo, Search (MVP: basic or deferred), Sign In, Register as Artist, Cart icon)
    *   Integrated Category Navigation
    *   "Our Story" / About Us section (with inspirational images)
    *   Featured Products Grid
*   **Category Page:** Grid display of products for a selected category.
*   **Product Detail Page:**
    *   Multiple product images
    *   Detailed product information (name, description, price)
    *   "Add to Cart" functionality
    *   Prominent Artisan Information Panel (linking to Artisan Profile)
*   **Artisan Profile Page:** Artisan's story/bio, profile picture, grid of their products.
*   **Shopping Cart Page**
*   **Checkout Page** (leading to "offline" payment confirmation)
*   **Order Confirmation Page**

### 3. Artisan Portal (Dashboard)
*   Product Management (CRUD for own products)
*   Profile Management
*   Order Management (for own orders)

### 4. Admin Portal (Dashboard)
*   Artisan Management (View, Deactivate/Delete)
*   Category Management (CRUD)
*   Product Management (View all, Feature products)
*   Order Management (View all)

### Excluded from MVP (for 6-Day Sprint):
*   Online Payment Gateway Integration
*   Advanced Search & Filtering
*   Customer Reviews & Ratings
*   Wishlists
*   Blog Section, Workshops & Events
*   Newsletter Signup
*   Mobile Application (planned for post-MVP)
*   Augmented Reality (AR) features

---

## 🎨 Design Philosophy
*   **Aesthetic:** Traditional Tunisian, simple, elegant, warm, and minimalistic.
*   **Color Palette:** Creamy off-white base, with accents of Terracotta, Olive, Sand, and Dark Brown. Subtle use of soft gradients.
*   **User Experience:** Intuitive, clean, and focused on showcasing products and artisan stories.

---

## 🚀 Getting Started (Development Setup - Day 0 Plan Summary)

### Prerequisites
*   Java JDK 17+
*   Maven
*   Node.js & npm
*   PostgreSQL (local instance or Docker)
*   Git

### Backend Setup (`Ecommerce-Backend`)
1.  Clone the base template repository (e.g., `SpringBoot-Reactjs-Ecommerce`).
2.  Configure PostgreSQL connection in `application.properties`.
3.  Update `pom.xml` for PostgreSQL driver.
4.  Create `artisaniadb` database and `artisania_user` in PostgreSQL.
5.  Run `mvn spring-boot:run`.

### Frontend Setup (`Ecommerce-Frontend`)
1.  `cd Ecommerce-Frontend`
2.  `npm install`
3.  Ensure backend API URL is correctly configured (usually `http://localhost:8080`).
4.  `npm run dev`.

### Day 0 Goals
*   Finalize Logo, Color Palette, Basic Wireframes.
*   Setup Git repository with `development` branch.
*   Successfully migrate backend to PostgreSQL and ensure it runs.
*   Ensure frontend runs and can (attempt to) connect to the backend.
*   Seed initial categories into the database.
*   Setup DB Client (pgAdmin/DBeaver) and API Client (Postman/Insomnia).

---

## 貢献 (Contributing - Placeholder)
*(Details on how to contribute if this were an open project - can be removed for a private/solo project)*

---

## 📜 License (Placeholder)
*(Specify a license if applicable, e.g., MIT, or state "Proprietary")*