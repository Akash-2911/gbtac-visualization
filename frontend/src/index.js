import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/theme.css';
import App from './App';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './auth/msalInstance';

const root = ReactDOM.createRoot(document.getElementById('root'));

window.msalInstance = msalInstance; // TEMPORARY — for debugging, remove later

msalInstance.initialize().then(() => {
  console.log('MSAL initialized');

  msalInstance
    .handleRedirectPromise()
    .then((response) => {
      console.log('handleRedirectPromise response:', response);

      if (response && response.account) {
        console.log('Setting active account:', response.account.username);
        msalInstance.setActiveAccount(response.account);
      } else {
        const accounts = msalInstance.getAllAccounts();
        console.log('No redirect response. Existing accounts found:', accounts);
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }
      }
    })
    .catch((error) => {
      console.error('MSAL redirect error:', error);
    })
    .finally(() => {
      console.log('Rendering app now.');
      root.render(
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      );
    });
});