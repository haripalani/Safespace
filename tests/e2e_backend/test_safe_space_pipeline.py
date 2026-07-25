import requests
import pytest
import os
import datetime
import time

BASE_URL = "http://localhost:3000/api"

# Pre-defined payloads for the 6 requested test cases (excluding empty string which is handled separately)
PRESETS = [
    {"label": "Gibberish", "text": "asdfghjklqwerty", "expected_not": "HIGH"},
    {"label": "Manglish craving", "text": "Enikku bhayankara craving varunnu", "expected_category": "MEDIUM"},
    {"label": "Hinglish craving", "text": "Mujhe bohot strong craving ho rahi hai", "expected_category": "MEDIUM"},
    {"label": "Explicit crisis", "text": "I want to overdose, I am in danger", "expected_category": "HIGH"},
    {"label": "Quick Exit", "text": "I need to exit quickly", "expected_not": "HIGH"}
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

@pytest.fixture(scope="session")
def caregiver_session():
    session = requests.Session()
    # Login as seeded caregiver
    res = session.post(f"{BASE_URL}/auth/login", json={
        "email": "caregiver@safespace.in",
        "password": "SafeSpace@2026"
    })
    assert res.status_code == 200, "Failed to login as caregiver for tests"
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
    
    response = api_session.post(f"{BASE_URL}/triage/", json={"text": preset["text"]})
    assert response.status_code == 200, f"API returned {response.status_code}"
    
    data = response.json()
    category = data.get("category")
    
    append_evidence(f"**Classified Category:** `{category}`\n")
    
    if data.get("bypassed_genai"):
        pytest.skip("Rate limited by Gemini API, fallback triggered.")

    if "expected_category" in preset:
        assert category == preset["expected_category"], f"Expected {preset['expected_category']}, got {category}"
        append_evidence(f"✅ Success: Correctly identified as {preset['expected_category']}.\n\n")
    elif "expected_not" in preset:
        assert category != preset["expected_not"], f"Did not expect {preset['expected_not']} for this prompt"
        append_evidence(f"✅ Success: Correctly identified as non-{preset['expected_not']} ({category}).\n\n")

def test_empty_string(api_session):
    append_evidence(f"## Testing Empty String\n")
    append_evidence(f"**Payload:** `\"\"`\n")
    response = api_session.post(f"{BASE_URL}/triage/", json={"text": ""})
    assert response.status_code == 400, f"Expected 400 for empty string, got {response.status_code}"
    append_evidence(f"✅ Success: API correctly returned HTTP 400 for empty string.\n\n")

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

def test_caregiver_alert_delayed_escrow(api_session, caregiver_session):
    append_evidence(f"## Testing Caregiver Time-Delayed Care-Escrow Alert\n")
    
    # 1. Clear any existing alerts
    caregiver_session.post(f"{BASE_URL}/caregiver/clear-alert")
    
    # 2. Patient sends a MEDIUM trigger
    trigger_text = "I am having a strong craving right now and need grounding"
    append_evidence(f"**Patient Payload:** `{trigger_text}`\n")
    response = api_session.post(f"{BASE_URL}/triage/", json={"text": trigger_text})
    assert response.status_code == 200
    
    data = response.json()
    if data.get("bypassed_genai"):
        pytest.skip("Rate limited by Gemini API, fallback triggered.")
        
    assert data.get("category") == "MEDIUM", "Expected MEDIUM category"
    
    # 3. Check alert status immediately (should NOT be pending yet)
    alert_response_early = caregiver_session.get(f"{BASE_URL}/caregiver/alert-status")
    alert_data_early = alert_response_early.json()
    assert alert_data_early.get("pendingAlert") is False, "Expected no immediate alert"
    
    # 4. Timer expires, patient triggers alert endpoint manually
    alert_trigger_response = api_session.post(f"{BASE_URL}/caregiver/alert", json={"text": "Patient safety timer expired"})
    assert alert_trigger_response.status_code == 200
    
    # 5. Caregiver checks alert status again
    alert_response = caregiver_session.get(f"{BASE_URL}/caregiver/alert-status")
    assert alert_response.status_code == 200
    
    alert_data = alert_response.json()
    append_evidence(f"**Caregiver Alert Status:** `{alert_data}`\n")
    
    assert alert_data.get("pendingAlert") is True, "Expected pendingAlert to be True after timer expiration"
    
    append_evidence(f"✅ Success: Caregiver successfully received the delayed alert.\n\n")
