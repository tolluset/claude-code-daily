import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { SessionDetail } from './pages/SessionDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
