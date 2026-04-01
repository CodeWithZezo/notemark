import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import NotemarkApp from './components/NotemarkApp';

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
    );
  }

  return user ? <NotemarkApp /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
