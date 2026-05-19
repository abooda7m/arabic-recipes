# وصفاتي العربية — Arabic Recipes Platform


---

## Overview

A full-stack web application for discovering and sharing authentic Arabic recipes from 18 Arab countries. Users can browse recipes by country, search, rate dishes, and contribute their own recipes after registration.

### Features
- Filter recipes by Arab country (18 countries)
- Real-time search
- Star rating system
- User authentication (register / login / logout)
- Add your own recipe (authenticated users only)
- Responsive design (mobile-first)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS (ES6 Classes) |
| UI Library | Bootstrap 5.3                       |
| Backend    | Node.js + Express.js                |
| Database   | MongoDB + Mongoose                  |
| Auth       | JWT (httpOnly cookies)              |
| Dev Tool   | Nodemon                             |

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/arabic-recipes.git
cd arabic-recipes

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your MONGODB_URI if needed

# 4. Seed the database (optional but recommended)
npm run seed

# 5. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

Open http://localhost:3000

### Seed Credentials
```
Email:    admin@recipes.com
Password: admin123
```

---

## Project Structure

```
arabic-recipes/
├── server.js              # Express server entry
├── .env                   # Environment variables
├── routes/
│   ├── auth.js            # POST /register, POST /login, POST /logout, GET /me
│   └── recipes.js         # GET/POST /recipes, POST /recipes/:id/rate
├── models/
│   ├── User.js            # Mongoose User schema
│   └── Recipe.js          # Mongoose Recipe schema
├── middleware/
│   └── auth.js            # JWT protect middleware
├── scripts/
│   └── seed.js            # Database seeder (8 Arab recipes)
└── public/                # Static frontend
    ├── index.html         # Landing page
    ├── recipes.html       # Browse all recipes
    ├── recipe-detail.html # Single recipe view
    ├── login.html
    ├── register.html
    ├── add-recipe.html
    ├── css/
    │   └── style.css      # Custom dark Arabic theme
    └── js/
        ├── ApiClient.js   # HTTP wrapper class
        ├── AuthManager.js # Auth state manager (extends EventTarget)
        ├── RecipeManager.js # Recipe data manager (extends EventTarget)
        ├── UIManager.js   # DOM rendering (static COUNTRIES array)
        └── app.js         # Page-level initialization
```

---

## REST API

| Method | Endpoint                  | Auth | Description            |
|--------|---------------------------|------|------------------------|
| POST   | /api/auth/register        | No   | Register new user      |
| POST   | /api/auth/login           | No   | Login                  |
| POST   | /api/auth/logout          | No   | Logout (clears cookie) |
| GET    | /api/auth/me              | Yes  | Get current user       |
| GET    | /api/recipes              | No   | List recipes (with filters) |
| GET    | /api/recipes/:id          | No   | Get single recipe      |
| POST   | /api/recipes              | Yes  | Create recipe          |
| POST   | /api/recipes/:id/rate     | Yes  | Rate a recipe (1–5)    |

### Query Params for GET /api/recipes
- `country=السعودية` — filter by country
- `search=كبسة` — text search on title
- `category=حلويات` — filter by category

---

## JavaScript Architecture

All frontend code uses **ES6 Classes** with **private fields** and **custom events** for inter-class communication:

```
ApiClient          ← raw HTTP wrapper (no inheritance)
    ↓
AuthManager        ← extends EventTarget → emits 'authChange'
RecipeManager      ← extends EventTarget → emits 'recipesChange'
    ↓
UIManager          ← listens to both managers, renders DOM
    ↓
app.js             ← page-level init, wires everything together
```

---

## Team Members

| Name | Student ID |
|------|------------|
|      |            |
|      |            |
|      |            |

---

## Future Work
- Image upload (Cloudinary integration)
- Comments system
- User profiles
- Recipe collections / favorites
- Arabic full-text search with Elasticsearch
