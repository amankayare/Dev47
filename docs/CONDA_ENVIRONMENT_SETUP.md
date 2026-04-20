# Conda Environment Setup ✅

## 🐍 **Using MPI-Applications Conda Environment**

Your Visual Portfolio project is now configured to use the `MPI-Applications` conda environment for the backend.

## 📋 **Prerequisites**

Make sure you have the conda environment activated:
```bash
conda activate MPI-Applications
```

## 🚀 **Updated Commands**

### **Root Level Scripts (Automatic Environment)**
```bash
# These automatically use the correct conda environment
npm run dev           # Start both frontend and backend
npm run dev:server    # Backend only (uses conda run -n MPI-Applications)  
npm run dev:web       # Frontend only
npm run install:all   # Install all dependencies
```

### **Manual Backend Commands**
```bash
# Activate environment first
conda activate MPI-Applications

# Then run backend commands
cd server
python app.py
```

## 🔧 **What Changed**

### **Updated package.json scripts:**
```json
{
  "dev:server": "cd server && conda run -n MPI-Applications python app.py",
  "install:server": "cd server && conda run -n MPI-Applications pip install -r requirements.txt",
  "start:server": "conda run -n MPI-Applications python scripts/start.py"
}
```

### **Updated setup script:**
- ✅ Checks for MPI-Applications environment
- ✅ Uses `conda run -n MPI-Applications` for all Python commands
- ✅ Installs dependencies in correct environment

### **Updated start script:**
- ✅ Added warning about conda environment
- ✅ Documentation updated

## ✅ **Dependencies Installed**

Backend dependencies are now installed in the `MPI-Applications` environment:
- ✅ Flask-CORS
- ✅ Flask
- ✅ SQLAlchemy
- ✅ And all other requirements from requirements.txt

## 🚀 **Ready to Use**

```bash
# Start everything (from project root)
npm run dev
```

This will:
1. Start the React frontend on http://localhost:3000
2. Start the Flask backend on http://localhost:5000 (using MPI-Applications env)
3. Proxy API requests from frontend to backend

---

**🎉 Your project is now properly configured with the MPI-Applications conda environment!**
