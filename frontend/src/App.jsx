import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import Sidebar from './components/layout/Sidebar';
import PageContainer from './components/layout/PageContainer';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TradeJournalPage from './pages/TradeJournal/TradeJournalPage';
import WealthPlannerPage from './pages/WealthPlanner/WealthPlannerPage';
import MonthlyTrackerPage from './pages/MonthlyTracker/MonthlyTrackerPage';
import AccountsPage from './pages/AccountsBrokers/AccountsPage';
import AlgoScriptsPage from './pages/AlgoScripts/AlgoScriptsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import ReportsPage from './pages/Reports/ReportsPage';

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
      <AccountProvider>
        <Router>
          <div className="flex h-screen bg-surface text-on-surface font-geist">
            <Sidebar />
            <PageContainer>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/trades" element={<TradeJournalPage />} />
                <Route path="/planner" element={<WealthPlannerPage />} />
                <Route path="/tracker" element={<MonthlyTrackerPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/algo-scripts" element={<AlgoScriptsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </PageContainer>
          </div>
        </Router>
      </AccountProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;
