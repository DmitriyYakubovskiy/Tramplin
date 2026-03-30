import React, { useMemo, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import { alpha } from '@mui/material/styles';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AppHeader: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const isEmployer = user?.roles.includes('Employer');
  const isApplicant = user?.roles.includes('Applicant');
  const isModerator = user?.roles.includes('Curator') || user?.roles.includes('Admin');

  const roleLabel = isEmployer
    ? 'Работодатель'
    : isModerator
      ? 'Куратор'
      : isApplicant
        ? 'Соискатель'
        : 'Гость';

  const navigationItems = useMemo(
    () => [
      { label: 'Возможности', to: '/' },
      ...(isAuthenticated
        ? [
            { label: isApplicant ? 'Профиль' : 'Кабинет', to: '/dashboard' },
            ...(isApplicant
              ? [
                  { label: 'Отклики', to: '/applications' },
                  { label: 'Избранное', to: '/favorites' },
                ]
              : []),
          ]
        : []),
    ],
    [isApplicant, isAuthenticated],
  );

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        top: 0,
        px: { xs: 1, md: 0 },
        pt: { xs: 1, md: 2 },
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 0, md: 2 } }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: 'unset',
            px: { xs: 1.5, sm: 2, md: 3 },
            py: { xs: 1, md: 1.25 },
            borderRadius: 6,
            backdropFilter: 'blur(12px)',
            backgroundColor: alpha('#fffaf5', 0.88),
            border: `1px solid ${alpha('#132238', 0.08)}`,
            boxShadow: '0 14px 34px rgba(19, 34, 56, 0.08)',
            justifyContent: 'space-between',
            gap: { xs: 1, md: 2 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={{ xs: 1.25, md: 1.75 }} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 38, md: 42 },
                height: { xs: 38, md: 42 },
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                color: 'common.white',
                background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
                boxShadow: '0 14px 30px rgba(15, 118, 110, 0.24)',
              }}
            >
              <Typography variant="subtitle1" fontWeight={800}>
                T
              </Typography>
            </Box>
            <Box component={RouterLink} to="/" sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1, fontSize: { xs: '1.2rem', md: '1.25rem' } }}>
                Трамплин
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Карьерная экосистема для IT-старта
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            {navigationItems.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                variant={location.pathname === item.to ? 'contained' : 'text'}
                color={location.pathname === item.to ? 'primary' : 'inherit'}
                sx={{
                  color: location.pathname === item.to ? 'common.white' : 'text.primary',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              aria-label="Открыть меню"
            >
              <MenuRoundedIcon />
            </IconButton>
            {isAuthenticated ? (
              <>
                <Chip
                  label={`${roleLabel}: ${user?.displayName ?? ''}`}
                  sx={{
                    display: { xs: 'none', lg: 'inline-flex' },
                    backgroundColor: 'rgba(19, 34, 56, 0.05)',
                  }}
                />
                {isEmployer && (
                  <Button
                    component={RouterLink}
                    to="/create-opportunity"
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    sx={{ display: { xs: 'none', xl: 'inline-flex' } }}
                  >
                    Создать
                  </Button>
                )}
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant={location.pathname === '/dashboard' ? 'contained' : 'outlined'}
                  startIcon={<DashboardRoundedIcon />}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  {isApplicant ? 'Профиль' : 'Кабинет'}
                </Button>
                <Button color="inherit" onClick={handleLogout} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  startIcon={<LoginRoundedIcon />}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Войти
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  startIcon={<PersonAddRoundedIcon />}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Регистрация
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </Container>
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobileMenu}
        PaperProps={{ sx: { width: 320, maxWidth: '100%' } }}
      >
        <Stack sx={{ height: '100%' }}>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="h6">Трамплин</Typography>
            <Typography variant="body2" color="text.secondary">
              Навигация и быстрые действия
            </Typography>
          </Box>
          <Divider />
          <List sx={{ py: 1 }}>
            {navigationItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                selected={location.pathname === item.to}
                onClick={closeMobileMenu}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {isAuthenticated && isEmployer && (
              <ListItemButton component={RouterLink} to="/create-opportunity" onClick={closeMobileMenu}>
                <ListItemText primary="Создать возможность" />
              </ListItemButton>
            )}
          </List>
          <Divider />
          <Stack spacing={1.25} sx={{ p: 2.5 }}>
            {isAuthenticated ? (
              <>
                <Chip
                  label={`${roleLabel}: ${user?.displayName ?? ''}`}
                  sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
                />
                {isModerator ? (
                  <Typography variant="body2" color="text.secondary">
                    Модерация, профили и публикации доступны в кабинете.
                  </Typography>
                ) : null}
                <Button component={RouterLink} to="/dashboard" variant="contained" onClick={closeMobileMenu} fullWidth>
                  {isApplicant ? 'Профиль' : 'Кабинет'}
                </Button>
                <Button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  variant="outlined"
                  fullWidth
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/login" variant="outlined" onClick={closeMobileMenu} fullWidth>
                  Войти
                </Button>
                <Button component={RouterLink} to="/register" variant="contained" onClick={closeMobileMenu} fullWidth>
                  Регистрация
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Drawer>
    </AppBar>
  );
};

export default AppHeader;