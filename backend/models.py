from sqlalchemy import Column, Integer, Boolean, DateTime
from datetime import datetime
from database import Base

class MotionEvent(Base):
    __tablename__ = "motion_events"

    id        = Column(Integer, primary_key=True, index=True)
    motion    = Column(Boolean)
    device    = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)