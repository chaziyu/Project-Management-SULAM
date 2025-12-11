import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel

from config import settings
from database import engine, get_session
from auth import get_current_user
from models import (
    Event, Registration, Feedback, Bookmark, 
    BookmarkRequest, JoinRequest, UpdateStatusRequest
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
    session: Session = Depends(get_session)
):
    """Fetch all events, optionally filtered by organizer."""
    query = select(Event)
    if organizerId:
        query = query.where(Event.organizerId == organizerId)
    return session.exec(query).all()

@app.post("/events", response_model=Event)
async def create_event(
    event: Event, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Create a new event. Requires Auth."""
    # Ensure the creator is assigning the event to themselves
    if event.organizerId != current_user.get("sub"):
         raise HTTPException(status_code=403, detail="User ID mismatch")
    
    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@app.patch("/events/{event_id}", response_model=Event)
async def update_event_status(
    event_id: str, 
    payload: UpdateStatusRequest, # Used typed model instead of generic dict
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update event status (e.g. to 'completed')."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only the organizer can update
    if event.organizerId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    # Prevent joining on behalf of others
    if payload.userId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot join for another user")

    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check for existing registration
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
        status="pending"
    )
    
    # Pending users count towards capacity in this logic
    event.currentVolunteers += 1
    
    session.add(new_reg)
    session.add(event)
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
    payload: UpdateStatusRequest, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Approve or Reject a volunteer."""
    reg = session.get(Registration, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    old_status = reg.status
    new_status = payload.status
    reg.status = new_status
    
    # Update event headcount based on status change
    # If rejecting someone who was previously counted (pending/confirmed)
    if new_status == 'rejected' and old_status != 'rejected':
        event = session.get(Event, reg.eventId)
        if event:
            event.currentVolunteers = max(0, event.currentVolunteers - 1)
            session.add(event)
            
    # If re-approving someone who was rejected
    elif old_status == 'rejected' and new_status != 'rejected':
        event = session.get(Event, reg.eventId)
        if event:
            event.currentVolunteers += 1
            session.add(event)

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
    
    # Enrich response with Event details
    enriched_regs = []
    for r in regs:
        event = session.get(Event, r.eventId)
        
        # Check if user has already left feedback for this event
        has_feedback = session.exec(select(Feedback).where(
            Feedback.eventId == r.eventId, Feedback.userId == user_id
        )).first() is not None
        
        reg_dict = r.model_dump()
        if event:
            reg_dict["eventTitle"] = event.title
            reg_dict["eventDate"] = event.date
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
    
    # Return updated list of bookmark IDs
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