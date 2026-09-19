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
import Leaderboard from './pages/citizen/Leaderboard';

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
          <Route path="leaderboard" element={<Wrapped><Leaderboard /></Wrapped>} />
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
    console.warn("Google Maps API key is not configured. Add VITE_GOOGLE_MAPS_API_KEY to your environment variables.");
  }

  return (
    <APIProvider apiKey={apiKey} onLoad={() => console.log('Maps API has loaded.')}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </APIProvider>
  );
}

export default App;
