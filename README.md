# 🌍 Root Guide Backend

Root Guide is a robust tour management and booking platform. It connects passionate local guides with adventurous tourists, ensuring a seamless experience through secure payments and real-time booking management.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://root-guide-backend.vercel.app)
[![Backend Repo](https://img.shields.io/badge/GitHub-Backend-blue)](https://github.com/Sohelrana2815/root-guide-backend)

---

## 🚀 Features & Role-based Access

### 🔑 Authentication
- **Local Login/Register:** Secure authentication using JWT and Bcrypt.
- **Google OAuth:** One-click login with Google Passport strategy.

### 👤 User Roles
#### 👨‍💼 Admin
- **User Management:** Manage, block, or verify users (Guides/Tourists).
- **Tour Oversight:** Monitor and manage all created tours.
- **Booking Control:** Oversee all transactions and booking statuses.

#### 🗺️ Guide
- **Tour Management:** Create, edit, and manage tour packages.
- **Booking Workflow:** Accept or decline booking requests from guide.
- **Status Updates:** Update booking status (e.g., Confirmed, Completed).

#### 🎒 Tourist
- **Explore:** Search and filter tours or guides.
- **Booking:** Easy booking process for selected tours.
- **Secure Payment:** Integrated **SSLCommerz** for safe transactions after tour confirmation.

---

## 🛠️ Tech Stack

- **Framework:** [Express.js](https://expressjs.com/) (Node.js)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Authentication:** [Passport.js](https://www.passportjs.org/) & [JWT](https://jwt.io/)
- **File Upload:** [Multer](https://github.com/expressjs/multer) & [Cloudinary](https://cloudinary.com/)
- **Payment Gateway:** [SSLCommerz](https://www.sslcommerz.com/)

---

## 🏗️ Project Architecture


## ⚙️ Installation & Setup

Follow these steps to run the project locally:

### 1. Clone the repository
```bash
git clone [https://github.com/Sohelrana2815/root-guide-backend.git](https://github.com/Sohelrana2815/root-guide-backend.git)
cd root-guide-backend
```
### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

```bash
Create a .env file in the root directory and copy the contents from .env.example. Fill in your actual credentials.
cp .env.example .env
```
### 4. Running the Project
* Development Mode:
```bash
npm run dev
```
* Production build:
```bash
npm run build
npm start
```

## 📡 API Endpoints (Quick Overview)

The base URL for development is `http://localhost:3000/api` `Live: https://root-guide-backend.vercel.app/api`.

| Endpoint | Method | Role | Description |
| --- | --- | --- | --- |
| `/auth/register` | `POST` | Public | Register as a Guide or Tourist |
| `/tours` | `GET` | Public | Search and filter available tours |
| `/tours/create-tour` | `POST` | Guide | Create a new tour package |
| `/bookings` | `POST` | Tourist | Book a specific tour or guide |
| `/bookings/guide-bookings` | `GET` | Guide | View and manage received bookings |
| `/admin/all-bookings` | `GET` | Admin | Manage all system-wide bookings |

---

## 📦 Scripts Summary

Use the following commands to manage the project:

* **`npm run dev`**: Starts the server using `ts-node-dev` with hot-reload enabled for development.
* **`npm run build`**: Compiles the TypeScript source code into production-ready JavaScript in the `dist` folder.
* **`npm start`**: Runs the compiled production build from the `dist` directory.
* **`npm run lint`**: Runs ESLint to check for code quality and style issues.

---

## 💳 Payment Integration

This project integrates **SSLCommerz (Sandbox)** to handle secure financial transactions.

* **Workflow**: Once a tour is successfully completed, the booking/payment status is updated.
* **IPN Support**: Includes **Instant Payment Notification (IPN)** handling for real-time payment validation and automated status updates.

---

## 🖼️ Media Management

All media assets, including tour images and user profile pictures, are managed via **Cloudinary**.

* **Storage**: Utilizes `multer-storage-cloudinary` for direct uploads.
* **Optimization**: Ensures high-speed image delivery and automated resizing for better frontend performance.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
