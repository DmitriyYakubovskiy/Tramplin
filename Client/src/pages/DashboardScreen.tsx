import { Alert, Container } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import ApplicantDashboard from '../components/dashboard/ApplicantDashboard';
import CuratorDashboard from '../components/dashboard/CuratorDashboard';
import EmployerDashboard from '../components/dashboard/EmployerDashboard';

const DashboardScreen = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, pb: { xs: 5, md: 8 } }}>
      {user.roles.includes('Admin') || user.roles.includes('Curator') ? (
        <CuratorDashboard />
      ) : user.roles.includes('Employer') ? (
        <EmployerDashboard />
      ) : user.roles.includes('Applicant') ? (
        <ApplicantDashboard />
      ) : (
        <Alert severity="warning">Для этого аккаунта не настроен рабочий кабинет.</Alert>
      )}
    </Container>
  );
};

export default DashboardScreen;
