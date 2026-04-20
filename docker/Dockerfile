# --- Frontend Build Stage ---
FROM node:20-alpine AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Backend Build Stage ---
FROM python:3.11-slim AS backend
WORKDIR /app
COPY server/VisualPortfolioServer/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server/VisualPortfolioServer /app

# Copy built frontend to backend's static folder
COPY --from=frontend /app/client/dist /app/static

# Copy instance folder (for db, uploads, etc.)
COPY server/VisualPortfolioServer/instance /app/instance

# --- Production Stage ---
FROM python:3.11-slim
WORKDIR /app
COPY --from=backend /app /app

# Expose port (change if your Flask app uses a different port)
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Start with Gunicorn for production
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
