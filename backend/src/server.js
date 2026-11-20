const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-this-with-a-long-random-string') {
      throw new Error('JWT_SECRET is missing or still uses the example value. Set it in backend/.env.');
    }

    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] CivicFix API listening on port ${PORT}`);
      console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
    }); 
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
} 

start();
 
process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
});
