# Visual Portfolio

A decoupled full-stack portfolio application with React frontend and Flask backend.

## Project Structure

```
visual-portfolio/
├── web/                    # React frontend application
│   ├── src/               # React source code  
│   ├── public/            # Static assets
│   ├── node_modules/      # Frontend dependencies
│   ├── dist/              # Build output
│   ├── package.json       # Frontend dependencies & scripts
│   ├── package-lock.json  # Frontend lock file
│   └── vite.config.ts     # Vite configuration
├── server/                # Flask backend application
│   ├── app.py            # Main Flask application
│   ├── routes/           # API endpoints
│   ├── models.py         # Database models
│   ├── uploads/          # File uploads
│   └── requirements.txt   # Python dependencies
├── docker/               # Docker configurations
├── scripts/              # Utility scripts
├── docs/                 # Documentation
├── assets/               # Shared assets
└── package.json          # Root orchestration (NO dependencies)
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- pip

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Frontend (React) on http://localhost:3000
- Backend (Flask) on http://localhost:5000

### Individual Services

**Frontend only:**
```bash
npm run dev:web
```

**Backend only:**
```bash
npm run dev:server
# or
npm run start:server
```

### Building for Production

```bash
npm run build
```

## API Configuration

The frontend communicates with the backend API. Configure the API base URL:

- **Development:** `http://localhost:5000/api`
- **Production:** Set via environment variables

## Environment Variables

### Frontend (.env in web/)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

### Backend (.env in server/)
```
FLASK_ENV=development
DATABASE_URL=sqlite:///portfolio.db
JWT_SECRET_KEY=your-secret-key
FRONTEND_ORIGIN=http://localhost:3000
```

## Deployment

See individual README files in `web/` and `server/` directories for detailed deployment instructions.
