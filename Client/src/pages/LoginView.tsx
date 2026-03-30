import React, { useState } from 'react';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
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
import { useAuth } from '../components/AuthContext';
import { authService } from '../services/api';
import { getErrorMessage } from '../utils/http';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (loginError) {
      setError(getErrorMessage(loginError, 'Не удалось выполнить вход.'));
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
          gridTemplateColumns: { xs: '1fr', lg: '1fr 0.92fr' },
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            color: 'common.white',
            background:
              'linear-gradient(160deg, rgba(19,34,56,0.98) 0%, rgba(15,118,110,0.96) 55%, rgba(2,132,199,0.92) 100%)',
          }}
        >
          <ChiplessBadge />
          <Typography variant="h2" sx={{ color: 'inherit', maxWidth: 520, mb: 2 }}>
            Возвращайтесь в карьерную экосистему без лишних шагов.
          </Typography>
          <Typography sx={{ maxWidth: 560, color: 'rgba(255,255,255,0.82)', mb: 4 }}>
            Работодатели получают поток релевантных кандидатов, а студенты и выпускники видят путь
            от первого отклика до реального оффера.
          </Typography>

          <Stack spacing={2}>
            {[
              {
                icon: <RocketLaunchRoundedIcon />,
                title: 'Для карьерного старта',
                text: 'Стажировки, junior-роли, менторство и события в одной точке входа.',
              },
              {
                icon: <VerifiedRoundedIcon />,
                title: 'Для проверенных работодателей',
                text: 'Платформа помогает быстро выделять активные и доверенные компании.',
              },
              {
                icon: <SchoolRoundedIcon />,
                title: 'Для вузов и кураторов',
                text: 'Кабинеты и модерация помогают удерживать качество контента на платформе.',
              },
            ].map((item) => (
              <Paper
                key={item.title}
                sx={{
                  p: 2.25,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.14)',
                  color: 'common.white',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.74)' }}>
                      {item.text}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h3" gutterBottom>
                Вход в платформу
              </Typography>
              <Typography color="text.secondary">
                Используйте e-mail и пароль. Для кураторов вход выполняется через те же поля.
              </Typography>
            </Box>

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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={<ArrowForwardRoundedIcon />}
              fullWidth
            >
              {loading ? 'Входим...' : 'Войти'}
            </Button>

            <Typography color="text.secondary">
              Нет аккаунта?{' '}
              <Typography
                component={RouterLink}
                to="/register"
                sx={{ color: 'primary.main', fontWeight: 700, display: 'inline' }}
              >
                Создать профиль
              </Typography>
            </Typography>

            <Paper sx={{ p: 2.25, borderRadius: 5, backgroundColor: 'rgba(19,34,56,0.03)' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <LockRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  После входа вы попадёте в персональный кабинет соискателя, работодателя или куратора.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

const ChiplessBadge = () => (
  <Typography
    variant="overline"
    sx={{
      display: 'inline-flex',
      px: 1.5,
      py: 0.5,
      borderRadius: 999,
      letterSpacing: '0.08em',
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: 'rgba(255,255,255,0.82)',
      mb: 2,
    }}
  >
    Трамплин · secure sign in
  </Typography>
);

export default LoginView;
