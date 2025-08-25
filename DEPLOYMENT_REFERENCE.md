# StartLinker Frontend - Deployment Reference

## 🌐 Live URLs
- **Main Website**: https://startlinker.com
- **Direct Frontend**: https://startlinker-frontend.onrender.com

## 📂 Repository
- **GitHub**: https://github.com/Justinhrwakeforest/Startlinker-frontend

## ☁️ Render Configuration
- **Service Name**: startlinker-frontend
- **Type**: Web Service (Node.js)
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment Variables**:
  - `NODE_VERSION`: "18"
  - `REACT_APP_API_URL`: https://startlinker-backend.onrender.com

## 🔧 Key Files
- **Express Server**: `server.js` (handles SPA routing)
- **API Configuration**: `src/config/api.config.js`
- **Routing**: `src/App.js`
- **SPA Redirects**: `public/_redirects`
- **Build Config**: `package.json`

## 🚀 Quick Deploy Commands
```bash
# Development
npm start

# Production build
npm run build

# Production server
npm run start:prod
```

## 📡 API Endpoints Used
- **Backend Base**: https://startlinker-backend.onrender.com
- **Main Routes**: /api/auth/, /api/social/, /api/startups/, /api/jobs/

---
*This is the frontend part of StartLinker platform*