from pydantic import BaseModel


class AutoConfigureRequest(BaseModel):
    user_id: str
    role: str
    vision: str
