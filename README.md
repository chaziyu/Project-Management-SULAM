# UMission - Project Managment Volunteerism Platform

**UMission** is a modern, gamified volunteerism platform designed to bridge the gap between student volunteers and club organizers. Built with a high-performance **FastAPI** backend and a reactive **React 19** frontend, it features secure identity management via **Clerk**, real-time concurrency control, and cloud object storage via **Supabase**.

-----

## 🏗️ System Architecture

The application follows a clean **Client-Server Architecture**:

  * **Frontend (Client)**: Built with **React 19** and **TypeScript**, utilizing **Vite** for fast bundling and **Tailwind CSS v4** for styling. It manages user state, real-time feedback, and interactive dashboards.
  * **Backend (Server)**: Powered by **FastAPI** (Python 3.10+), serving as a RESTful API. It handles business logic, database transactions, and complex SQL aggregations.
  * **Database**: Uses **PostgreSQL**, managed via **SQLModel** (combining SQLAlchemy and Pydantic) for strictly typed interactions.
  * **Authentication**: Managed by **Clerk**, providing secure identity management (JWTs). The backend validates these tokens via a dependency injection system using JWKS.
  * **Storage**: **Supabase Storage** is used for hosting optimized event banners directly from the client.

-----

## 🚀 Key Features

### 1\. For Students (Volunteers)

  * **Digital ID Dashboard**: A personalized dashboard featuring a dynamic student ID card that tracks accumulated merit points and hours.
  * **Gamification System**: Automatically earn badges (e.g., "First Step", "Helping Hand", "Super Star") based on the number of completed missions (1, 3, 5).
  * **Smart Event Feed**: Browse upcoming events with filters for **Category** (Education, Environment, etc.) and **Location** (Residential Colleges, Faculties).
  * **Bookmarks**: Save interesting events to a personal "Saved" list for later review.
  * **One-Click Registration**: Seamlessly join events with real-time status tracking (`Pending` → `Confirmed`).
  * **Feedback Loop**: Rate and review events (1-5 stars) after completion to help clubs improve.

### 2\. For Organizers (Club Admins)

  * **Event Management**: Create, edit, and manage rich event details, including tasks, locations, and quotas.
  * **Dashboard Analytics**:
      * **Zero N+1 Query Performance**: The dashboard loads instantly using server-side SQL aggregation to calculate average ratings and feedback counts in a single query.
  * **Volunteer Command Center**: Review applicants, approve/reject volunteers, and view user profiles.
  * **Concurrency Safety**: Prevents over-subscription (Race Conditions) using database row-level locking (`SELECT ... FOR UPDATE`) when approving volunteers.
  * **Banner Uploads**: Drag-and-drop image uploads for event banners via Supabase.

-----

## 🛠️ Tech Stack

### Frontend (Client-Side)

  * **Framework**: React 19 + Vite 7
  * **Language**: TypeScript
  * **Styling**: Tailwind CSS v4 (Oxide engine) + Radix UI Primitives
  * **State/Network**: Axios (with Interceptors for Bearer Token injection)
  * **Authentication**: Clerk React SDK
  * **Icons**: Lucide React

### Backend (Server-Side)

  * **Framework**: FastAPI (Python 3.10+)
  * **Server**: Uvicorn (ASGI)
  * **ORM**: SQLModel (Pydantic + SQLAlchemy)
  * **Database**: PostgreSQL (via Supabase or Local)
  * **Security**: Python-Jose (JWT Verification with JWKS)

-----

## 📦 Prerequisites

Ensure you have the following installed:

  * **Python 3.10+**
  * **Node.js 18+** & **npm**
  * **Git**

You will also need accounts for:

1.  **Clerk**: For user authentication (Client ID & Issuer URL).
2.  **Supabase**: For the PostgreSQL database and Storage bucket (`event-banners`).

-----

## ⚡ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Jayden-Yong/Project-Management-SULAM.git
cd Project-Management-SULAM
```

### Step 2: Backend Setup

Navigate to the backend folder and set up the Python environment.

```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

**Configuration (`.env`):**
Create a file named `.env` in the `backend/` folder:

```ini
# App Config
APP_NAME=UMission Backend
DEBUG=True
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000

# Security (CORS) - Add your frontend URL here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Database (PostgreSQL Connection String from Supabase)
# Ensure it starts with postgresql://
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth (Clerk Issuer URL for JWT Verification)
# Found in Clerk Dashboard -> API Keys -> Advanced -> ISSUER
CLERK_ISSUER=https://your-clerk-issuer-url.clerk.accounts.dev
```

