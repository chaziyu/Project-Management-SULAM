import uuid
from typing import Optional
from datetime import date
from enum import Enum
from sqlmodel import SQLModel, Field
from pydantic import field_validator

# ==========================================
# Enums (For Validation)
# ==========================================

class EventStatus(str, Enum):
    UPCOMING = "upcoming"
    COMPLETED = "completed"

class RegistrationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

# ==========================================
# Database Tables (Stored in DB)
# ==========================================

class Event(SQLModel, table=True):
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
    
    # FIXED: Removed sa_column_kwargs={"type_": "TEXT"}
    # Since we are storing URLs now, the default String type is perfect.
    imageUrl: Optional[str] = Field(default=None) 
    tasks: str = Field(default="")
    
    status: str = Field(default=EventStatus.UPCOMING)

class EventReadWithStats(Event):
    avgRating: float = 0.0
    feedbackCount: int = 0

class Registration(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    eventId: str = Field(index=True)
    userId: str = Field(index=True)
    status: str = Field(default=RegistrationStatus.PENDING)
    joinedAt: str
    userName: Optional[str] = "Student Volunteer"
    userAvatar: Optional[str] = None

class Feedback(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    eventId: str = Field(index=True)
    userId: str = Field(index=True)
    rating: int
    comment: str

class Bookmark(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    userId: str = Field(index=True)
    eventId: str = Field(index=True)

# ==========================================
# Request Models (Body payloads)
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