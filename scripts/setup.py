#!/usr/bin/env python3
"""
Development setup script for Visual Portfolio
"""
import os
import sys
import subprocess
import platform

def run_command(cmd, cwd=None):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {cmd}")
        print(f"Error: {e}")
        return False

def main():
    print("🚀 Setting up Visual Portfolio Development Environment")
    print("=" * 50)
    
    project_root = os.path.dirname(os.path.dirname(__file__))
    
    # Check prerequisites
    print("📋 Checking prerequisites...")
    
    # Check Node.js
    if not run_command("node --version"):
        print("❌ Node.js not found. Please install Node.js 18+")
        return False
    
    # Check Python
    if not run_command("python --version"):
        print("❌ Python not found. Please install Python 3.8+")
        return False
    
    print("✅ Prerequisites check passed")
    
    # Setup frontend
    print("\n📦 Setting up frontend...")
    web_dir = os.path.join(project_root, "web")
    
    if not run_command("npm install", cwd=web_dir):
        print("❌ Frontend setup failed")
        return False
    
    print("✅ Frontend setup completed")
    
    # Setup backend
    print("\n🐍 Setting up backend...")
    server_dir = os.path.join(project_root, "server")
    
    # Check if conda environment exists
    print("🔍 Checking conda environment portfolio-312...")
    if not run_command("conda info --envs | findstr portfolio-312"):
        print("❌ Conda environment 'portfolio-312' not found!")
        print("Please create it with: conda create -n portfolio-312 python=3.9")
        return False
    
    print("✅ Conda environment portfolio-312 found")
    
    if not run_command("conda run -n portfolio-312 pip install -r requirements.txt", cwd=server_dir):
        print("❌ Backend setup failed")
        return False
    
    # Initialize database
    if run_command("conda run -n portfolio-312 python init_db.py", cwd=server_dir):
        print("✅ Database initialized")
    else:
        print("⚠️  Database initialization failed (may already exist)")
    
    print("✅ Backend setup completed")
    
    # Create environment files if they don't exist
    print("\n🔧 Creating environment files...")
    
    web_env = os.path.join(web_dir, ".env")
    server_env = os.path.join(server_dir, ".env")
    
    if not os.path.exists(web_env):
        with open(os.path.join(web_dir, ".env.example"), "r") as f:
            content = f.read()
        with open(web_env, "w") as f:
            f.write(content)
        print("✅ Frontend .env created")
    
    if not os.path.exists(server_env):
        with open(os.path.join(server_dir, ".env.example"), "r") as f:
            content = f.read()
        with open(server_env, "w") as f:
            f.write(content)
        print("✅ Backend .env created")
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Update environment variables in .env files if needed")
    print("2. Run 'npm run dev' to start both frontend and backend")
    print("3. Visit http://localhost:3000 to view your application")

if __name__ == "__main__":
    main()
