import { createApp } from './app';

const PORT = process.env.PORT ?? 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`BCPR Notifications API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
