import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Login from './pages/Login';
import React from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [user, setUser] = React.useState(auth.currentUser);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={user ? <Navigate to="/admin" /> : <Login />} />
          <Route 
            path="/admin" 
            element={user ? <Admin /> : <Navigate to="/login" />} 
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
