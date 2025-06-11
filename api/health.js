// Vercel Health Check API
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    message: 'Epic Card Battle Server is running on Vercel',
    timestamp: new Date().toISOString(),
    wsUrl: 'wss://dawn-epic-card.vercel.app/api/websocket',
    platform: 'Vercel'
  });
}
