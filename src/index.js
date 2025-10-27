import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import siteIcon from './images/allen (1).png';

const root = ReactDOM.createRoot(document.getElementById('root'));
const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
link.setAttribute('rel', 'icon');
link.setAttribute('href', siteIcon);
document.head.appendChild(link);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
