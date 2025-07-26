// Vercel Health Check API - Simple Version
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'OK',
      service: 'Epic Card Battle API',
      timestamp: new Date().toISOString(),
      runtime: 'nodejs20.x',
      vercel: true,
      endpoints: {
        health: '/api/health',
        websocket: '/api/websocket'
      }
    });
  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET'] 
    });
  }
}