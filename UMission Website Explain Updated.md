# Simplify Process
## UMission App: Program Flow Snapshot

### 1. The Setup (Initialization)
*   **User Opens App**: The website loads (Frontend).
*   **Security Check**: The app immediately connects to **Clerk** to verify who the user is.
*   **Digital ID**: If logged in, the user gets a secure **Token (Digital ID Badge)**. This token is attached to every single click or request they make (via Axios Interceptors), so the system always knows "Who is asking?"

### 2. The Student Flow (Volunteer)
1.  **View Feed**: The Student opens the "Campus Bulletin."
    *   *System*: Frontend asks Backend for "Upcoming Events." Backend reads the Database and sends the list back.
2.  **Join Event**: The Student clicks "Join".
    *   *System*: A request travels to the Backend: "Student ID 123 wants to join Event A."
    *   *Check*: Backend confirms they haven't already joined (using a specific database check).
    *   *Result*: Backend saves the registration as "Pending" in the Database.
3.  **Track Progress**:
    *   *System*: The Backend counts completed events. 
    *   *Badges*:
        *   **1 Mission**: Unlocks "First Step" 🌱
        *   **3 Missions**: Unlocks "Helping Hand" 🤝
        *   **5 Missions**: Unlocks "Super Star" ⭐

### 3. The Organizer Flow (Admin)
1.  **Create Event**: The Admin fills out a form (Title, Date, Description).
    *   *Image Upload*: The banner image is sent directly from the browser to **Supabase Storage** (Cloud). The Cloud returns a public link.
    *   *Save Data*: The Admin submits the form + the image link to the Backend to be saved.
2.  **Dashboard Analytics (Optimized)**:
    *   *System*: When the Organizer views their dashboard, the Backend performs a **single smart calculation** (SQL Aggregation). It instantly looks at all 50+ events and calculates the average rating and feedback count for *all of them at once*. No waiting.
3.  **Manage Volunteers**: The Admin sees a list of pending students.
    *   *Action*: Admin clicks "Approve".
    *   *Safety Lock*: The Backend **locks the specific event row** (Row-Level Locking). It acts like a traffic light 🚦: only one approval can happen at a time. This prevents over-booking if two admins click "Approve" at the specific same millisecond.
    *   *Update*: The "Current Volunteers" count increases by +1.

---

### 4. The "Engine Room" (Behind the Scenes)
This cycle happens every time a user clicks a button:
1.  **Frontend (The Interface)**: Captures the click.
2.  **Axios (The Messenger)**: Carries the data + User Token to the server.
3.  **FastAPI (The Brain)**:
    *   Verifies the Token (Security).
    *   Runs the Logic (e.g., "Is the event full?").
    *   Talks to **PostgreSQL** (The Memory) to save/retrieve data.
4.  **Database**: Stores permanent records (Users, Events, Registrations).
5.  **Response**: The data travels back up the chain, and the Frontend updates the screen instantly.

---

## Features Breakdown

### 1. For Students (Volunteers)
*   **The Discovery Feed**:
    *   **Browse**: Scroll through a list of all upcoming campus events.
    *   **Filter & Search**: Filter by status (Upcoming/Completed) to find relevant activities.
*   **One-Click Join**:
    *   See an event you like? Click "Join Event".
    *   The request is sent immediately to the organizer for approval.
*   **Student ID Dashboard**:
    *   **Digital Profile**: A personal dashboard styled like a student ID card.
    *   **Merit Tracker**: Every time you complete an event, the system adds **5 Merit Stars** to your profile automatically.
    *   **Badges**: Dynamic achievement system (First Step, Helping Hand, Super Star).
    *   **Feedback**: After an event is finished, you can rate it (1-5 stars) and leave a comment.

### 2. For Organizers (Club Admins)
*   **Event Creation**:
    *   **Easy Setup**: Simple form for Title, Date, Location, quota, and description.
    *   **Banner Upload**: Upload custom posters directly to Supabase Cloud.
*   **Volunteer Control**:
    *   **Approve/Reject**: Review pending applicants.
    *   **Quota Safety**: The system strictly enforces the "Max Volunteers" limit using database locks.
*   **History & Reviews**:
    *   **Smart Stats**: View real-time average ratings and feedback counts without slow loading times.
    *   **Archive**: Conclude events to move them to the "History" tab.

### 3. Security & Access
*   **Secure Login**: Everyone logs in via **Clerk** (Email/Socials).
*   **Role Protection**: 
    *   **Volunteers** cannot access the Organizer Dashboard.
    *   **Organizers** verify their role via a special `is_organizer` check on the server.

---

## Technical Documentation & Specs

### 1. System Architecture
*   **Pattern**: Client-Server (Decoupled).
*   **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4.
*   **Backend**: FastAPI (Python 3.10+), SQLModel.
*   **Database**: PostgreSQL / SQLite (Dev).
*   **Auth**: Clerk (JWT).
*   **Storage**: Supabase.

### 2. Frontend Specifications
*   **Structure**:
    *   `src/pages/Event/components/`: Modular Modals (EventForm, Participants, Reviews).
    *   `src/services/api.ts`: Centralized API calls with Type Safety.
*   **Auth Flow**:
    *   `setupAxiosInterceptors` injects the specific user token into every request header.

### 3. Backend Specifications
*   **Security**: Dependency Injection `get_current_user` and `get_current_organizer` ensures every request is authorized.
*   **Concurrency**:
    *   `select(Event).with_for_update()` is used during the "Join" and "Approve" actions. This creates a queue at the database level so data never gets corrupted by speed.
*   **Optimization**:
    *   **Dashboard Stats**: Uses `func.avg()` and `func.count()` in a single SQL query to load organizer data instantly.

### 4. API Endpoints (Key Examples)
*   `GET /events`: List events (Public).
*   `POST /events/{id}/join`: Student joins an event (Protected + Locked).
*   `GET /organizers/dashboard`: **Optimized endpoint** returning events + pre-calculated stats.
*   `PATCH /registrations/{id}`: Approve/Reject volunteer (Protected + Locked).

---

### Environment Config
**Frontend (`.env`)**:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Backend (`.env`)**:
```bash
DATABASE_URL=postgresql://...
CLERK_ISSUER=https://...
```

---

_This document reflects the latest codebase version including performance optimizations and concurrency safety features._
