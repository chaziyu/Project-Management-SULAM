import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel

from config import settings
from database import engine, get_session
from auth import get_current_user, is_organizer
from models import (
    Event, Registration, Feedback, Bookmark, 
    BookmarkRequest, JoinRequest, 
    UpdateEventStatusRequest, UpdateRegistrationStatusRequest,
    RegistrationStatus
)


# --- Lifespan (Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Starting {settings.APP_NAME}...")
    # Automatically create tables if they don't exist
    SQLModel.metadata.create_all(engine)
    yield
    print("🛑 Shutting down...")

# --- App Setup ---
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Endpoints
# ==========================================

@app.get("/")
async def root():
    return {
        "message": "API is running!", 
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# --- EVENTS ---

@app.get("/events", response_model=List[Event])
async def get_events(
    organizerId: Optional[str] = None, 
    status: Optional[str] = None, 
    skip: int = 0,    # FIX 3: Added pagination skip
    limit: int = 100, # FIX 3: Added pagination limit (default 100 to prevent crash)
    session: Session = Depends(get_session)
):
    """Fetch all events, optionally filtered by organizer or status."""
    query = select(Event)
    if organizerId:
        query = query.where(Event.organizerId == organizerId)
    if status:
        query = query.where(Event.status == status)
    
    # FIX 3: Apply pagination
    query = query.offset(skip).limit(limit)
    
    return session.exec(query).all()

@app.post("/events", response_model=Event)
async def create_event(
    event: Event, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Create a new event. Requires Auth & Organizer Role."""
    
    # FIX 4: Security - Do not trust the body. Force ID from token.
    event.organizerId = current_user.get("sub")
    
    # 2. SECURITY: Enforce Organizer Role
    if not is_organizer(current_user):
        raise HTTPException(status_code=403, detail="Only organizers can create events")

    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@app.patch("/events/{event_id}", response_model=Event)
async def update_event_status(
    event_id: str, 
    payload: UpdateEventStatusRequest, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update event status (e.g. to 'completed')."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.organizerId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not is_organizer(current_user):
        raise HTTPException(status_code=403, detail="Only organizers can update events")

    event.status = payload.status
    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@app.post("/events/{event_id}/join")
async def join_event(
    event_id: str, 
    payload: JoinRequest, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Register a user for an event."""
    # FIX 4 (Partial): Ensure users can only join as themselves
    if payload.userId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot join for another user")

    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing_reg = session.exec(select(Registration).where(
        Registration.eventId == event_id, 
        Registration.userId == payload.userId
    )).first()
    
    if existing_reg:
        raise HTTPException(status_code=400, detail="Already joined")
    
    # Create registration
    new_reg = Registration(
        eventId=event_id,
        userId=payload.userId,
        joinedAt=datetime.date.today().isoformat(),
        userName=payload.userName or f"Student {payload.userId[-4:]}", 
        userAvatar=payload.userAvatar or "",
        status=RegistrationStatus.PENDING 
    )
    
    session.add(new_reg)
    session.commit()
    session.refresh(new_reg)
    return new_reg

# --- REGISTRATIONS ---

@app.get("/events/{event_id}/registrations")
async def get_event_registrations(
    event_id: str, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all participants for a specific event."""
    return session.exec(select(Registration).where(Registration.eventId == event_id)).all()

@app.patch("/registrations/{registration_id}")
async def update_registration_status(
    registration_id: str, 
    payload: UpdateRegistrationStatusRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Approve or Reject a volunteer."""
    reg = session.get(Registration, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # FIX 2: Race Condition Fix. 
    # We fetch the event using 'with_for_update()' to lock the row.
    # This prevents two requests from reading the same 'currentVolunteers' count simultaneously.
    event = session.exec(
        select(Event).where(Event.id == reg.eventId).with_for_update()
    ).one_or_none()

    if not event:
         raise HTTPException(status_code=404, detail="Associated event not found")
         
    if event.organizerId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Only the organizer can manage volunteers")
    
    old_status = reg.status
    new_status = payload.status
    
    # Logic to update count only when CONFIRMED and enforce MAX LIMIT
    if new_status == RegistrationStatus.CONFIRMED and old_status != RegistrationStatus.CONFIRMED:
        # Check if event is full before confirming
        if event.currentVolunteers >= event.maxVolunteers:
            raise HTTPException(status_code=400, detail="Event quota reached. Cannot confirm more volunteers.")
        
        # User is being confirmed -> Increment count
        event.currentVolunteers += 1
        session.add(event)
            
    elif old_status == RegistrationStatus.CONFIRMED and new_status != RegistrationStatus.CONFIRMED:
        # User was confirmed but is now rejected/pending -> Decrement count
        event.currentVolunteers = max(0, event.currentVolunteers - 1)
        session.add(event)

    reg.status = new_status
    session.add(reg)
    session.commit()
    session.refresh(reg)
    return reg

@app.get("/users/{user_id}/registrations")
async def get_user_registrations(
    user_id: str, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all events a user has joined."""
    if user_id != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Access denied")

    regs = session.exec(select(Registration).where(Registration.userId == user_id)).all()
    
    enriched_regs = []
    for r in regs:
        event = session.get(Event, r.eventId)
        
        has_feedback = session.exec(select(Feedback).where(
            Feedback.eventId == r.eventId, Feedback.userId == user_id
        )).first() is not None
        
        reg_dict = r.model_dump()
        if event:
            reg_dict["eventTitle"] = event.title
            reg_dict["eventDate"] = event.date.isoformat() if isinstance(event.date, datetime.date) else event.date
            reg_dict["eventStatus"] = event.status
        reg_dict["hasFeedback"] = has_feedback
        enriched_regs.append(reg_dict)
        
    return enriched_regs

# --- FEEDBACK & UTILS ---

@app.get("/events/{event_id}/rating")
async def get_event_rating(event_id: str, session: Session = Depends(get_session)):
    """Calculate average star rating for an event."""
    feedbacks = session.exec(select(Feedback).where(Feedback.eventId == event_id)).all()
    if not feedbacks: 
        return {"average": 0}
    avg = sum(f.rating for f in feedbacks) / len(feedbacks)
    return {"average": round(avg, 1)}

@app.get("/feedbacks")
async def get_feedbacks(
    userId: Optional[str] = None, 
    eventId: Optional[str] = None, 
    session: Session = Depends(get_session)
):
    """Filter feedbacks by user or event."""
    query = select(Feedback)
    if userId: query = query.where(Feedback.userId == userId)
    if eventId: query = query.where(Feedback.eventId == eventId)
    return session.exec(query).all()

@app.post("/feedbacks")
async def submit_feedback(
    feedback: Feedback, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    if feedback.userId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot submit feedback for another user")
    session.add(feedback)
    session.commit()
    return {"status": "success"}

@app.get("/users/{user_id}/bookmarks")
async def get_user_bookmarks(
    user_id: str, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    if user_id != current_user.get("sub"):
         raise HTTPException(status_code=403, detail="Access denied")
    
    bookmarks = session.exec(select(Bookmark).where(Bookmark.userId == user_id)).all()
    return [b.eventId for b in bookmarks]

@app.post("/users/{user_id}/bookmarks")
async def toggle_bookmark(
    user_id: str, 
    body: BookmarkRequest, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    if user_id != current_user.get("sub"):
         raise HTTPException(status_code=403, detail="Access denied")
         
    existing = session.exec(select(Bookmark).where(
        Bookmark.userId == user_id, Bookmark.eventId == body.eventId
    )).first()
    
    if existing:
        session.delete(existing)
    else:
        session.add(Bookmark(userId=user_id, eventId=body.eventId))
        
    session.commit()
    
    bookmarks = session.exec(select(Bookmark).where(Bookmark.userId == user_id)).all()
    return [b.eventId for b in bookmarks]

@app.get("/users/{user_id}/badges")
async def get_user_badges(user_id: str):
    """Static mock badges for demo purposes."""
    return [{
        "id": "1",
        "name": "First Step",
        "description": "Joined your first event",
        "icon": "🌱",
        "color": "bg-green-50 text-green-600",
        "earnedAt": "2023-10-01"
    }]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

# NEW: Endpoint to Edit Event Details
@app.put("/events/{event_id}", response_model=Event)
async def update_event_details(
    event_id: str,
    event_update: Event, # We accept the full Event object structure
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update event details (Title, Description, Image, etc)."""
    # 1. Fetch existing
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # 2. Authorization
    if db_event.organizerId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")
    
    # 3. Update fields (excluding ID and OrganizerID to be safe)
    db_event.title = event_update.title
    db_event.date = event_update.date
    db_event.location = event_update.location
    db_event.category = event_update.category
    db_event.maxVolunteers = event_update.maxVolunteers
    db_event.description = event_update.description
    db_event.tasks = event_update.tasks
    if event_update.imageUrl: # Only update if new image provided
        db_event.imageUrl = event_update.imageUrl
        
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

# ... (Keep update_event_status and join_event as is)

# ==========================================
# BADGES (Make Dynamic)
# ==========================================

# ... (Keep Registration and Feedback endpoints as is)

@app.get("/users/{user_id}/badges")
async def get_user_badges(
    user_id: str,
    session: Session = Depends(get_session)
):
    """
    Dynamically calculate badges based on completed events.
    Fixes 'Cannot add badge' by automating the process.
    """
    # 1. Count completed & confirmed registrations
    # Note: We need to join Registration with Event to check if the event is actually completed
    statement = (
        select(Registration)
        .join(Event)
        .where(Registration.userId == user_id)
        .where(Registration.status == RegistrationStatus.CONFIRMED)
        .where(Event.status == "completed")
    )
    completed_count = len(session.exec(statement).all())
    
    badges = []

    # Logic: Award badges based on count
    if completed_count >= 1:
        badges.append({
            "id": "badge_1",
            "name": "First Step",
            "description": "Completed your first volunteer mission",
            "icon": "🌱",
            "color": "bg-green-50 text-green-600",
            "earnedAt": "2023-01-01" # In a real app, you'd calculate date
        })
    
    if completed_count >= 3:
        badges.append({
            "id": "badge_3",
            "name": "Helping Hand",
            "description": "Completed 3 volunteer missions",
            "icon": "🤝",
            "color": "bg-blue-50 text-blue-600",
            "earnedAt": "2023-02-01"
        })

    if completed_count >= 5:
        badges.append({
            "id": "badge_5",
            "name": "Super Star",
            "description": "A true community hero (5+ missions)",
            "icon": "⭐",
            "color": "bg-yellow-50 text-yellow-600",
            "earnedAt": "2023-03-01"
        })

    returnSV = badges
    return returnSV
