import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Button, Chip, Alert } from '@mui/material';
import type { Opportunity } from '../types';
import { opportunityService, applicationService } from '../services/api';
import { useAuth } from '../components/AuthContext';

const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (id) {
      loadOpportunity();
    }
  }, [id]);

  const loadOpportunity = async () => {
    try {
      const opps = await opportunityService.getAll();
      const opp = opps.find(o => o.id === id);
      setOpportunity(opp || null);
    } catch (err) {
      setError('Не удалось загрузить вакансию');
    }
  };

  const handleApply = async () => {
    if (!opportunity) return;
    try {
      await applicationService.create({ opportunityId: opportunity.id });
      setSuccess('Отклик отправлен!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке отклика');
    }
  };

  if (!opportunity) return <Typography>Загрузка...</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          {opportunity.title}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {opportunity.companyName} • {opportunity.city}
        </Typography>
        <Box sx={{ mt: 2, mb: 3 }}>
          <Chip label={opportunity.type} sx={{ mr: 1 }} />
          <Chip label={opportunity.workFormat} sx={{ mr: 1 }} />
          {opportunity.salaryFrom && <Chip label={`Зарплата от ${opportunity.salaryFrom}₽`} />}
        </Box>
        <Typography variant="body1" paragraph>
          {opportunity.shortDescription}
        </Typography>
        {/* Add full description, tags, etc. */}
        <Typography variant="body2">
          Контакты: {opportunity.contactEmail}
        </Typography>
        {isAuthenticated && user?.roles.includes('Applicant') && (
          <Button variant="contained" onClick={handleApply} sx={{ mt: 3 }}>
            Откликнуться
          </Button>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Box>
    </Container>
  );
};

export default OpportunityDetailPage;