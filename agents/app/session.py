import uuid
from typing import Optional

class SessionStore:
    def __init__(self):
        self._sessions: dict[str, list[dict]] = {}

    def create(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = []
        return session_id

    def get_messages(self, session_id: str) -> Optional[list[dict]]:
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, message: dict) -> None:
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append(message)

    def delete(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

session_store = SessionStore()
