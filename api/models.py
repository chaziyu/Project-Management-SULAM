import uuid
from datetime import date
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel, UniqueConstraint

# ==========================================
# Enums (Domain Constants)
# ==========================================

class EventStatus(str, Enum):
    """Status lifecycle of an event."""
    UPCOMING = "upcoming"
    COMPLETED = "completed"

class RegistrationStatus(str, Enum):
    """Status lifecycle of a volunteer registration."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

# ==========================================
# Domain Models (Database Tables)
# ==========================================

class Event(SQLModel, table=True):
    """
    Represents a volunteering opportunity/activity.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    date: date
    location: str
    category: str
    maxVolunteers: int
    currentVolunteers: int = Field(default=0)
    description: str
    organizerId: str
    organizerName: str
    
    # Image URL (stored as string, typically pointing to cloud storage or static path)
    imageUrl: Optional[str] = Field(default=None) 
    
    # Serialized JSON or newline-separated string of tasks
    tasks: str = Field(default="")
    
    status: str = Field(default=EventStatus.UPCOMING)

class EventReadWithStats(Event):
    """
    Extended Event model including aggregated statistics.
    Used for dashboards to show rating/feedback overview.
    """
    avgRating: float = 0.0
    feedbackCount: int = 0

class Registration(SQLModel, table=True):
    """
    Link table between User and Event.
    Tracks the application status of a volunteer.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    eventId: str = Field(index=True)
    userId: str = Field(index=True)
    status: str = Field(default=RegistrationStatus.PENDING)
    joinedAt: str
    
    # Snapshot of user details at time of registration
    userName: Optional[str] = "Student Volunteer"
    userAvatar: Optional[str] = None

    # Prevent duplicate registrations for same event
    __table_args__ = (UniqueConstraint("userId", "eventId", name="unique_registration"),)

class Feedback(SQLModel, table=True):
    """
    Review left by a volunteer after an event.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    eventId: str = Field(index=True)
    userId: str = Field(index=True)
    rating: int = Field(ge=1, le=5) # Enforce 1-5 rating
    comment: str

class Bookmark(SQLModel, table=True):
    """
    User's saved events for later viewing.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    userId: str = Field(index=True)
    eventId: str = Field(index=True)

# ==========================================
# Data Transfer Objects (DTOs)
# ==========================================

class BookmarkRequest(SQLModel):
    eventId: str

class JoinRequest(SQLModel):
    userId: str
    userName: Optional[str] = "Student"
    userAvatar: Optional[str] = ""

class UpdateEventStatusRequest(SQLModel):
    status: EventStatus

class UpdateRegistrationStatusRequest(SQLModel):
    status: RegistrationStatus

class UpdateFeedbackRequest(SQLModel):
    rating: int = Field(ge=1, le=5)
    comment: str