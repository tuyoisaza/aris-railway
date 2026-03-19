import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import { GlobalProvider } from './context/GlobalContext';
import AppRoutes from './AppRoutes';
import './i18n';
import { DesignSystem } from './design-system'; // Enforce Design System loading

const App = () => {
  // Verification: Log Design System tokens to console
  console.log('[System] Design System Loaded:', DesignSystem);

  return (
    <GlobalProvider>
      <Router>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </Router>
    </GlobalProvider>
  );
}

export default App;
