import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    
    console.log(`[API] ${method} ${url}`);
    
    // Health check
    if (url?.includes('/health')) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'HarmonyForge API is running',
        timestamp: new Date().toISOString(),
        environment: 'vercel-serverless',
        method,
        url
      });
    }

    // Harmonize endpoint
    if (url?.includes('/harmonize')) {
      try {
        console.log('[API] Loading harmonize dependencies...');
        
        // Dynamically import Express app for harmonize functionality
        const express = await import('express');
        const cors = await import('cors');
        
        console.log('[API] Loading harmonize router...');
        const { default: harmonizeRouter } = await import('../backend/dist/routes/harmonize.js');
        
        console.log('[API] Setting up Express app...');
        const app = express.default();
        app.use(express.default.json());
        app.use(express.default.urlencoded({ extended: true }));
        app.use(cors.default({ origin: true, credentials: true }));
        app.use('/', harmonizeRouter);
        
        console.log('[API] Executing harmonize handler...');
        // Use app as middleware
        return new Promise((resolve, reject) => {
          app(req as any, res as any, (err: any) => {
            if (err) {
              console.error('[API] Harmonize handler error:', err);
              reject(err);
            } else {
              console.log('[API] Harmonize handler completed');
              resolve(undefined);
            }
          });
        });
      } catch (harmonizeError) {
        console.error('[API] Harmonize error:', harmonizeError);
        return res.status(500).json({
          error: 'Harmonize endpoint error',
          message: harmonizeError instanceof Error ? harmonizeError.message : 'Unknown error',
          stack: harmonizeError instanceof Error ? harmonizeError.stack : undefined
        });
      }
    }

    // Default 404
    console.log('[API] Route not found:', url);
    return res.status(404).json({ 
      error: 'Not found',
      path: url 
    });

  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
