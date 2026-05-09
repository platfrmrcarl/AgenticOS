from pydantic import BaseModel
from typing import Optional

class SessionMessage(BaseModel):
    role: str
    content: str

class RunRequest(BaseModel):
    session_id: str
    message: str

class PhaseCompleteEvent(BaseModel):
    type: str = "phase_complete"
    phase: int
    data: dict
