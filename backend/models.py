import uuid
from typing import Optional
from sqlmodel import SQLModel, Field

# ==========================================
# Database Tables (Stored in DB)
# ==========================================

class Event(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    date: str
    location: str
    category: str
    maxVolunteers: int
    currentVolunteers: int = Field(default=0)
    description: str
    organizerId: str
    organizerName: str
    imageUrl: Optional[str] = None
    status: str = Field(default="upcoming") # 'upcoming', 'completed'

class Registration(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    eventId: str = Field(index=True)
    userId: str = Field(index=True)
    status: str = Field(default="pending") # 'pending', 'confirmed', 'rejected'
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

class UpdateStatusRequest(SQLModel):
    """Used for patching status on Events or Registrations"""
    status: str