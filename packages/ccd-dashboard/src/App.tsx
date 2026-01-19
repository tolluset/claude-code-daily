import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { SessionDetail } from './pages/SessionDetail';
import { Reports } from './pages/Reports';
import { Statistics } from './pages/Statistics';
import { SearchPage } from './pages/Search';
import { DailyReport } from './pages/DailyReport';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:date" element={<DailyReport />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
