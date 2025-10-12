import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {QueryClientProvider} from '@tanstack/react-query';
import App from './App.tsx';
import queryClient from './config/queryClient';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ReactQueryDevtools position="bottom-right" initialIsOpen={false} />
      </BrowserRouter>
    </QueryClientProvider>
  // </StrictMode>
);
