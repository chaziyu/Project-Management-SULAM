# Project Management SULAM - Volunteerism Platform

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20SQLModel-blue)

A modern, high-performance volunteerism platform designed to connect students with community service opportunities. Built with a focus on **data integrity**, **concurrency safety**, and **real-time performance**, this application serves as a robust bridge between student volunteers and event organizers.

---

## 🏗️ System Architecture

The application follows a clean **Client-Server Architecture**:

*   **Frontend (Client)**: Built with **React 19** and **TypeScript**, utilizing **Vite** for fast bundling. It handles user interactions, displays real-time dashboards, and manages state using React Hooks.
*   **Backend (Server)**: Powered by **FastAPI** (Python), serving as a RESTful API. It handles business logic, database transactions, and data aggregation.
*   **Database**: Uses **SQLite** (for development) or **PostgreSQL** (production ready), managed via **SQLModel** (a combination of SQLAlchemy and Pydantic).
*   **Authentication**: Managed by **Clerk**, providing secure identity management (JWTs) which are verified by the backend dependency injection system.
*   **Storage**: **Supabase Storage** is used for hosting optimized event banners and user assets.

```mermaid
graph LR
    User[User (Browser)] <-->|HTTPS / JSON| Frontend[React App];
    Frontend <-->|REST API| Backend[FastAPI Server];
    Frontend <-->|Auth Tokens| Clerk[Clerk Auth];
    Backend <-->|SQL Queries| DB[(Database)];
    Backend <-->|Dependencies| Auth[Auth Layer];
```

---

## 🚀 Key Technical Features

### 1. Zero N+1 Query Performance
**Problem**: Displaying an organizer's dashboard typically requires fetching a list of events (1 query) and then fetching feedback counts/ratings for *each* event (N queries), leading to slow loading times as data grows.
**Solution**: We implemented **Server-Side SQL Aggregation**. The backend performs a single optimized query using `LEFT OUTER JOIN` and `GROUP BY`, calculating average ratings and feedback counts directly in the database engine.
*   **Result**: Dashboard loads in O(1) time regardless of the number of events.

### 2. Concurrency Control & Data Safety
**Problem**: In high-demand events, multiple users might click "Join" at the exact same millisecond. A standard "read-then-write" check could allow more users than the maximum capacity.
**Solution**: We utilize **Row-Level Locking** (`SELECT ... FOR UPDATE`) during the registration transaction.
*   **Mechanism**: The database locks the specific event row during a join request. Simultaneous requests wait their turn, ensuring the `currentVolunteers` count is always accurate and never exceeds `maxVolunteers`.

### 3. Data Integrity Constraints
*   **Database Rules**: A `UniqueConstraint` on `(userId, eventId)` exists at the schema level. It is physically impossible for a user to double-register, even if the application logic failed.

---

## 🔄 Core Workflows

### The Event Lifecycle
1.  **Creation**: An Organizer (Admin) creates an event via the `EventFormModal`.
    *   *System*: Validates permissions via `get_current_organizer` dependency.
2.  **Registration**: A Volunteer clicks "Join".
    *   *System*: Locks event row -> Checks quotas -> Creates `Registration` record (Status: Pending) -> Updates UI.
3.  **Approval**: Organizer reviews the "Volunteers" modal.
    *   *System*: Organizer clicks "Approve". System atomically updates `Registration.status` to `CONFIRMED` and increments `Event.currentVolunteers`.
4.  **Completion**: Event concludes. Organizer marks status as `COMPLETED`.
    *   *System*: Triggers logic allowing volunteers to earn badges.
5.  **Feedback**: Volunteers rate the event.
    *   *System*: Accepts rating (1-5) -> Updates aggregate stats shown on Organizer Dashboard.

---

## 📂 Database Schema

The data model is designed for strict relational integrity:

*   **User**: Managed externally by Clerk, mapped internally via `userId` strings.
*   **Event**: The core entity. Contains `maxVolunteers`, `currentVolunteers`, `status` (upcoming/completed).
*   **Registration**: A link table between User and Event. Stores the `status` (pending/confirmed/rejected) of the application.
*   **Feedback**: Stores ratings and comments. Linked to both User and Event.
*   **Bookmark**: Simple user-saved events for quick access.

---

## ⚡ Getting Started Guide

### Prerequisites
*   **Node.js 18+** (Frontend environment)
*   **Python 3.10+** (Backend environment)
*   **Git** (Version control)

### 1. Clone & Prepare
```bash
git clone https://github.com/Jayden-Yong/Project-Management-SULAM.git
cd Project-Management-SULAM
```

### 2. Backend Setup
The backend runs on port `8000`.

```powershell
cd backend

# Create Virtual Environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install Dependencies
pip install -r requirements.txt

# Environment Setup
Copy-Item .env.example .env
# [Action Required] Open .env and check settings (Default DEBUG=True)

# Run Server
python main.py
```
> The API will be available at `http://localhost:8000`. Documentation at `/docs`.

### 3. Frontend Setup
The frontend runs on port `5173`.

```powershell
cd frontend

# Install Dependencies
npm install

# Environment Setup
Copy-Item .env.example .env
# [Action Required] Open .env and add your VITE_CLERK_PUBLISHABLE_KEY

# Run Client
npm run dev
```

---

## 🧪 Verification & Testing

To verify the system is working correctly:

1.  **Health Check**: Visit `http://localhost:8000/health`. You should see `{"status": "healthy"}`.
2.  **Concurrency Test**: Open the app in two different browsers (incognito), creating two different user accounts. Try to join a "1 slot remaining" event at the same time. Only one should succeed.
3.  **Organizer Dashboard**: Create 5 events, add feedback to them via the database or UI, and verify the Dashboard loads instantly with correct averages.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1.  Fork the repo.
2.  Create a branch: `git checkout -b feature/new-thing`.
3.  Commit changes: `git commit -m "Added new thing"`.
4.  Push: `git push origin feature/new-thing`.
5.  Submit a Pull Request.

---

## 📄 License

This project is part of the SULAM academic initiative. All rights reserved.
