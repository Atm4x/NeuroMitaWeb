import React from 'react';
import HomePage from './pages/HomePage';
import LanguageSwitcher from './components/LanguageSwitcher';

function App() {
  return (
    <>
      <LanguageSwitcher />
      <div className="noise"></div>
      <HomePage />
    </>
  );
}

export default App;