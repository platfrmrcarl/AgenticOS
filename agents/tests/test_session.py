import pytest
from app.session import SessionStore
from app.models import SessionMessage

def test_create_session():
    store = SessionStore()
    session_id = store.create()
    assert session_id is not None
    assert isinstance(session_id, str)

def test_add_and_get_messages():
    store = SessionStore()
    session_id = store.create()
    store.add_message(session_id, {"role": "user", "content": "hello"})
    store.add_message(session_id, {"role": "assistant", "content": "hi"})
    messages = store.get_messages(session_id)
    assert len(messages) == 2
    assert messages[0]["role"] == "user"

def test_get_nonexistent_session_returns_none():
    store = SessionStore()
    result = store.get_messages("nonexistent")
    assert result is None

def test_delete_session():
    store = SessionStore()
    session_id = store.create()
    store.delete(session_id)
    assert store.get_messages(session_id) is None

def test_session_message_model():
    msg = SessionMessage(role="user", content="test")
    assert msg.role == "user"
    assert msg.content == "test"
