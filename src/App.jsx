import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PromptsPage from './pages/PromptsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="prompts" element={<PromptsPage />} />
      </Route>
    </Routes>
  );
}

export default App;