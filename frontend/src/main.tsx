import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LocalAuthGate } from './auth/LocalAuthGate';
import './styles/global.css';
import './styles/mediaOsProduct.css';
import './styles/mediaOsActivity.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocalAuthGate><App /></LocalAuthGate>
  </React.StrictMode>
);
