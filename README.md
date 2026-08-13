# Taste Modelling Creators

A community platform for taste modellers — creators who curate food, fashion, music, art, lifestyle, travel, and beauty. Built with plain HTML/CSS/JS, Node.js (Express), and MySQL.

---

## Features

- **Register / Sign In** — secure accounts with bcrypt-hashed passwords
- **Creator Profiles** — bio, speciality domain, member history
- **Publish Insights** — share taste perspectives across 7 categories
- **Explore Feed** — browse and search all creator posts
- **Creators Directory** — discover and filter creators by domain
- **Session-based auth** — stays logged in across page visits

---

## Pages

| Page | URL | Description |
|---|---|---|
| Home | `/` | Landing page with latest posts and stats |
| Sign In | `/login.html` | Login with email + password |
| Register | `/register.html` | Create a new account |
| Dashboard | `/dashboard.html` | Your profile + post creation + community feed |
| Creators | `/creators.html` | Browse all creators |
| Explore | `/explore.html` | Search and filter all posts |

---

## Setup Instructions

### 1. Install Node.js
Download from https://nodejs.org (v18 or newer recommended).

### 2. Set up MySQL
- Install MySQL Server (https://dev.mysql.com/downloads/)
- Start MySQL and log in:
  ```bash
  mysql -u root -p
  ```
- Run the database schema:
  ```bash
  mysql -u root -p < database.sql
  ```

### 3. Configure Environment
Copy `.env.example` to `.env` and fill in your MySQL credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taste_modelling
SESSION_SECRET=pick_any_random_string_here
PORT=3000
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Server
```bash
npm start
```

Open your browser at: **http://localhost:3000**

---

## Project Structure

```
taste-modelling-creators/
├── public/
│   ├── index.html        ← Home page
│   ├── login.html        ← Sign in page
│   ├── register.html     ← Registration page
│   ├── dashboard.html    ← Creator dashboard

│   ├── creators.html     ← Creators directory
│   ├── explore.html      ← Browse all posts
│   ├── css/
│   │   └── style.css     ← All styles
│   └── js/
│       └── main.js       ← Shared JS utilities
├── server.js             ← Express server + API routes
├── database.sql          ← MySQL schema + sample data
├── package.json          ← Node.js dependencies
├── .env.example          ← Environment variable template
└── README.md             ← This file
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | No | Create account |
| POST | `/api/login` | No | Sign in |
| POST | `/api/logout` | Yes | Sign out |
| GET | `/api/me` | No | Check login status |
| GET | `/api/creators` | No | List all creators |
| GET | `/api/posts` | No | List all posts |
| POST | `/api/posts` | Yes | Create a post |
| GET | `/api/profile` | Yes | Get own profile |
| PUT | `/api/profile` | Yes | Update bio |

---

## Tech Stack

- **Frontend:** Plain HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js + Express 4
- **Database:** MySQL 8 via `mysql2`
- **Auth:** `express-session` + `bcrypt` for password hashing
- **Config:** `dotenv`
