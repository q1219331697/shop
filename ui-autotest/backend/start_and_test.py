import subprocess
import sys
import time
import urllib.request
import json

# Start Flask server in background
print("Starting Flask server...")
server_proc = subprocess.Popen(
    [sys.executable, "c:/Users/lzz/code/shop/ui-autotest/backend/app.py"],
    cwd="c:/Users/lzz/code/shop/ui-autotest/backend"
)

# Wait for server to be ready
print("Waiting for server to start...")
for i in range(15):
    time.sleep(1)
    try:
        r = urllib.request.urlopen("http://127.0.0.1:5321/api/stats")
        print("Server is ready!")
        break
    except:
        print(f"  Waiting... ({i+1}s)")
else:
    print("Server failed to start!")
    server_proc.terminate()
    sys.exit(1)

# Run tests
print("\n" + "="*50)
print("Running API tests...")
print("="*50)

test_proc = subprocess.Popen(
    [sys.executable, "c:/Users/lzz/code/shop/ui-autotest/backend/test_api.py"],
    cwd="c:/Users/lzz/code/shop/ui-autotest/backend"
)
test_proc.wait()

print("\nTests completed. Server is still running on http://localhost:5321")
print("Press Ctrl+C to stop the server when done.")
