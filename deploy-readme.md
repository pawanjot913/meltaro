# Deployment Checklist for Meltaro

## Frontend (Netlify)

1. Set repository root to the `meltaro` folder.
2. Netlify build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set production environment variables on Netlify:
   - `VITE_API_URL=https://your-backend-domain.com`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`

## Backend (separate host)

Use any Node-compatible host such as Render, Railway, Fly, or a VPS.

1. Build backend:
   - `cd backend`
   - `npm run build`
2. Run backend:
   - `npm start`
3. Required environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `JWT_REFRESH_SECRET=...`
   - `COOKIE_SECRET=...`
   - `CORS_ORIGIN=https://your-frontend-domain.com`
   - `ADMIN_EMAIL=...`
   - `ADMIN_PASSWORD=...`
   - `GEMINI_API_KEY=...` (optional)
   - `SUPABASE_URL=...`

## Notes
- The frontend is deployed on Netlify.
- The backend must be deployed separately and exposed at the URL set in `VITE_API_URL`.
- For local Docker deployment, use `docker compose up --build` from the repository root.
