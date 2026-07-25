import requests
import pytest
import os
import datetime

BASE_URL = "http://localhost:3000/api"

# Pre-defined payloads corresponding to the chips
PRESETS = [
    {"label": "Active Craving", "text": "I am having a strong craving right now and need grounding", "expected_not": "HIGH"},
    {"label": "Severe Anxiety", "text": "I feel overwhelmed and anxious, help me calm down", "expected_not": "HIGH"},
    {"label": "Need a Script", "text": "I want to talk to my trusted contact, give me a short script", "expected_not": "HIGH"},
    {"label": "Immediate Crisis", "text": "I took something dangerous / I am in immediate physical danger", "expected_category": "HIGH"}
]

@pytest.fixture(scope="session")
def api_session():
    session = requests.Session()
    # Login as seeded patient
    res = session.post(f"{BASE_URL}/auth/login", json={
        "email": "patient@safespace.in",
        "password": "SafeSpace@2026"
    })
    assert res.status_code == 200, "Failed to login for tests"
    return session

@pytest.fixture(scope="session", autouse=True)
def setup_evidence_directory():
    os.makedirs("tests/evidence", exist_ok=True)
    with open("tests/evidence/test_report.md", "w") as f:
        f.write("# SafeSpace Pipeline Test Evidence\n\n")
        f.write(f"Generated at: {datetime.datetime.now().isoformat()}\n\n")

def append_evidence(text):
    with open("tests/evidence/test_report.md", "a") as f:
        f.write(text + "\n")

@pytest.mark.parametrize("preset", PRESETS)
def test_preset_classification(preset, api_session):
    append_evidence(f"## Testing Preset: {preset['label']}\n")
    append_evidence(f"**Payload:** `{preset['text']}`\n")
    
    response = api_session.post(f"{BASE_URL}/classify", json={"text": preset["text"]})
    assert response.status_code == 200, f"API returned {response.status_code}"
    
    data = response.json()
    category = data.get("category")
    
    append_evidence(f"**Classified Category:** `{category}`\n")
    
    if "expected_category" in preset:
        assert category == preset["expected_category"], f"Expected {preset['expected_category']}, got {category}"
        append_evidence(f"✅ Success: Correctly identified as {preset['expected_category']}.\n\n")
    elif "expected_not" in preset:
        assert category != preset["expected_not"], f"Did not expect {preset['expected_not']} for this prompt"
        append_evidence(f"✅ Success: Correctly identified as non-{preset['expected_not']} ({category}).\n\n")

def test_generation_for_low_medium(api_session):
    # Test generation for a LOW/MEDIUM prompt
    text = "I feel a bit stressed out today."
    append_evidence(f"## Testing Generation API\n")
    append_evidence(f"**Payload:** `{text}`\n")
    
    # Fake profile
    profile = {
        "name": "Test User",
        "trusted_contact": "Mom",
        "calming_phrase": "Breathe in, breathe out."
    }
    
    response = api_session.post(f"{BASE_URL}/generate", json={
        "text": text,
        "category": "LOW",
        "profile": profile
    })
    
    assert response.status_code == 200, f"API returned {response.status_code}"
    data = response.json()
    message = data.get("message")
    
    assert message is not None, "Message should not be null"
    assert len(message) > 0, "Message should not be empty"
    
    append_evidence(f"**Generated Message:**\n> {message}\n\n")
    append_evidence(f"✅ Success: Generated response received.\n\n")
