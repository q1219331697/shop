import subprocess
import sys
import time
import os

# Kill existing python processes on port 5321
print("Killing old processes...")
os.system("netstat -ano | findstr :5321 | findstr LISTENING")

# Start server
print("Starting server...")
proc = subprocess.Popen(
    [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.py")],
    cwd=os.path.dirname(os.path.abspath(__file__))
)

# Wait and test
for i in range(10):
    time.sleep(1)
    try:
        import urllib.request
        r = urllib.request.urlopen("http://127.0.0.1:5321/")
        if r.status == 200:
            print("Server is ready! Visit http://localhost:5321")
            break
    except:
        print(f"Waiting... ({i+1}s)")
else:
    print("Server may not be ready, check manually")

# Keep running
try:
    proc.wait()
except KeyboardInterrupt:
    proc.terminate()
