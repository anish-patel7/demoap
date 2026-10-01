const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const accountsRoutes = require('./routes/accounts.routes');
const tradesRoutes = require('./routes/trades.routes');
const fundTransactionsRoutes = require('./routes/fundTransactions.routes');
const tradeSetupsRoutes = require('./routes/tradeSetups.routes');
const wealthPlanRoutes = require('./routes/wealthPlan.routes');
const wealthActualsRoutes = require('./routes/wealthActuals.routes');
const algoScriptsRoutes = require('./routes/algoScripts.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const backupRoutes = require('./routes/backup.routes');
const profileRoutes = require('./routes/profile.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const goalRoutes = require('./routes/goal.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/fund-transactions', fundTransactionsRoutes);
app.use('/api/trade-setups', tradeSetupsRoutes);
app.use('/api/wealth-plan', wealthPlanRoutes);
app.use('/api/wealth-actuals', wealthActualsRoutes);
app.use('/api/algo-scripts', algoScriptsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/goal', goalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
