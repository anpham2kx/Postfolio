# 3D Book Portfolio

A stunning, interactive 3D book-style personal portfolio website built with **React**, **Vite**, and **Vanilla CSS**. This project showcases a creative layout mimicking a physical book that users can flip through, interact with, and read like an autobiography.

![3D Book Portfolio Demo](https://raw.githubusercontent.com/AnPham1820/3d-book-portfolio/main/public/demo-screenshot.png) *(Note: Replace with your actual demo image/gif path if available)*

---

## 📖 Table of Contents
1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [Installation & Setup](#-installation--setup)
5. [Environment Variables](#-environment-variables)
6. [Deployment](#-deployment)
7. [License](#-license)

---

## ✨ Features

- **Interactive 3D Book Animation**: Realistic book bending, spine shadow depth, page thickness, and smooth lacing paper effects using vanilla CSS 3D transforms (`preserve-3d`, `perspective`, `rotateY`).
- **Smooth Drag-to-Flip (Touch & Mouse)**: Drag pages with your mouse on desktop or swipe/drag with your finger on touch screens (mobile/tablet). Powered by a unified **Pointer Events API** with a smart threshold to decide whether to complete the turn or snap back.
- **Strict Click Navigation**: Prevents accidental flips by disabling standard clicks on the page body. Turning pages is restricted to:
  - Floating navigation arrows (sides/bottom).
  - Explicit action buttons (e.g., "Liên hệ" button on the Cover).
  - Interactive icons (e.g., "Return to Home" button on the Contact page).
  - Physical dragging.
- **Adaptive Responsive Design**: 
  - Scales proportionally across all screen sizes.
  - In vertical mobile views (**Portrait**), navigation arrows automatically reposition to the bottom for comfortable thumb reach.
  - In wide views (**Landscape**), navigation arrows dynamically float on the sides of the book.
- **Contact Form with EmailJS**: A fully working Contact page connected directly to **EmailJS** using background-safe environment variables (`.env`) for automated delivery.

---

## 🛠️ Tech Stack

- **Core**: React 18, Vite
- **Styling**: Vanilla CSS (Advanced 3D transitions & Keyframe animations)
- **Icons**: Lucide React
- **Email Delivery**: @emailjs/browser

---

## 📁 Project Structure

```text
3d-book-portfolio/
├── public/                  # Static assets (images, avatar, etc.)
├── src/
│   ├── components/
│   │   └── BrandIcons.jsx   # Custom SVG brand icons (Facebook, GitHub, etc.)
│   ├── pages/               # Segmented book page components
│   │   ├── Cover.jsx        # Page 0: Front Cover & Bio
│   │   ├── Hobbies.jsx      # Page 1: Hobbies & Passions
│   │   ├── Skills.jsx       # Page 2: Core Stack & Tech Skills
│   │   ├── Education.jsx    # Page 3: Education & Academic History
│   │   ├── Projects.jsx     # Page 4: Top Featured Projects
│   │   ├── Contact.jsx      # Page 5: Interactive EmailJS Contact Form
│   │   └── BackCover.jsx    # Page 6: Dark Aesthetic Back Cover
│   ├── App.jsx              # Main Controller & 3D Sheet coordinates
│   ├── App.css              # Typography, HSL Palette & 3D Book Layout
│   └── main.jsx
├── .env.example             # Template for Environment variables
├── .gitignore               # Configured to hide build files & secret credentials
├── package.json
└── README.md
```

---

## 🚀 Installation & Setup

To run this project locally, ensure you have **Node.js** installed, then follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AnPham1820/3d-book-portfolio.git
   cd 3d-book-portfolio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and fill in your EmailJS credentials (see below).

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at the local address displayed in the terminal (usually `http://localhost:5173/`).

---

## 🔑 Environment Variables

To activate the Contact Form email delivery, create a `.env` file in the root folder and add the following keys:

```env
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

*Note: `.gitignore` has been pre-configured to exclude `.env` files to prevent your private keys from being exposed online.*

---

## 📦 Deployment

To bundle the application for production hosting (GitHub Pages, Vercel, Netlify):

```bash
npm run build
```

This generates a optimized `/dist` folder containing the static HTML, compiled JS, and compressed CSS files ready to serve.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE). Feel free to customize and make it your own!
