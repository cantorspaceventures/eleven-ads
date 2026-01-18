# Deployment Guide

This project is configured for deployment on Vercel.

## Deployment Steps

1.  **Vercel Configuration**:
    *   A `vercel.json` file is included in the root directory to handle routing and serverless functions.
    *   Frontend routes are rewritten to `/index.html` (SPA fallback).
    *   API routes (`/api/*`) are handled by Vercel Functions.

2.  **Environment Variables**:
    *   Ensure the following environment variables are set in your Vercel project settings:
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`
        *   `SUPABASE_SERVICE_ROLE_KEY`

3.  **Build Command**:
    *   Vercel will automatically detect the build settings.
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
    *   Install Command: `npm install`

## Manual Deployment

If you have the Vercel CLI installed:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```
