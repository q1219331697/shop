import urllib.request
import json

# Test stats API
try:
    r = urllib.request.urlopen("http://127.0.0.1:5321/api/stats")
    d = json.loads(r.read().decode())
    print("=== Stats API ===")
    print(json.dumps(d, indent=2, ensure_ascii=False))
except Exception as e:
    print("Stats API Error:", e)

# Test create case
try:
    import urllib.parse
    data = json.dumps({
        "name": "Login test case",
        "description": "Test user login flow",
        "module": "Login module",
        "priority": "P1",
        "status": "active",
        "steps": [
            {"action": "navigate", "target": "/login", "value": ""},
            {"action": "fill", "target": "#username", "value": "admin"},
            {"action": "fill", "target": "#password", "value": "123456"},
            {"action": "click", "target": "#submit-btn", "value": ""},
            {"action": "assert", "target": ".welcome", "value": "Welcome"}
        ],
        "pre_condition": "User exists",
        "expected_result": "Login success, show welcome",
        "tags": ["smoke", "login"]
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:5321/api/cases",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    r = urllib.request.urlopen(req)
    d = json.loads(r.read().decode())
    print("\n=== Create Case API ===")
    print(json.dumps(d, indent=2, ensure_ascii=False))
except Exception as e:
    print("Create Case API Error:", e)

# Test list cases
try:
    r = urllib.request.urlopen("http://127.0.0.1:5321/api/cases")
    d = json.loads(r.read().decode())
    print("\n=== List Cases API ===")
    print("Total:", d["data"]["total"])
    for c in d["data"]["list"]:
        print(" -", c["name"], "|", c["module"], "|", c["priority"], "|", c["status"])
except Exception as e:
    print("List Cases API Error:", e)

# Test create flow
try:
    case_id = None
    r = urllib.request.urlopen("http://127.0.0.1:5321/api/cases")
    d = json.loads(r.read().decode())
    if d["data"]["list"]:
        case_id = d["data"]["list"][0]["id"]

    data = json.dumps({
        "name": "Shopping flow",
        "description": "Complete shopping process",
        "status": "active",
        "steps": [
            {"step_name": "User login", "step_type": "case", "case_id": case_id or "", "wait_seconds": 1},
            {"step_name": "Browse products", "step_type": "action", "case_id": "", "wait_seconds": 2},
            {"step_name": "Add to cart", "step_type": "action", "case_id": "", "wait_seconds": 1},
            {"step_name": "Checkout", "step_type": "action", "case_id": "", "wait_seconds": 0}
        ]
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:5321/api/flows",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    r = urllib.request.urlopen(req)
    d = json.loads(r.read().decode())
    print("\n=== Create Flow API ===")
    print(json.dumps(d, indent=2, ensure_ascii=False))
except Exception as e:
    print("Create Flow API Error:", e)

# Test list flows
try:
    r = urllib.request.urlopen("http://127.0.0.1:5321/api/flows")
    d = json.loads(r.read().decode())
    print("\n=== List Flows API ===")
    print("Total:", d["data"]["total"])
    for f in d["data"]["list"]:
        print(" -", f["name"], "| steps:", len(f.get("steps", [])))
except Exception as e:
    print("List Flows API Error:", e)

# Test AI generate
try:
    data = json.dumps({
        "prompt": "Test user registration and email verification",
        "type": "case"
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:5321/api/ai/generate",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    r = urllib.request.urlopen(req)
    d = json.loads(r.read().decode())
    print("\n=== AI Generate API ===")
    print(json.dumps(d, indent=2, ensure_ascii=False))
except Exception as e:
    print("AI Generate API Error:", e)

print("\n=== All API tests completed! ===")
