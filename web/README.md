# Visual Portfolio - Frontend

React-based frontend application built with TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** TanStack Query
- **Routing:** Wouter
- **Forms:** React Hook Form

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Building
```bash
npm run build
```

Build files will be generated in the `../dist/web` directory.

### Environment Variables

Create a `.env` file in this directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

## Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── utils/             # Helper functions
└── styles/            # CSS files
```

## API Integration

The frontend communicates with the Flask backend via REST API. All API calls are centralized in `src/utils/api.ts`.

## Deployment

### Static Hosting (Recommended)
- Build the project: `npm run build`
- Deploy the `../dist/web` folder to:
  - Netlify
  - Vercel
  - AWS S3 + CloudFront
  - GitHub Pages

### Environment Variables for Production
- `VITE_API_BASE_URL`: Your production API URL
