import React, { useState } from 'react';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { getErrorMessage } from '../utils/http';

type RegisterRole = 'Applicant' | 'Employer';

const roleCards: Array<{
  role: RegisterRole;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    role: 'Applicant',
    title: 'Я соискатель',
    subtitle: 'Ищу стажировку, первую работу, ментора или карьерные события.',
    icon: <PersonRoundedIcon />,
  },
  {
    role: 'Employer',
    title: 'Я работодатель',
    subtitle: 'Хочу публиковать возможности и общаться с талантливыми кандидатами.',
    icon: <BusinessRoundedIcon />,
  },
];

const RegisterView: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('Applicant');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.register({ fullName, email, password, role });
      setSuccess('Аккаунт создан. Перенаправляем на страницу входа...');
      setTimeout(() => navigate('/login'), 1400);
    } catch (registerError) {
      setError(getErrorMessage(registerError, 'Не удалось зарегистрироваться.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Paper
        sx={{
          overflow: 'hidden',
          borderRadius: 8,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.05fr 0.95fr' },
        }}
      >
        <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="h3" gutterBottom>
            Создать профиль в «Трамплине»
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Выберите роль и откройте себе пространство для роста: отклики, события, менторы и
            взаимодействие с компаниями.
          </Typography>

          <Stack spacing={2} sx={{ mb: 3 }}>
            {roleCards.map((item) => {
              const selected = role === item.role;

              return (
                <Paper
                  key={item.role}
                  onClick={() => setRole(item.role)}
                  sx={{
                    p: 2.5,
                    borderRadius: 5,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    borderColor: selected ? 'primary.main' : 'divider',
                    backgroundColor: selected ? 'rgba(15,118,110,0.08)' : 'rgba(255,255,255,0.6)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 18px 42px rgba(19, 34, 56, 0.08)',
                    },
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.75}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        display: 'grid',
                        placeItems: 'center',
                        color: selected ? 'common.white' : 'primary.main',
                        background: selected
                          ? 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)'
                          : 'rgba(15,118,110,0.12)',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Paper sx={{ p: 2.5, borderRadius: 5, backgroundColor: 'rgba(19,34,56,0.03)' }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <VerifiedUserRoundedIcon color="secondary" />
              <Typography variant="body2" color="text.secondary">
                Для работодателей после регистрации можно будет пройти верификацию компании и только потом
                публиковать возможности на платформе.
              </Typography>
            </Stack>
          </Paper>
        </Box>

        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background:
              'linear-gradient(180deg, rgba(255,252,247,0.96) 0%, rgba(246,241,233,0.94) 100%)',
          }}
        >
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <TextField
              label={role === 'Employer' ? 'Название компании или отображаемое имя' : 'ФИО или отображаемое имя'}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={<ArrowForwardRoundedIcon />}
              fullWidth
            >
              {loading ? 'Создаём профиль...' : 'Продолжить'}
            </Button>

            <Typography color="text.secondary">
              Уже зарегистрированы?{' '}
              <Typography
                component={RouterLink}
                to="/login"
                sx={{ color: 'primary.main', fontWeight: 700, display: 'inline' }}
              >
                Войти
              </Typography>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterView;
