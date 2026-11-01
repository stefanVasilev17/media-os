import React from 'react';
import ReactDOM from 'react-dom/client';
import { LocalAuthGate } from './auth/LocalAuthGate';
import { VoiceMvpApp } from './VoiceMvpApp';
import './styles/global.css';
import './styles/mediaOsProduct.css';
import './styles/mediaOsActivity.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><LocalAuthGate><VoiceMvpApp /></LocalAuthGate></React.StrictMode>
);
