import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Dynamically rewrite localhost API calls to VITE_API_URL if defined in production environment variables
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:5002')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5002';
    config.url = config.url.replace('http://localhost:5002', apiBase);
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

