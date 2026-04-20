#!/usr/bin/env python3
"""
Startup script for the Flask backend server
Note: This should be run with conda environment MPI-Applications activated
Usage: conda activate MPI-Applications && python scripts/start.py
"""
import os
import sys

def main():
   print("🚀 Starting Portfolio Backend Server...")
   print("⚠️  Make sure you're in the MPI-Applications conda environment!")
   
   # Navigate to the server directory
   script_dir = os.path.dirname(__file__)
   project_root = os.path.dirname(script_dir)
   server_dir = os.path.join(project_root, 'server')
   
   if not os.path.exists(server_dir):
       print("❌ Server directory not found!")
       return
   
   # Add server to Python path
   sys.path.insert(0, server_dir)
   
   # Change to server directory
   original_dir = os.getcwd()
   os.chdir(server_dir)
   try:
       # Import and run the app
       from app import app
       print("✅ Flask app loaded")
       print("🌐 Server starting on http://0.0.0.0:5000")
       print("📱 Homepage: http://localhost:5000")
       print("=" * 50)
       # Run with proper error handling
       app.run(
           host='0.0.0.0',
           port=5000,
           debug=True,  # Enable debug for print output
           use_reloader=False,  # Prevent double startup
           threaded=True
       )
   except KeyboardInterrupt:
       print("\n👋 Server stopped by user")
   except Exception as e:
       print(f"❌ Server error: {e}")
       import traceback
       traceback.print_exc()
   finally:
       os.chdir(original_dir)
if __name__ == '__main__':
   main()