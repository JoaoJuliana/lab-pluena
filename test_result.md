#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "PLUENA Lab — interactive digital business toolkit (PT-PT). 5 tools (Digital Check, Website Check, Direct Booking Calculator, Project Builder, Transform), lead generation stored in MongoDB, admin dashboard with email/password (JWT httpOnly cookie) auth, lead priority scoring, CSV export, website-check that fetches & analyzes a real URL."

backend:
  - task: "Admin email/password auth (login, me, logout) with JWT httpOnly cookie + admin seeding"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Admin seeded from ADMIN_EMAIL/ADMIN_PASSWORD env (geral@pluena.pt / PluenaLab2025!). POST /api/auth/login sets pl_token httpOnly cookie; GET /api/auth/me returns user via cookie; POST /api/auth/logout clears. Smoke-tested via curl: login+me works, wrong password should 401."
        -working: true
        -agent: "testing"
        -comment: "✅ All auth flows working correctly. Tested: (1) Login with correct creds returns 200, sets pl_token cookie, returns user without passwordHash; (2) Login with wrong password returns 401 with error; (3) /auth/me without cookie returns 401; (4) /auth/me with valid cookie returns 200 with user data (no passwordHash leak); (5) Logout returns 200, clears cookie; (6) After logout, /auth/me returns 401. Admin seeding working as expected."
  - task: "Leads CRUD — public create, protected list/get/patch (status+notes), CSV export"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/leads is public (requires name+email), computes internal priority Hot/Warm/Standard. GET /api/leads, GET /api/leads/:id, PATCH /api/leads/:id (status/note), GET /api/leads/export (CSV) all require valid cookie (401 otherwise). Verify protected endpoints reject unauthenticated requests."
        -working: true
        -agent: "testing"
        -comment: "✅ All leads CRUD operations working correctly. Tested: (1) POST /api/leads with valid data returns 200 with {ok, id, priority} where priority is Hot/Warm/Standard; (2) Missing name or email returns 400; (3) Booking lead with high commission (1500) correctly gets Hot/Warm priority; (4) GET /api/leads without auth returns 401; (5) GET /api/leads with auth returns 200 with array of leads, no Mongo _id leaks, UUIDs used; (6) GET /api/leads/:id returns lead detail; (7) PATCH /api/leads/:id with status updates correctly; (8) PATCH with note adds note with 'by' field containing admin email; (9) GET /api/leads/export returns text/csv with header row."
  - task: "Website Check — fetch real URL and analyze (score, opportunities, reachable flag)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/website-check {url}. Fetches HTML (9s timeout, follows redirects), analyzes HTTPS/title/meta/viewport/CTA/contact/h1/content/og/favicon/form -> returns {reachable, score, opportunitiesTotal, revealed[3], lockedCategories, checks}. On failure returns {reachable:false} (frontend falls back to guided). Test with a real site like https://example.com and an unreachable domain."
        -working: true
        -agent: "testing"
        -comment: "✅ Website check working correctly. Tested: (1) POST /api/website-check with https://example.com returns 200 with reachable:true, numeric score 0-100, opportunitiesTotal, revealed array (max 3 items with category/title/impact/explanation), lockedCategories array, checks object; (2) Unreachable domain returns 200 with reachable:false; (3) URL without scheme (example.com) works correctly (code prepends https); (4) Missing url returns 400. All response shapes validated."
  - task: "Stats aggregation for dashboard"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/stats (protected) returns total, novos, propostas, clientes, mostUsedTool, conversionRate, toolCounts."
        -working: true
        -agent: "testing"
        -comment: "✅ Stats endpoint working correctly. Tested: (1) GET /api/stats without auth returns 401; (2) GET /api/stats with auth returns 200 with all required fields: total, novos, propostas, clientes, mostUsedTool, conversionRate, toolCounts. All fields present and correctly typed."
  - task: "Analytics event capture (public best-effort)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/analytics {event, meta} stores to analytics_events, always returns ok."
        -working: true
        -agent: "testing"
        -comment: "✅ Analytics endpoint working correctly. Tested: POST /api/analytics with {event, meta} returns 200 with {ok:true}. Public endpoint, no auth required, best-effort storage."

frontend:
  - task: "Homepage + 5 interactive tool flows + lead capture + admin dashboard"
    implemented: true
    working: "NA"
    file: "app/page.js, app/admin/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Built and visually verified hero renders with correct PT-PT copy and premium design. Not yet functionally tested by automation (awaiting user go-ahead)."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Please test the PLUENA Lab backend (Next.js catch-all at /api). All routes are prefixed with /api. Admin credentials: email geral@pluena.pt, password PluenaLab2025! (seeded automatically). Focus: (1) auth flow with httpOnly cookie — login sets cookie, /auth/me works with cookie, logout clears, wrong creds 401; (2) protected endpoints (/api/leads GET, /api/leads/:id, PATCH, /api/leads/export, /api/stats) must return 401 without cookie and work with cookie; (3) public POST /api/leads creates a lead with name+email and returns priority; test that missing name/email -> 400; (4) POST /api/website-check with a reachable URL (e.g. https://example.com) returns reachable:true + score + revealed array, and an unreachable domain returns reachable:false; (5) PATCH lead status + add note works and persists; (6) CSV export returns text/csv. Use UUIDs (no Mongo ObjectIDs). Do not use curl-only if you can script; verify JSON shapes."
    -agent: "testing"
    -message: "✅ BACKEND TESTING COMPLETE - ALL TESTS PASSED (19/19). Comprehensive test suite executed covering: (1) Auth flow - login/logout/me with cookie management; (2) Protected endpoints - all correctly return 401 without auth; (3) Leads CRUD - create (public), list/get/patch/export (protected), priority scoring, note management; (4) Website check - reachable/unreachable URLs, URL normalization, validation; (5) Stats aggregation; (6) Analytics events; (7) CSV export. No critical issues found. All response shapes validated, no Mongo _id leaks, UUIDs used correctly, httpOnly cookie auth working as expected. Backend is production-ready."
