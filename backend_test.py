#!/usr/bin/env python3
"""
PLUENA Lab Backend API Test Suite
Tests all backend endpoints with authentication flow
"""

import requests
import json
import sys

# Base URL from .env
BASE_URL = "https://lab-pluena.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "geral@pluena.pt"
ADMIN_PASSWORD = "PluenaLab2025!"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    print(f"✅ PASS: {test_name}")
    test_results["passed"].append(test_name)

def log_fail(test_name, reason):
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")
    test_results["failed"].append(f"{test_name}: {reason}")

def log_warning(test_name, reason):
    print(f"⚠️  WARNING: {test_name}")
    print(f"   Reason: {reason}")
    test_results["warnings"].append(f"{test_name}: {reason}")

def print_summary():
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")
    print(f"⚠️  Warnings: {len(test_results['warnings'])}")
    
    if test_results["failed"]:
        print("\nFailed Tests:")
        for fail in test_results["failed"]:
            print(f"  - {fail}")
    
    if test_results["warnings"]:
        print("\nWarnings:")
        for warn in test_results["warnings"]:
            print(f"  - {warn}")
    
    print("="*80)
    return len(test_results["failed"]) == 0

# ============================================================================
# 1. AUTH TESTS
# ============================================================================

def test_auth_login_success():
    """Test successful login with correct credentials"""
    print("\n--- Testing: Auth Login (Success) ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Auth Login Success", f"Expected 200, got {response.status_code}")
            return None
        
        data = response.json()
        if "user" not in data:
            log_fail("Auth Login Success", "Response missing 'user' field")
            return None
        
        # Check cookie is set
        if "pl_token" not in session.cookies:
            log_fail("Auth Login Success", "pl_token cookie not set")
            return None
        
        # Verify no passwordHash in response
        if "passwordHash" in data.get("user", {}):
            log_fail("Auth Login Success", "passwordHash leaked in response")
            return None
        
        log_pass("Auth Login Success")
        return session
        
    except Exception as e:
        log_fail("Auth Login Success", str(e))
        return None

def test_auth_login_wrong_password():
    """Test login with wrong password returns 401"""
    print("\n--- Testing: Auth Login (Wrong Password) ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"},
            timeout=10
        )
        
        if response.status_code != 401:
            log_fail("Auth Login Wrong Password", f"Expected 401, got {response.status_code}")
            return
        
        data = response.json()
        if "error" not in data:
            log_warning("Auth Login Wrong Password", "Response missing 'error' field")
        
        log_pass("Auth Login Wrong Password")
        
    except Exception as e:
        log_fail("Auth Login Wrong Password", str(e))

def test_auth_me_without_cookie():
    """Test /auth/me without cookie returns 401"""
    print("\n--- Testing: Auth Me (Without Cookie) ---")
    session = requests.Session()
    
    try:
        response = session.get(f"{BASE_URL}/auth/me", timeout=10)
        
        if response.status_code != 401:
            log_fail("Auth Me Without Cookie", f"Expected 401, got {response.status_code}")
            return
        
        data = response.json()
        if "error" not in data:
            log_warning("Auth Me Without Cookie", "Response missing 'error' field")
        
        log_pass("Auth Me Without Cookie")
        
    except Exception as e:
        log_fail("Auth Me Without Cookie", str(e))

