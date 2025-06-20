import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import './index.css'
import './styles/Global.css'
import App from './App.jsx'
import './i18n'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
