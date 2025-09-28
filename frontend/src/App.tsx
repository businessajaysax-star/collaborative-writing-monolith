import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ContentList from './pages/Content/ContentList';
import ContentEditor from './pages/Content/ContentEditor';
import ContentView from './pages/Content/ContentView';
import ReviewList from './pages/Review/ReviewList';
import ReviewDetail from './pages/Review/ReviewDetail';
import MagazineList from './pages/Magazine/MagazineList';
import MagazineEditor from './pages/Magazine/MagazineEditor';
import UserList from './pages/User/UserList';
import UserProfile from './pages/User/UserProfile';
import OrganizationList from './pages/Organization/OrganizationList';
import OrganizationDetail from './pages/Organization/OrganizationDetail';
import NotificationList from './pages/Notification/NotificationList';
import FileManager from './pages/File/FileManager';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';

const App: React.FC = () => {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    // Initialize authentication
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Connect/disconnect socket based on authentication
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, connectSocket, disconnectSocket]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isAuthenticated && <Sidebar />}
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {isAuthenticated && <Navbar />}
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
            />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Content Routes */}
              <Route path="content" element={<ContentList />} />
              <Route path="content/new" element={<ContentEditor />} />
              <Route path="content/:id" element={<ContentView />} />
              <Route path="content/:id/edit" element={<ContentEditor />} />
              
              {/* Review Routes */}
              <Route path="reviews" element={<ReviewList />} />
              <Route path="reviews/:id" element={<ReviewDetail />} />
              
              {/* Magazine Routes */}
              <Route path="magazines" element={<MagazineList />} />
              <Route path="magazines/new" element={<MagazineEditor />} />
              <Route path="magazines/:id/edit" element={<MagazineEditor />} />
              
              {/* User Routes */}
              <Route path="users" element={<UserList />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="users/:id" element={<UserProfile />} />
              
              {/* Organization Routes */}
              <Route path="organizations" element={<OrganizationList />} />
              <Route path="organizations/:id" element={<OrganizationDetail />} />
              
              {/* Other Routes */}
              <Route path="notifications" element={<NotificationList />} />
              <Route path="files" element={<FileManager />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default App;


