import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Tabs, Tab, Card, CardContent, Chip } from '@mui/material';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Application, ApplicantProfile, EmployerProfile } from '../types';
import { applicationService, profileService } from '../services/api';

const DashboardPage: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<ApplicantProfile | EmployerProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (!user) return;
    try {
      if (user.roles.includes('Applicant')) {
        const apps = await applicationService.getMy();
        setApplications(apps);
        const prof = await profileService.getApplicantProfile();
        setProfile(prof);
      } else if (user.roles.includes('Employer')) {
        // Load employer data
        const prof = await profileService.getEmployerProfile();
        setProfile(prof);
        // Load opportunities, etc.
      }
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!user) return null;

  const isApplicant = user.roles.includes('Applicant');
  const isEmployer = user.roles.includes('Employer');

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Личный кабинет
        </Typography>
        <Typography variant="h6">Привет, {user.displayName}!</Typography>
        <Button onClick={logout} variant="outlined" sx={{ mt: 2 }}>
          Выйти
        </Button>

        {isApplicant && (
          <>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 3 }}>
              <Tab label="Мои отклики" />
              <Tab label="Профиль" />
            </Tabs>
            {tabValue === 0 && (
              <Box sx={{ mt: 3 }}>
                {applications.map((app) => (
                  <Card key={app.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">{app.opportunity.title}</Typography>
                      <Typography>{app.opportunity.companyName}</Typography>
                      <Chip label={app.status} color={app.status === 'Accepted' ? 'success' : app.status === 'Rejected' ? 'error' : 'default'} />
                      <Typography variant="body2">Отправлено: {new Date(app.createdAt).toLocaleDateString()}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            {tabValue === 1 && profile && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5">Профиль соискателя</Typography>
                <Typography>ФИО: {(profile as ApplicantProfile).fullName}</Typography>
                <Typography>Университет: {(profile as ApplicantProfile).university}</Typography>
                <Typography>Навыки: {(profile as ApplicantProfile).skills}</Typography>
                {/* Add edit functionality */}
              </Box>
            )}
          </>
        )}

        {isEmployer && (
          <>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 3 }}>
              <Tab label="Мои вакансии" />
              <Tab label="Отклики" />
              <Tab label="Профиль" />
            </Tabs>
            {tabValue === 0 && (
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" onClick={() => navigate('/create-opportunity')}>
                  Создать вакансию
                </Button>
                {/* List opportunities */}
              </Box>
            )}
            {tabValue === 1 && (
              <Box sx={{ mt: 3 }}>
                {/* List applications */}
              </Box>
            )}
            {tabValue === 2 && profile && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5">Профиль компании</Typography>
                <Typography>Компания: {(profile as EmployerProfile).companyName}</Typography>
                <Typography>Описание: {(profile as EmployerProfile).description}</Typography>
                {/* Add edit functionality */}
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default DashboardPage;