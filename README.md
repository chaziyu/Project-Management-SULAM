# 🎓 UMission: Project Management Volunteerism Platform

**UMission** is a cutting-edge, gamified volunteerism platform engineered to bridge the gap between student volunteers and club organizers. Built on a high-performance **FastAPI** backend and a reactive **React 19** frontend, it leverages **Clerk** for banking-grade identity management, **Supabase** for cloud object storage, and advanced row-level locking for real-time concurrency control.

## 📖 Table of Contents
- [🚀 Program Flow & User Journey](#-program-flow--user-journey)
- [🌟 Key Features](#-key-features)
- [🏗️ System Architecture](#-system-architecture)
- [⚙️ Technical Specifications](#-technical-specifications)
- [🗄️ Data Models (Schema)](#-data-models-schema)
- [📡 API Reference](#-api-reference)
- [⚡ Installation & Setup](#-installation--setup)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🚀 Program Flow & User Journey

### 1.1 The Setup (Initialization) 🔐
*   **User Opens App**: The Single Page Application (SPA) loads instantly via the Frontend.
*   **Security Check**: The app immediately establishes a secure handshake with **Clerk** to verify the user's identity.
*   **Digital ID**: If authentication is successful, the user is issued a secure JWT Token (Digital ID Badge).
*   **Mechanism**: This token is injected into the header of every subsequent HTTP request, ensuring the backend always knows exactly "Who is asking?" without needing repetitive logins.

### 1.2 The Student Flow (Volunteer) 🎒
*   **View Feed 📰**: The Student accesses the "Campus Bulletin." The Frontend queries the Backend for `GET /events?status=upcoming`. The Backend fetches optimized data from the Database and returns it.
*   **Bookmark (Save) 🔖**: Not ready to commit? The student clicks the Bookmark icon. The Backend persists this preference in the Bookmark table, populating the "Saved" tab for future access.
*   **Join Event 👆**: The Student clicks "Join".
    *   **System Action**: A request flies to the Backend: "Student ID 123 requests to join Event A."
    *   **Validation**: The Backend performs a dual-check:
        *   Has the user already joined?
        *   Are there seats remaining (Concurrency Check)?
    *   **Result**: If valid, a Registration record is created with status "Pending".
*   **Track Progress 🏆**: The Backend continuously aggregates completed events.
    *   **Gamification Trigger**: Upon completing their 5th event, the system logic automatically awards the "Super Star" Badge, visible on their Digital ID Profile.

### 1.3 The Organizer Flow (Admin) 👔
*   **Create Event 📝**: The Admin completes a rich form (Title, Date, Description, Volunteer Roles).
*   **Image Upload ☁️**:
    *   The Admin selects a banner image.
    *   The browser uploads it directly to **Supabase Storage** (bypassing the backend for speed).
    *   Supabase returns a public CDN link, which is then sent to the Backend to be stored with the event data.
*   **Manage Volunteers 🚦**: The Admin reviews the "Volunteer Requests" queue.
    *   **Action**: Admin clicks "Approve".
    *   **Safety Lock (Crucial)**: The Backend initiates a Row-Level Lock (`SELECT ... FOR UPDATE`) on the specific event row. It freezes the state for a millisecond to verify `Current Volunteers < Max Capacity`. Only if space exists is the student confirmed.
    *   **Update**: The `currentVolunteers` counter is atomically incremented by +1.
*   **Conclude Event 🏁**: Post-event, the Admin marks the status as "Completed". This action triggers the release of merit points and badges to all confirmed participants.

### 1.4 The "Engine Room" (Behind the Scenes) ⚙️
Every single user click triggers this high-speed data cycle:
1.  **Frontend (Interface)**: Captures the user interaction.
2.  **Axios (Messenger)**: Packages the payload + User Token and transmits it to the server.
3.  **FastAPI (The Brain)**: 
    *   **Verifies**: Decodes the JWT to ensure the user is authorized.
    *   **Logic**: Executes business rules (e.g., "Is the event full?", "Is the user an admin?").
4.  **Query**: Communicates with **PostgreSQL** to read/write data.
5.  **PostgreSQL (The Memory)**: Persists the records (Users, Events, Registrations).
6.  **Response**: The processed data travels back up the chain, and the Frontend updates the UI instantly (e.g., button changes from "Join" to "Pending").

---

## 🌟 Key Features

### For Students (Volunteers)
*   **🪪 Digital ID Dashboard**: A sleek, personalized dashboard featuring a dynamic student ID card that visualizes accumulated merit points, hours contributed, and mission history.
*   **🎮 Gamification System**: An automated rewards engine that unlocks badges based on milestones:
    *   🌱 **First Step**: 1 Mission
    *   🤝 **Helping Hand**: 3 Missions
    *   🌟 **Super Star**: 5 Missions
*   **🔍 Smart Event Feed**: Advanced filtering capabilities allowing discovery by Category (Education, Welfare, Environment) or Location (Residential Colleges, Faculties).
*   **⚡ One-Click Registration**: Frictionless joining experience with real-time status updates (Pending → Confirmed).
*   **🗣️ Feedback Loop**: A dedicated review system to rate events (1-5 stars) and provide anonymous feedback to organizers.
*   **🌍 Multilingual Support**: Accessible to everyone with instant translation powered by Google Translate (English, Malay, Chinese, Tamil).

### For Organizers (Club Admins)
*   **🛠️ Event Management**: Full CRUD (Create, Read, Update, Delete) capabilities for rich event details, including specific task lists and volunteer quotas.
*   **📊 Dashboard Analytics**:
    *   **Zero N+1 Performance**: The dashboard leverages server-side SQL aggregation to calculate average ratings and feedback counts in a single query, ensuring instant loading even with thousands of events.
*   **🛡️ Volunteer Command Center**: A centralized hub to review applicants, view profiles, and approve/reject volunteers with a single click.
*   **🔒 Concurrency Safety**: Built-in race condition protection prevents "overbooking" even if 100 students click "Join" at the exact same second.
*   **🖼️ Banner Uploads**: Drag-and-drop interface for uploading high-quality event posters via Supabase.

### General
*   **📖 Interactive User Guide**: A built-in modal guide tailored for both roles (Volunteer/Organizer) to help new users get started easily.

---

## 🏗️ System Architecture

The platform follows a robust **Client-Server Architecture** with a decoupled frontend and backend, ensuring scalability and maintainability.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7, TypeScript | Ultra-fast Single Page Application (SPA) for the user interface. |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework (Oxide engine) for responsive, modern design. |
| **Backend** | FastAPI (Python 3.10+) | High-performance ASGI web API handling business logic (Serverless-ready). |
| **Database** | PostgreSQL (via SQLModel) | Robust relational database for data integrity. |
| **Auth Provider** | Clerk | Banking-grade Identity Management (JWT issuance). |
| **Object Storage** | Supabase Storage | S3-compatible storage for event assets. |

---

## ⚙️ Technical Specifications

### 4.1 Frontend Specifications 🖥️
*   **Runtime**: React 19 + ReactDOM 19.
*   **Build Tool**: Vite 7 (for instant HMR and optimized bundling).
*   **Routing**: React Router DOM v7.
*   **HTTP Client**: Axios.
*   **Configuration**: Custom interceptors automatically inject the `Authorization: Bearer <token>` header into every request.
*   **State Management**: React Hooks (`useState`, `useEffect`) + **React Query** (for caching) + Custom Hooks (e.g., `useUserRole` for Role-Based Access Control).

### 4.2 Backend Specifications ☁️
*   **Framework**: FastAPI (Python).
*   **Server**: Uvicorn (ASGI).
*   **Security**:
    *   **JWT Validation**: Middleware dynamically fetches JWKS from `CLERK_ISSUER` to verify token signatures (RSA256) without storing sensitive credentials.
    *   **RBAC**: The `is_organizer` dependency strictly inspects the `unsafe_metadata` role payload to protect sensitive endpoints.
*   **Concurrency Control**:
    *   **Implementation**: `session.exec(select(Event)...with_for_update())`.
    *   **Effect**: This applies a strict database-level lock during the volunteer approval process, serializing transactions to guarantee quota integrity.

---

## 🗄️ Data Models (Schema)

### 5.1 Event Table 📅
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique Event ID |
| `title` | String | Not Null | Event Name |
| `organizerId` | String | Index | Clerk User ID of the creator |
| `maxVolunteers` | Int | Not Null | Capacity limit |
| `currentVolunteers` | Int | Default 0 | Counter for active confirmations |
| `status` | Enum | - | Lifecycle: `upcoming`, `completed` |

### 5.2 Registration Table 📝
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Registration ID |
| `eventId` | UUID | FK | Link to Event |
| `userId` | String | Index | Clerk User ID of volunteer |
| `status` | Enum | - | `pending`, `confirmed`, `rejected` |

### 5.3 Feedback Table 💬
| Field | Type | Description |
| :--- | :--- | :--- |
| `eventId` | UUID | The event being reviewed |
| `userId` | String | The ID of the reviewer |
| `rating` | Int | 1-5 Star rating |
| `comment` | String | Text-based feedback |

### 5.4 Bookmark Table 🔖
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `userId` | String | User who saved the event |
| `eventId` | UUID | The saved event ID |

---

## 📡 API Reference

### Events
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | List events (filters: `organizerId`, `status`). |
| `POST` | `/api/events` | Organizer | Create a new event. |
| `PUT` | `/api/events/{id}` | Organizer | Update event details. |
| `PATCH` | `/api/events/{id}` | Organizer | Update status (`upcoming` → `completed`). |

### Dashboard & Stats
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/organizers/dashboard` | Organizer | Get events with aggregated stats (Avg Rating, Count). |

### Users & Registrations
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/events/{id}/join` | User | Register for an event. |
| `PATCH` | `/api/registrations/{id}` | Organizer | Approve/Reject volunteer. |
| `GET` | `/api/users/{id}/registrations` | User | Get history and upcoming plans. |
| `GET` | `/api/users/{id}/badges` | User | Get earned gamification badges. |
| `GET` | `/api/users/{id}/bookmarks` | User | Get list of saved event IDs. |
| `POST` | `/api/users/{id}/bookmarks` | User | Toggle bookmark status. |

### Feedback
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/feedbacks` | User | Submit event review. |
| `GET` | `/api/feedbacks` | Public | Get reviews (filterable by event). |

---

## ⚡ Installation & Setup

### Prerequisites
*   🐍 **Python 3.10+**
*   📦 **Node.js 18+** & **npm**
*   🔑 **Clerk Account** (for Authentication)
*   🗄️ **Supabase Account** (for Database & Storage)

### Step 1: Backend Setup
```bash
# The backend is located in the api/ directory
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r api/requirements.txt

# Configure Environment Variables
# Create api/.env within the api/ folder
```

**Required `api/.env` variables:**
```ini
APP_NAME=UMission Backend
DEBUG=True
DATABASE_URL=postgresql://user:pass@host:5432/db  # Use Supabase Connection String
CLERK_ISSUER=https://your-clerk-issuer.clerk.accounts.dev
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Run Server:**
```bash
# Run from the root directory
uvicorn api.index:app --reload
# Server runs at http://localhost:8000
```

### Step 2: Frontend Setup
```bash
# The frontend is in the root directory
npm install

# Configure Environment Variables
# Create .env in the root folder
```

**Required `.env` variables:**
```ini
VITE_APP_NAME=UMission
VITE_API_URL=http://localhost:8000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

**Run Client:**
```bash
npm run dev
# App runs at http://localhost:5173
```

---

## 🔧 Troubleshooting

*   **❌ "Missing VITE_CLERK_PUBLISHABLE_KEY" Error**
    *   **Fix**: Ensure the `.env` file is in the **root** folder and restart the Vite server.

*   **🖼️ Images not uploading**
    *   **Fix**: Check Supabase Bucket policies. You must enable **Public** access for the `event-banners` bucket or set up RLS policies to allow authenticated uploads.

*   **🔌 Database Connection Failed**
    *   **Fix**: Verify `DATABASE_URL` in `api/.env`.
    *   *Important*: Ensure the connection string starts with `postgresql://` (required by SQLAlchemy), not `postgres://`.
    *   If using Supabase transaction pooler (port 6543), check if your password is correct.

*   **⛔ "Not Authorized" on Backend**
    *   **Fix**: Ensure Clerk Frontend and Backend keys belong to the **same Clerk instance**.
    *   Verify that `CLERK_ISSUER` in `api/.env` matches the `iss` claim in your JWT.

---

**Vercel App Link:** [https://umissionweb.vercel.app/](https://umissionweb.vercel.app/)
