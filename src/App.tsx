import React from 'react';
import ApiRequestComponent from './components/ApiRequestComponent';
import './theme.css';
import './App.scss';
import { APIOptions, PrimeReactProvider } from 'primereact/api';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppContext } from './contexts/AppContext';

const App: React.FC = () => {
  const value = {
    appendTo: 'self',
    inputStyle: 'filled',
  } as Partial<APIOptions>;

  return (
    <PrimeReactProvider value={value}>
      <AppContext.Provider value={{ firstRow: 0, currentPage: 1, rowsPerPage: 25 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/artist" />} />
          <Route path="/artist/:page?/:rows?/:artistDirId?/:albumDirId?" element={<ApiRequestComponent />} />
        </Routes>
      </AppContext.Provider>
    </PrimeReactProvider>
  );
};

export default App;
