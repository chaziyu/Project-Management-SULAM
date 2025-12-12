import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel, func

from config import settings
from database import engine, get_session
from auth import get_current_user, is_organizer
from models import (
    Event, Registration, Feedback, Bookmark, 
    BookmarkRequest, JoinRequest, 
    UpdateEventStatusRequest, UpdateRegistrationStatusRequest, UpdateFeedbackRequest,
    RegistrationStatus, EventReadWithStats
)

# ==========================================
# Application Lifecycle & Setup
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle startup and shutdown events.
    Creates tables on startup if they don't exist.
    """
    print(f"🚀 Starting {settings.APP_NAME}...", flush=True)
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ Database tables created/verified.", flush=True)
    except Exception as e:
        print(f"❌ Database Connection Failed: {e}", flush=True)
        # We don't raise here to allow the app to start and return 500s instead of crashing/timing out
        # This helps debugging on Render console
        
    yield
    print("🛑 Shutting down...", flush=True)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://umissionweb.vercel.app", 
        "https://volunteer-backend-u15e.onrender.com"
    ] + settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Core Dependencies
# ==========================================

async def get_current_organizer(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to ensure the user is an authorized organizer.
    """
    if not is_organizer(current_user):
        raise HTTPException(status_code=403, detail="Only organizers can perform this action")
    return current_user

# ==========================================
# Business Logic Helpers
# ==========================================

def calculate_badges_logic(completed_count: int) -> List[dict]:
    """
    Determines which badges a user has earned based on their completed mission count.
    """
    badges = []
    today = datetime.date.today().isoformat()
    
    if completed_count >= 1:
        badges.append({
            "id": "badge_1", "name": "First Step", "description": "Completed your first volunteer mission",
            "icon": "🌱", "color": "bg-green-50 text-green-600", "earnedAt": today
        })
    if completed_count >= 3:
        badges.append({
            "id": "badge_3", "name": "Helping Hand", "description": "Completed 3 volunteer missions",
            "icon": "🤝", "color": "bg-blue-50 text-blue-600", "earnedAt": today
        })
    if completed_count >= 5:
        badges.append({
            "id": "badge_5", "name": "Super Star", "description": "A true community hero (5+ missions)",
            "icon": "⭐", "color": "bg-yellow-50 text-yellow-600", "earnedAt": today
        })
    return badges

# ==========================================
# API Endpoints
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

# --- Event Management ---

@app.get("/events", response_model=List[Event])
async def get_events(
    organizerId: Optional[str] = None, 
    status: Optional[str] = None, 
    skip: int = 0,    
    limit: int = 100, 
    session: Session = Depends(get_session)
):
    """
    Fetch all events, with optional filtering and pagination.
    """
    query = select(Event)
    if organizerId:
        query = query.where(Event.organizerId == organizerId)
    if status:
        query = query.where(Event.status == status)
    
    query = query.offset(skip).limit(limit)
    return session.exec(query).all()

@app.post("/events", response_model=Event)
async def create_event(
    event: Event, 
    session: Session = Depends(get_session),
    current_organizer: dict = Depends(get_current_organizer) 
):
    """
    Create a new event. 
    Restricted to Organizers.
    """
    event.organizerId = current_organizer.get("sub")
    
    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@app.put("/events/{event_id}", response_model=Event)
async def update_event_details(
    event_id: str,
    event_update: Event, 
    session: Session = Depends(get_session),
    current_organizer: dict = Depends(get_current_organizer) 
):
    """
    Update event information (Title, Description, Image, etc).
    """
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if db_event.organizerId != current_organizer.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")
    
    # Update allowed fields
    db_event.title = event_update.title
    db_event.date = event_update.date
    db_event.location = event_update.location
    db_event.category = event_update.category
    db_event.maxVolunteers = event_update.maxVolunteers
    db_event.description = event_update.description
    db_event.tasks = event_update.tasks
    
    if event_update.imageUrl: 
        db_event.imageUrl = event_update.imageUrl
        
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@app.patch("/events/{event_id}", response_model=Event)
async def update_event_status(
    event_id: str, 
    payload: UpdateEventStatusRequest, 
    session: Session = Depends(get_session),
    current_organizer: dict = Depends(get_current_organizer)
):
    """
    Change event status (e.g. Upcoming -> Completed).
    """
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.organizerId != current_organizer.get("sub"):
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
    """
    Register a volunteer for an event.
    Handlers concurrency to prevent duplicate sign-ups or over-booking race conditions.
    """
    if payload.userId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot join for another user")

    # Lock row to prevent race conditions during high traffic
    statement = select(Event).where(Event.id == event_id).with_for_update()
    event = session.exec(statement).one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing_reg = session.exec(select(Registration).where(
        Registration.eventId == event_id, 
        Registration.userId == payload.userId
    )).first()
    
    if existing_reg:
        raise HTTPException(status_code=400, detail="Already joined")
    
    new_reg = Registration(
        eventId=event_id,
        userId=payload.userId,
        joinedAt=datetime.date.today().isoformat(),
        # Use provided name/avatar or fallback
        userName=payload.userName or f"Student {payload.userId[-4:]}", 
        userAvatar=payload.userAvatar or "",
        status=RegistrationStatus.PENDING 
    )
    
    session.add(new_reg)
    session.commit()
    session.refresh(new_reg)
    return new_reg

