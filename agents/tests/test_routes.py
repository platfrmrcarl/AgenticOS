def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_session(client):
    response = client.post("/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert isinstance(data["session_id"], str)
    assert len(data["session_id"]) > 0


def test_get_session_messages(client):
    create_resp = client.post("/sessions")
    session_id = create_resp.json()["session_id"]
    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["session_id"] == session_id
    assert body["messages"] == []


def test_get_nonexistent_session(client):
    response = client.get("/sessions/nonexistent-id-xyz")
    assert response.status_code == 404


def test_delete_session(client):
    create_resp = client.post("/sessions")
    session_id = create_resp.json()["session_id"]
    del_resp = client.delete(f"/sessions/{session_id}")
    assert del_resp.status_code == 200
    get_resp = client.get(f"/sessions/{session_id}")
    assert get_resp.status_code == 404
