import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EventView from './pages/EventView';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/event/:id" element={<EventView />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