# --- Registration Management ---

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
    current_organizer: dict = Depends(get_current_organizer)
):
    """
    Approve or Reject a volunteer application.
    Updates the event's volunteer count atomically.
    """
    reg = session.get(Registration, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Lock event row to safely update 'currentVolunteers' count
    event = session.exec(
        select(Event).where(Event.id == reg.eventId).with_for_update()
    ).one_or_none()

    if not event:
         raise HTTPException(status_code=404, detail="Associated event not found")
         
    if event.organizerId != current_organizer.get("sub"):
        raise HTTPException(status_code=403, detail="Only the organizer can manage volunteers")
    
    old_status = reg.status
    new_status = payload.status
    
    # Logic: Only update count if changing TO/FROM 'Confirmed' status
    if new_status == RegistrationStatus.CONFIRMED and old_status != RegistrationStatus.CONFIRMED:
        # Check quota
        if event.currentVolunteers >= event.maxVolunteers:
            raise HTTPException(status_code=400, detail="Event quota reached.")
        event.currentVolunteers += 1
        session.add(event)
            
    elif old_status == RegistrationStatus.CONFIRMED and new_status != RegistrationStatus.CONFIRMED:
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
    """
    Get all activities a user has joined (past and upcoming).
    Enriches result with Event details and Feedback status.
    """
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

# --- Feedback & Ratings ---

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
    """Filter feedbacks by user ID or event ID."""
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
    """
    Submit a review for a completed event.
    """
    if feedback.userId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot submit feedback for another user")
    session.add(feedback)
    session.commit()
    return {"status": "success"}

@app.put("/feedbacks/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    payload: UpdateFeedbackRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing review.
    """
    db_feedback = session.get(Feedback, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    if db_feedback.userId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot edit another user's feedback")
        
    db_feedback.rating = payload.rating
    db_feedback.comment = payload.comment
    
    session.add(db_feedback)
    session.commit()
    return {"status": "updated"}

# --- Bookmarks & Badges ---

@app.get("/users/{user_id}/bookmarks")
async def get_user_bookmarks(
    user_id: str, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get list of event IDs bookmarked by the user."""
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
    """Toggle bookmark status for an event (Add/Remove)."""
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
async def get_user_badges(
    user_id: str,
    session: Session = Depends(get_session)
):
    """
    Dynamically calculate badges based on completed events.
    Returns a list of earned badge objects.
    """
    # Simply count how many confirmed registrations are for 'completed' events
    statement = (
        select(Registration)
        .join(Event, Registration.eventId == Event.id)
        .where(Registration.userId == user_id)
        .where(Registration.status == RegistrationStatus.CONFIRMED)
        .where(Event.status == "completed")
    )
    completed_count = len(session.exec(statement).all())
    
    return calculate_badges_logic(completed_count)

# --- Organizer Dashboard Extension ---

@app.get("/organizers/dashboard", response_model=List[EventReadWithStats])
async def get_organizer_dashboard_stats(
    limit: int = 100, 
    skip: int = 0,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_organizer)
):
    """
    Optimized endpoint for Organizer Dashboard.
    Fetches events AND pre-calculates rating/feedback count using SQL Aggregation.
    Eliminates N+1 query performance issues.
    """
    organizer_id = current_user.get("sub")
    
    # Left Outer Join ensures we still get events with 0 reviews
    query = (
        select(
            Event, 
            func.coalesce(func.avg(Feedback.rating), 0.0).label("avgRating"),
            func.count(Feedback.id).label("feedbackCount")
        )
        .outerjoin(Feedback, Event.id == Feedback.eventId)
        .where(Event.organizerId == organizer_id)
        .group_by(Event.id)
        .offset(skip)
        .limit(limit)
    )
    
    results = session.exec(query).all()
    
    dashboard_data = []
    for event, avg_rating, feedback_count in results:
        # Map tuple result back to our Schema
        event_with_stats = EventReadWithStats.model_validate(event)
        event_with_stats.avgRating = round(avg_rating, 1)
        event_with_stats.feedbackCount = feedback_count
        dashboard_data.append(event_with_stats)
        
    return dashboard_data

@app.get("/users/me/bookmarks/events", response_model=List[Event])
async def get_my_bookmarked_events(
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch full event details for all bookmarks of the current user.
    Uses SQL JOIN for efficiency.
    """
    user_id = current_user.get("sub")
    
    query = (
        select(Event)
        .join(Bookmark, Bookmark.eventId == Event.id)
        .where(Bookmark.userId == user_id)
    )
    
    return session.exec(query).all()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
