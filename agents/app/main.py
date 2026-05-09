import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models import RunRequest
from app.session import session_store
from app.agent import stream_agent_response

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


@app.post("/sessions")
async def create_session():
    session_id = session_store.create()
    return {"session_id": session_id}


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    messages = session_store.get_messages(session_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "messages": messages}


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    session_store.delete(session_id)
    return {"deleted": session_id}


@app.post("/run/agentic-os-guide")
async def run_guide(request: RunRequest):
    messages = session_store.get_messages(request.session_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session_store.add_message(
        request.session_id, {"role": "user", "content": request.message}
    )
    all_messages = session_store.get_messages(request.session_id)

    async def generate():
        full_response = ""
        async for chunk in stream_agent_response(all_messages):
            yield chunk
            if chunk.startswith("data: ") and chunk.strip() != "data: [DONE]":
                try:
                    data = json.loads(chunk[6:])
                    if data.get("type") == "text":
                        full_response += data.get("content", "")
                except Exception:
                    pass
        if full_response:
            session_store.add_message(
                request.session_id,
                {"role": "assistant", "content": full_response},
            )

    return StreamingResponse(generate(), media_type="text/event-stream")
