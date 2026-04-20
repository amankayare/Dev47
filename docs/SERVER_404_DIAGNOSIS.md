# 🔧 Server 404 Issues - Diagnosis & Solutions

## 🚨 **Current Issues Identified:**

1. **Server may not be starting properly** due to environment or import issues
2. **Static file serving** might have path configuration problems  
3. **Swagger/Flasgger** dependencies might be missing or misconfigured

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Verify Environment & Dependencies**

```bash
# 1. Activate correct environment
conda activate MPI-Applications

# 2. Install missing dependencies
pip install Flask Flask-CORS flasgger

# 3. Check installation
python -c "import flask, flask_cors, flasgger; print('All imports successful')"
```

### **Step 2: Test Basic Server Functionality**

```bash
# From server directory
cd c:\My-Drive\Workplaces\Python\Visual-Portfolio\server

# Test simple server
python test_server.py
```

**Then test:** http://localhost:5001/test (should show "ok" status)

### **Step 3: Check Build & Static Files**

```bash
# Build frontend first
cd c:\My-Drive\Workplaces\Python\Visual-Portfolio\web
npm run build

# Verify build output
dir dist
# Should show: index.html, assets/, favicon.svg, etc.
```

### **Step 4: Fix Main Server**

The main issue might be in your main `app.py`. Here's a minimal working version:

```python
from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Initialize Flask app with correct static folder
static_folder = os.path.abspath('../web/dist')
app = Flask(__name__, static_folder=static_folder, static_url_path='')

# Setup CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health():
    return {"status": "ok", "message": "Server running!"}, 200

if __name__ == "__main__":
    print(f"Static folder: {static_folder}")
    print(f"Static folder exists: {os.path.exists(static_folder)}")
    app.run(host="0.0.0.0", port=5000, debug=True)
```

## 🎯 **Quick Test Commands:**

```bash
# 1. Test that environment works
conda activate MPI-Applications
python -c "from flask import Flask; print('Flask works!')"

# 2. Test that build exists  
dir c:\My-Drive\Workplaces\Python\Visual-Portfolio\web\dist\index.html

# 3. Test minimal server (port 5001)
cd server && python test_server.py

# 4. Test main server (port 5000)
cd server && python app.py
```

## 🔍 **Expected Results:**

- **http://localhost:5001/test** → `{"status": "ok"}` (test server)
- **http://localhost:5000/** → React app (main server)  
- **http://localhost:5000/api/health** → `{"status": "ok"}` (main server)

## 🚨 **If Still Having Issues:**

1. **Check terminal output** for actual error messages
2. **Verify conda environment** is properly activated
3. **Check file permissions** on the dist folder
4. **Try port 3000** (development server) instead: `npm run dev`

---

**Next: Try the test server first, then let me know what errors you see in the terminal output.**
