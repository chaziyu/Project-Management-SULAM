# ... (Keep existing imports)
# Make sure to import the new Request Models and Enums from models.py
from models import (
    Event, Registration, Feedback, Bookmark, 
    BookmarkRequest, JoinRequest, 
    UpdateEventStatusRequest, UpdateRegistrationStatusRequest, # <--- NEW IMPORTS
    RegistrationStatus # <--- NEW IMPORT
)

# ... (Keep startup/shutdown code)

# ==========================================
# Event Endpoints
# ==========================================

# ... (Keep get_events and create_event as they were)

@app.patch("/events/{event_id}", response_model=Event)
async def update_event_status(
    event_id: str, 
    payload: UpdateEventStatusRequest,  # <--- UPDATED: Validates 'upcoming' or 'completed'
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update event status (e.g. to 'completed')."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
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
        status=RegistrationStatus.PENDING # <--- Uses Enum default
    )
    
    # FIXED (Part A): Do NOT increment count here. 
    # Only confirmed users should take up a spot.
    
    session.add(new_reg)
    # session.add(event) <--- No longer needed since we didn't change event
    session.commit()
    session.refresh(new_reg)
    return new_reg

# ... (Keep get_event_registrations as is)

@app.patch("/registrations/{registration_id}")
async def update_registration_status(
    registration_id: str, 
    payload: UpdateRegistrationStatusRequest, # <--- UPDATED: Validates 'confirmed', 'rejected', etc.
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Approve or Reject a volunteer."""
    reg = session.get(Registration, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    event = session.get(Event, reg.eventId)
    if not event:
         raise HTTPException(status_code=404, detail="Associated event not found")
         
    if event.organizerId != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Only the organizer can manage volunteers")
    
    old_status = reg.status
    new_status = payload.status
    
    # FIXED (Part A): Only adjust count on Confirmed status
    # 1. If we are confirming them (and they weren't confirmed before), +1
    if new_status == RegistrationStatus.CONFIRMED and old_status != RegistrationStatus.CONFIRMED:
        event.currentVolunteers += 1
        session.add(event)
            
    # 2. If we are removing confirmation (rejecting or moving back to pending), -1
    elif old_status == RegistrationStatus.CONFIRMED and new_status != RegistrationStatus.CONFIRMED:
        event.currentVolunteers = max(0, event.currentVolunteers - 1)
        session.add(event)

    reg.status = new_status
    session.add(reg)
    session.commit()
    session.refresh(reg)
    return reg

# ... (Rest of the file remains the same)
