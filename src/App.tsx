import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { APIProvider } from '@vis.gl/react-google-maps';

import CitizenLayout from './layouts/CitizenLayout';
import AdminLayout from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageTransition } from './components/PageTransition';

import Home from './pages/citizen/Home';
import ReportIssue from './pages/citizen/ReportIssue';
import CityMap from './pages/citizen/CityMap';
import IssueDetails from './pages/citizen/IssueDetails';
import Profile from './pages/citizen/Profile';
import MyReports from './pages/citizen/MyReports';
import CollaborationHub from './pages/citizen/CollaborationHub';
import CommunityPulse from './pages/citizen/CommunityPulse';

import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/Overview';
import IssueIntelligence from './pages/admin/IssueIntelligence';
import AdminMap from './pages/admin/AdminMap';
import FieldTeams from './pages/admin/FieldTeams';
import SlaMonitor from './pages/admin/SlaMonitor';

const Wrapped = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>{children}</PageTransition>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Citizen Portal */}
        <Route path="/" element={<CitizenLayout />}>
          <Route index element={<Wrapped><Home /></Wrapped>} />
          <Route path="report" element={<Wrapped><ReportIssue /></Wrapped>} />
          <Route path="map" element={<Wrapped><CityMap /></Wrapped>} />
          <Route path="issue/:id" element={<Wrapped><IssueDetails /></Wrapped>} />
          <Route path="profile" element={<Wrapped><Profile /></Wrapped>} />
          <Route path="my-reports" element={<Wrapped><MyReports /></Wrapped>} />
          <Route path="collaboration" element={<Wrapped><CollaborationHub /></Wrapped>} />
          <Route path="community-pulse" element={<Wrapped><CommunityPulse /></Wrapped>} />

        </Route>

        {/* Admin authentication gate */}
        <Route path="/admin/login" element={<Wrapped><AdminLogin /></Wrapped>} />

        {/* Authority Command Center — password protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<Wrapped><AdminOverview /></Wrapped>} />
          <Route path="issues" element={<Wrapped><IssueIntelligence /></Wrapped>} />
          <Route path="map" element={<Wrapped><AdminMap /></Wrapped>} />
          <Route path="teams" element={<Wrapped><FieldTeams /></Wrapped>} />
          <Route path="sla" element={<Wrapped><SlaMonitor /></Wrapped>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Google Maps API Key Missing</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Please add your Google Maps API key to the <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> file to enable map features.
          </p>
          <div className="bg-gray-50 p-3 rounded text-left text-xs font-mono border border-gray-200">
            VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'geometry', 'geocoding']}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </APIProvider>
  );
}

export default App;
