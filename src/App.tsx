/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { auth, onAuthStateChanged } from './firebase';
import { User } from 'firebase/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import CreatePost from './pages/CreatePost';
import Engage from './pages/Engage';
import Source from './pages/Source';
import { AlertCircle, RefreshCcw, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Initializing Engage Platform...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Layout user={user} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard user={user!} />} />
          <Route path="source" element={<Source user={user!} />} />
          <Route path="create" element={<CreatePost user={user!} />} />
          <Route path="engage" element={<Engage user={user!} />} />
          <Route path="settings" element={<Settings user={user!} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

