import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './css/index.css';

// Apply Phylo-RStudio design theme
document.body.classList.add('phylo-design');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
