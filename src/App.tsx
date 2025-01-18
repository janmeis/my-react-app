// filepath: /C:/TFS/my-react-app/src/App.tsx
import React from 'react';
import ApiRequestComponent from './components/ApiRequestComponent';
import './theme.css';
import './App.scss';
import { APIOptions, PrimeReactProvider } from 'primereact/api';

const App: React.FC = () => {
  const value = {
    appendTo: 'self',
    inputStyle: 'filled',
  } as Partial<APIOptions>;
  return (
    <PrimeReactProvider value={value}>
      <ApiRequestComponent />
    </PrimeReactProvider>
  );
};

export default App;
