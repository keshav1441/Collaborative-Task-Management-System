import './env';  // Import environment setup
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// ... rest of your imports

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 