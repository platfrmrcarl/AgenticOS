import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models import AutoConfigureRequest
from app.auto_configure import stream_auto_configure

logger = logging.getLogger(__name__)

app = FastAPI(title="AgenticOS Agents Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/run/auto-configure")
async def run_auto_configure(request: AutoConfigureRequest):
    return StreamingResponse(
        stream_auto_configure(request.role, request.vision),
        media_type="text/event-stream",
    )
