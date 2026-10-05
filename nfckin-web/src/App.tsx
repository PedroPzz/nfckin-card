import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './store';
import Login from './screens/Login';
import Home from './screens/Home';
import Activate from './screens/Activate';
import Detail from './screens/Detail';
import Settings from './screens/Settings';
import TabBar from './components/TabBar';
import Toast from './components/Toast';

export default function App() {
  const { user, hydrate } = useSession();
  const [ready, setReady] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    hydrate().finally(() => setReady(true));
  }, [hydrate]);

  if (!ready) {
    return (
      <div className="app">
        <div className="hero">
          <div className="spinner light" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  const isAuthed = !!user;
  const showTabs = isAuthed && ['/'].includes(loc.pathname);

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={isAuthed ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/activate" element={isAuthed ? <Activate /> : <Navigate to="/login" replace />} />
        <Route path="/card/:ncode" element={isAuthed ? <Detail /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={isAuthed ? <Settings /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabs && <TabBar />}
      <Toast />
    </div>
  );
}