def test_auth_me_with_cookie(session):
    """Test /auth/me with valid cookie returns user"""
    print("\n--- Testing: Auth Me (With Cookie) ---")
    
    if not session:
        log_fail("Auth Me With Cookie", "No authenticated session available")
        return
    
    try:
        response = session.get(f"{BASE_URL}/auth/me", timeout=10)
        
        if response.status_code != 200:
            log_fail("Auth Me With Cookie", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        if "user" not in data:
            log_fail("Auth Me With Cookie", "Response missing 'user' field")
            return
        
        # Verify no passwordHash in response
        if "passwordHash" in data.get("user", {}):
            log_fail("Auth Me With Cookie", "passwordHash leaked in response")
            return
        
        log_pass("Auth Me With Cookie")
        
    except Exception as e:
        log_fail("Auth Me With Cookie", str(e))

def test_auth_logout(session):
    """Test logout clears cookie"""
    print("\n--- Testing: Auth Logout ---")
    
    if not session:
        log_fail("Auth Logout", "No authenticated session available")
        return
    
    try:
        response = session.post(f"{BASE_URL}/auth/logout", timeout=10)
        
        if response.status_code != 200:
            log_fail("Auth Logout", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        if not data.get("ok"):
            log_warning("Auth Logout", "Response missing 'ok: true'")
        
        # Verify subsequent /auth/me fails
        me_response = session.get(f"{BASE_URL}/auth/me", timeout=10)
        if me_response.status_code != 401:
            log_fail("Auth Logout", f"After logout, /auth/me should return 401, got {me_response.status_code}")
            return
        
        log_pass("Auth Logout")
        
    except Exception as e:
        log_fail("Auth Logout", str(e))

# ============================================================================
# 2. PROTECTED ENDPOINTS (401 without auth)
# ============================================================================

def test_protected_endpoints_without_auth():
    """Test that protected endpoints return 401 without cookie"""
    print("\n--- Testing: Protected Endpoints Without Auth ---")
    session = requests.Session()
    
    endpoints = [
        ("GET", "/leads"),
        ("GET", "/stats"),
        ("GET", "/leads/export")
    ]
    
    all_passed = True
    for method, path in endpoints:
        try:
            if method == "GET":
                response = session.get(f"{BASE_URL}{path}", timeout=10)
            
            if response.status_code != 401:
                log_fail(f"Protected {method} {path} Without Auth", f"Expected 401, got {response.status_code}")
                all_passed = False
            else:
                print(f"  ✓ {method} {path} correctly returns 401")
        except Exception as e:
            log_fail(f"Protected {method} {path} Without Auth", str(e))
            all_passed = False
    
    if all_passed:
        log_pass("Protected Endpoints Without Auth")

# ============================================================================
# 3. LEADS TESTS
# ============================================================================

def test_leads_create_success():
    """Test creating a lead with valid data"""
    print("\n--- Testing: Create Lead (Success) ---")
    session = requests.Session()
    
    lead_data = {
        "name": "João Silva",
        "email": "joao.silva@example.pt",
        "tool": "digital-check",
        "businessCategory": "Restauração",
        "score": 62,
        "topOpportunities": ["SEO", "Mobile", "Conversão"],
        "hiddenOpportunityCount": 8,
        "phone": "912345678"
    }
    
    try:
        response = session.post(
            f"{BASE_URL}/leads",
            json=lead_data,
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Create Lead Success", f"Expected 200, got {response.status_code}")
            return None
        
        data = response.json()
        if not data.get("ok"):
            log_fail("Create Lead Success", "Response missing 'ok: true'")
            return None
        
        if "id" not in data:
            log_fail("Create Lead Success", "Response missing 'id' field")
            return None
        
        if "priority" not in data:
            log_fail("Create Lead Success", "Response missing 'priority' field")
            return None
        
        priority = data.get("priority")
        if priority not in ["Hot", "Warm", "Standard"]:
            log_fail("Create Lead Success", f"Invalid priority: {priority}")
            return None
        
        log_pass("Create Lead Success")
        return data["id"]
        
    except Exception as e:
        log_fail("Create Lead Success", str(e))
        return None

def test_leads_create_missing_fields():
    """Test creating lead without required fields returns 400"""
    print("\n--- Testing: Create Lead (Missing Fields) ---")
    session = requests.Session()
    
    # Missing name
    try:
        response = session.post(
            f"{BASE_URL}/leads",
            json={"email": "test@example.pt"},
            timeout=10
        )
        
        if response.status_code != 400:
            log_fail("Create Lead Missing Name", f"Expected 400, got {response.status_code}")
        else:
            print("  ✓ Missing name correctly returns 400")
    except Exception as e:
        log_fail("Create Lead Missing Name", str(e))
    
    # Missing email
    try:
        response = session.post(
            f"{BASE_URL}/leads",
            json={"name": "Test User"},
            timeout=10
        )
        
        if response.status_code != 400:
            log_fail("Create Lead Missing Email", f"Expected 400, got {response.status_code}")
        else:
            print("  ✓ Missing email correctly returns 400")
            log_pass("Create Lead Missing Fields")
    except Exception as e:
        log_fail("Create Lead Missing Email", str(e))

def test_leads_create_booking_high_priority():
    """Test booking lead with high commission gets Hot/Warm priority"""
    print("\n--- Testing: Create Booking Lead (High Priority) ---")
    session = requests.Session()
    
    lead_data = {
        "name": "Maria Costa",
        "email": "maria.costa@hotel.pt",
        "tool": "booking",
        "phone": "913456789",
        "calculator": {
            "potentialCommissionReduction": 1500
        }
    }
    
    try:
        response = session.post(
            f"{BASE_URL}/leads",
            json=lead_data,
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Create Booking Lead High Priority", f"Expected 200, got {response.status_code}")
            return None
        
        data = response.json()
        priority = data.get("priority")
        
        if priority not in ["Hot", "Warm"]:
            log_warning("Create Booking Lead High Priority", f"Expected Hot/Warm, got {priority}")
        else:
            log_pass("Create Booking Lead High Priority")
        
        return data.get("id")
        
    except Exception as e:
        log_fail("Create Booking Lead High Priority", str(e))
        return None

def test_leads_list_with_auth(session, created_lead_ids):
    """Test listing leads with authentication"""
    print("\n--- Testing: List Leads (With Auth) ---")
    
    if not session:
        log_fail("List Leads With Auth", "No authenticated session available")
        return
    
    try:
        response = session.get(f"{BASE_URL}/leads", timeout=10)
        
        if response.status_code != 200:
            log_fail("List Leads With Auth", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        if not isinstance(data, list):
            log_fail("List Leads With Auth", "Response is not an array")
            return
        
        # Check for created leads
        lead_ids_in_response = [lead.get("id") for lead in data]
        for lead_id in created_lead_ids:
            if lead_id and lead_id not in lead_ids_in_response:
                log_warning("List Leads With Auth", f"Created lead {lead_id} not found in list")
        
        # Verify no _id (Mongo ObjectID) leaks
        for lead in data:
            if "_id" in lead:
                log_fail("List Leads With Auth", "Mongo _id leaked in response")
                return
        
        log_pass("List Leads With Auth")
        
    except Exception as e:
        log_fail("List Leads With Auth", str(e))

def test_lead_detail_and_update(session, lead_id):
    """Test getting and updating a specific lead"""
    print("\n--- Testing: Lead Detail and Update ---")
    
    if not session or not lead_id:
        log_fail("Lead Detail and Update", "No authenticated session or lead_id available")
        return
    
    # GET lead detail
    try:
        response = session.get(f"{BASE_URL}/leads/{lead_id}", timeout=10)
        
        if response.status_code != 200:
            log_fail("Get Lead Detail", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        if data.get("id") != lead_id:
            log_fail("Get Lead Detail", f"Lead ID mismatch")
            return
        
        print("  ✓ GET lead detail works")
        
    except Exception as e:
        log_fail("Get Lead Detail", str(e))
        return
    
    # PATCH lead status
    try:
        response = session.patch(
            f"{BASE_URL}/leads/{lead_id}",
            json={"status": "Contactado"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Update Lead Status", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        if data.get("status") != "Contactado":
            log_fail("Update Lead Status", "Status not updated")
            return
        
        print("  ✓ PATCH lead status works")
        
    except Exception as e:
        log_fail("Update Lead Status", str(e))
        return
    
    # PATCH add note
    try:
        response = session.patch(
            f"{BASE_URL}/leads/{lead_id}",
            json={"note": "Chamada feita, cliente interessado"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Add Lead Note", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        notes = data.get("notes", [])
        if not notes:
            log_fail("Add Lead Note", "Note not added")
            return
        
        # Check note has required fields
        last_note = notes[-1]
        if "text" not in last_note or "by" not in last_note:
            log_fail("Add Lead Note", "Note missing required fields")
            return
        
        if last_note.get("by") != ADMIN_EMAIL:
            log_fail("Add Lead Note", f"Note 'by' field incorrect: {last_note.get('by')}")
            return
        
        print("  ✓ PATCH add note works")
        log_pass("Lead Detail and Update")
        
    except Exception as e:
        log_fail("Add Lead Note", str(e))

# ============================================================================
# 4. WEBSITE CHECK TESTS
# ============================================================================

def test_website_check_reachable():
    """Test website check with reachable URL"""
    print("\n--- Testing: Website Check (Reachable) ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/website-check",
            json={"url": "https://example.com"},
            timeout=15
        )
        
        if response.status_code != 200:
            log_fail("Website Check Reachable", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        required_fields = ["reachable", "score", "opportunitiesTotal", "revealed", "lockedCategories", "checks"]
        for field in required_fields:
            if field not in data:
                log_fail("Website Check Reachable", f"Response missing '{field}' field")
                return
        
        if not data.get("reachable"):
            log_warning("Website Check Reachable", "example.com marked as unreachable")
        
        # Validate score is 0-100
        score = data.get("score")
        if not isinstance(score, (int, float)) or score < 0 or score > 100:
            log_fail("Website Check Reachable", f"Invalid score: {score}")
            return
        
        # Validate revealed is array with max 3 items
        revealed = data.get("revealed", [])
        if not isinstance(revealed, list):
            log_fail("Website Check Reachable", "revealed is not an array")
            return
        
        if len(revealed) > 3:
            log_fail("Website Check Reachable", f"revealed has {len(revealed)} items, max should be 3")
            return
        
        # Check revealed items have required fields
        for item in revealed:
            required_item_fields = ["category", "title", "impact", "explanation"]
            for field in required_item_fields:
                if field not in item:
                    log_fail("Website Check Reachable", f"revealed item missing '{field}' field")
                    return
        
        log_pass("Website Check Reachable")
        
    except Exception as e:
        log_fail("Website Check Reachable", str(e))

def test_website_check_unreachable():
    """Test website check with unreachable URL"""
    print("\n--- Testing: Website Check (Unreachable) ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/website-check",
            json={"url": "https://this-domain-should-not-exist-9327xyz.pt"},
            timeout=15
        )
        
        if response.status_code != 200:
            log_fail("Website Check Unreachable", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        if "reachable" not in data:
            log_fail("Website Check Unreachable", "Response missing 'reachable' field")
            return
        
        if data.get("reachable") != False:
            log_fail("Website Check Unreachable", "Unreachable domain marked as reachable")
            return
        
        log_pass("Website Check Unreachable")
        
    except Exception as e:
        log_fail("Website Check Unreachable", str(e))

def test_website_check_without_scheme():
    """Test website check with URL without scheme"""
    print("\n--- Testing: Website Check (Without Scheme) ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/website-check",
            json={"url": "example.com"},
            timeout=15
        )
        
        if response.status_code != 200:
            log_fail("Website Check Without Scheme", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        if "reachable" not in data:
            log_fail("Website Check Without Scheme", "Response missing 'reachable' field")
            return
        
        log_pass("Website Check Without Scheme")
        
    except Exception as e:
        log_fail("Website Check Without Scheme", str(e))

def test_website_check_missing_url():
    """Test website check without URL returns 400"""
    print("\n--- Testing: Website Check (Missing URL) ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/website-check",
            json={},
            timeout=10
        )
        
        if response.status_code != 400:
            log_fail("Website Check Missing URL", f"Expected 400, got {response.status_code}")
            return
        
        log_pass("Website Check Missing URL")
        
    except Exception as e:
        log_fail("Website Check Missing URL", str(e))

# ============================================================================
# 5. STATS TESTS
# ============================================================================

def test_stats_with_auth(session):
    """Test stats endpoint with authentication"""
    print("\n--- Testing: Stats (With Auth) ---")
    
    if not session:
        log_fail("Stats With Auth", "No authenticated session available")
        return
    
    try:
        response = session.get(f"{BASE_URL}/stats", timeout=10)
        
        if response.status_code != 200:
            log_fail("Stats With Auth", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        required_fields = ["total", "novos", "propostas", "clientes", "mostUsedTool", "conversionRate", "toolCounts"]
        for field in required_fields:
            if field not in data:
                log_fail("Stats With Auth", f"Response missing '{field}' field")
                return
        
        log_pass("Stats With Auth")
        
    except Exception as e:
        log_fail("Stats With Auth", str(e))

# ============================================================================
# 6. ANALYTICS TESTS
# ============================================================================

def test_analytics_event():
    """Test analytics event capture"""
    print("\n--- Testing: Analytics Event ---")
    session = requests.Session()
    
    try:
        response = session.post(
            f"{BASE_URL}/analytics",
            json={"event": "lab_opened", "meta": {"source": "test"}},
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Analytics Event", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        if not data.get("ok"):
            log_warning("Analytics Event", "Response missing 'ok: true'")
        
        log_pass("Analytics Event")
        
    except Exception as e:
        log_fail("Analytics Event", str(e))

# ============================================================================
# 7. CSV EXPORT TEST
# ============================================================================

def test_leads_export_csv(session):
    """Test CSV export with authentication"""
    print("\n--- Testing: Leads CSV Export ---")
    
    if not session:
        log_fail("Leads CSV Export", "No authenticated session available")
        return
    
    try:
        response = session.get(f"{BASE_URL}/leads/export", timeout=10)
        
        if response.status_code != 200:
            log_fail("Leads CSV Export", f"Expected 200, got {response.status_code}")
            return
        
        content_type = response.headers.get("Content-Type", "")
        if "text/csv" not in content_type:
            log_fail("Leads CSV Export", f"Expected text/csv, got {content_type}")
            return
        
        csv_content = response.text
        if not csv_content:
            log_fail("Leads CSV Export", "CSV content is empty")
            return
        
        # Check for header row
        lines = csv_content.split('\n')
        if not lines or not lines[0]:
            log_fail("Leads CSV Export", "CSV missing header row")
            return
        
        log_pass("Leads CSV Export")
        
    except Exception as e:
        log_fail("Leads CSV Export", str(e))

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    print("="*80)
    print("PLUENA Lab Backend API Test Suite")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print("="*80)
    
    # Track created lead IDs
    created_lead_ids = []
    
    # 1. AUTH TESTS
    print("\n" + "="*80)
    print("1. AUTHENTICATION TESTS")
    print("="*80)
    
    test_auth_login_wrong_password()
    test_auth_me_without_cookie()
    
    # Login and get authenticated session
    auth_session = test_auth_login_success()
    
    if auth_session:
        test_auth_me_with_cookie(auth_session)
    
    # 2. PROTECTED ENDPOINTS WITHOUT AUTH
    print("\n" + "="*80)
    print("2. PROTECTED ENDPOINTS (Without Auth)")
    print("="*80)
    
    test_protected_endpoints_without_auth()
    
    # 3. LEADS TESTS
    print("\n" + "="*80)
    print("3. LEADS TESTS")
    print("="*80)
    
    lead_id_1 = test_leads_create_success()
    if lead_id_1:
        created_lead_ids.append(lead_id_1)
    
    test_leads_create_missing_fields()
    
    lead_id_2 = test_leads_create_booking_high_priority()
    if lead_id_2:
        created_lead_ids.append(lead_id_2)
    
    # Need fresh auth session for protected endpoints
    fresh_session = test_auth_login_success()
    
    if fresh_session:
        test_leads_list_with_auth(fresh_session, created_lead_ids)
        
        if lead_id_1:
            test_lead_detail_and_update(fresh_session, lead_id_1)
        
        test_stats_with_auth(fresh_session)
        test_leads_export_csv(fresh_session)
    
    # 4. WEBSITE CHECK TESTS
    print("\n" + "="*80)
    print("4. WEBSITE CHECK TESTS")
    print("="*80)
    
    test_website_check_reachable()
    test_website_check_unreachable()
    test_website_check_without_scheme()
    test_website_check_missing_url()
    
    # 5. ANALYTICS TESTS
    print("\n" + "="*80)
    print("5. ANALYTICS TESTS")
    print("="*80)
    
    test_analytics_event()
    
    # 6. LOGOUT TEST
    print("\n" + "="*80)
    print("6. LOGOUT TEST")
    print("="*80)
    
    if fresh_session:
        test_auth_logout(fresh_session)
    
    # Print summary
    success = print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
