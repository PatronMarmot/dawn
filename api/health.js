// Vercel Health Check API
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'OK',
      service: 'Epic Card Battle API',
      timestamp: new Date().toISOString(),
      vercel: true,
      websocket: 'wss://epic-card-battle.vercel.app/api/websocket'
    });
  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET'] 
    });
  }
}