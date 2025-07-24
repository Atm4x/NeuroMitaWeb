import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PromptsPage from './pages/PromptsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import AdminModerationPage from './pages/AdminModerationPage';
import DownloadsPage from './pages/DownloadsPage';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin/moderation" element={<AdminModerationPage />} />
      </Routes>
    </>
  );
}

export default App;