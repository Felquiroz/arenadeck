import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './presentation/routes/auth';
import { tournamentRouter } from './presentation/routes/tournaments';
import { participantRouter } from './presentation/routes/participants';
import { matchRouter } from './presentation/routes/matches';
import { leaderboardRouter } from './presentation/routes/leaderboard';
import { errorHandler } from './infrastructure/middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'ArenaDeck API',
    status: 'running',
    health: '/health',
    basePath: '/api',
  });
});

// Silence Chrome DevTools probe requests when opening the API URL in a browser.
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api/participants', participantRouter);
app.use('/api/matches', matchRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ArenaDeck API running on port ${PORT}`);
});

export default app;
