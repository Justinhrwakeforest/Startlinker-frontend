# StartLinker Frontend

React frontend for the StartLinker startup platform.

## Features

- Modern React 18+ with hooks
- Tailwind CSS styling
- Real-time updates
- Mobile responsive design
- Professional UI/UX

## Deployment

This frontend is configured for deployment on Render.com as a static site.

### Environment Variables

- `REACT_APP_API_URL`: Backend API URL (https://startlinker-backend.onrender.com)

### Build Commands

- **Build**: `npm ci && npm run build`
- **Publish Directory**: `build`

## Local Development

```bash
npm install
npm start
```

## Backend Integration

The frontend communicates with the Django backend API at the configured `REACT_APP_API_URL`.

## Live Demo

- **Frontend**: https://startlinker-frontend.onrender.com
- **Backend API**: https://startlinker-backend.onrender.com