**Run the Server:**

```bash
python main.py
```

> The Backend will run at `http://localhost:8000`. API Docs at `/docs`.

### Step 3: Frontend Setup

Open a new terminal window and navigate to the frontend folder.

```bash
cd frontend
npm install
```

**Configuration (`.env`):**
Create a file named `.env` in the `frontend/` folder:

```ini
# Application
VITE_APP_NAME=UMission
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:8000

# Clerk Auth (Publishable Key)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Supabase Storage (For Image Uploads)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Run the Client:**

```bash
npm run dev
```

> The Frontend will run at `http://localhost:5173`.

-----

## 📂 Project Structure

```
├── backend/
│   ├── main.py             # API Entry Point & Route Definitions
│   ├── models.py           # Database Schemas (Event, Registration, Bookmark)
│   ├── auth.py             # JWT Verification Logic (Clerk)
│   ├── database.py         # SQLModel Engine Setup
│   ├── config.py           # Environment Configuration (Pydantic Settings)
│   └── requirements.txt    # Python Dependencies
│
└── frontend/
    ├── src/
    │   ├── pages/Event/    # Feature Views (EventFeed, Dashboards)
    │   ├── components/     # Reusable UI (Navbar, Modals)
    │   ├── services/       # API & Supabase Clients
    │   ├── hooks/          # Custom Logic (useUserRole)
    │   ├── types/          # TypeScript Interfaces
    │   ├── routes/         # Router Configuration
    │   └── App.tsx         # Root Component (Auth Interceptors)
    └── vite.config.js      # Vite Config (Tailwind v4)
```

-----

## 📡 API Reference

### Events

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/events` | Public | List all events (supports filtering by `organizerId`, `status`). |
| `POST` | `/events` | Organizer | Create a new event. |
| `PUT` | `/events/{id}` | Organizer | Update event details (Title, Date, Description). |
| `PATCH` | `/events/{id}` | Organizer | Update event status (e.g., `upcoming` → `completed`). |
| `GET` | `/events/{id}/rating` | Public | Get the average star rating for a specific event. |

### Organizers

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/organizers/dashboard` | Organizer | Get events with pre-aggregated stats (Avg Rating & Feedback Count) for the dashboard. |

### Registrations (Volunteers)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/events/{id}/join` | User | Register for an event. |
| `GET` | `/events/{id}/registrations` | User | Get list of participants for an event. |
| `PATCH` | `/registrations/{id}` | Organizer | Approve/Reject a volunteer (Updates event quotas). |
| `GET` | `/users/{id}/registrations` | User | Get a user's entire history and upcoming plans. |

### User Interaction

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/{id}/badges` | User | Get gamification badges based on completed missions. |
| `GET` | `/users/{id}/bookmarks` | User | Get list of bookmarked event IDs. |
| `POST` | `/users/{id}/bookmarks` | User | Toggle bookmark (Save/Unsave) for an event. |
| `GET` | `/users/me/bookmarks/events` | User | Get full details of all bookmarked events. |
| `POST` | `/feedbacks` | User | Submit an event review. |
| `GET` | `/feedbacks` | Public | Get reviews (filterable by user or event). |

-----

## ❓ Troubleshooting

**1. "Missing VITE\_CLERK\_PUBLISHABLE\_KEY" Error**

  * Ensure you created the `.env` file in the `frontend` folder, not the root.
  * Restart the Vite server (`npm run dev`) after creating the file.

**2. Images not uploading**

  * Check your Supabase Bucket policies. You must enable **Public** access for the `event-banners` bucket or set up proper RLS policies to allow authenticated users to upload.

**3. Database Connection Failed**

  * Verify your `DATABASE_URL` in `backend/.env`.
  * If using Supabase transaction pooler (port 6543), ensure you are using the correct password.
  * **Important:** Ensure the connection string starts with `postgresql://` (required by SQLAlchemy/FastAPI), not `postgres://`.

**4. "Not Authorized" on Backend**

  * Ensure your Clerk Frontend and Backend are using keys from the **same Clerk instance**.
  * Check that the `CLERK_ISSUER` in `backend/.env` matches the `iss` claim in your JWT.
  * **Critical:** In Clerk Dashboard → **JWT Templates**, ensure you have a template named `default` that includes `{{user.unsafe_metadata}}` in the claims. The backend relies on this to read the user's role.

-----

## 📄 License

This project is part of the Project Management group initiative at Universiti Malaya.

**Vercel App Link:** [https://umissionweb.vercel.app/](https://umissionweb.vercel.app/)
