import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import AppHeader from './components/AppHeader';
import ApplicantApplicationsScreen from './pages/ApplicantApplicationsScreen';
import ApplicantFavoritesScreen from './pages/ApplicantFavoritesScreen';
import CreateOpportunityScreen from './pages/CreateOpportunityScreen';
import DashboardScreen from './pages/DashboardScreen';
import HomeScreen from './pages/HomeScreen';
import LoginView from './pages/LoginView';
import OpportunityScreen from './pages/OpportunityScreen';
import RegisterView from './pages/RegisterView';
import { appTheme } from './theme';

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ minHeight: '100vh' }}>
            <AppHeader />
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/applications" element={<ApplicantApplicationsScreen />} />
              <Route path="/favorites" element={<ApplicantFavoritesScreen />} />
              <Route path="/opportunity/:id" element={<OpportunityScreen />} />
              <Route path="/create-opportunity" element={<CreateOpportunityScreen />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
