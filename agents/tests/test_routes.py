def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_auto_configure_rejects_missing_fields(client):
    response = client.post("/run/auto-configure", json={"role": "founder"})
    assert response.status_code == 422


def test_auto_configure_accepts_valid_payload_shape(client):
    response = client.post(
        "/run/auto-configure",
        json={"user_id": "u_1", "role": "x", "vision": "y"},
    )
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        assert response.headers.get("content-type", "").startswith("text/event-stream")
