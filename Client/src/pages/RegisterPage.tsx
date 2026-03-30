import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Alert, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Applicant' | 'Employer' | 'Curator'>('Applicant');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.register({ fullName, email, password, role });
      setSuccess('Регистрация успешна! Теперь войдите в систему.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            Регистрация
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Полное имя"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Роль</InputLabel>
              <Select value={role} onChange={(e) => setRole(e.target.value as 'Applicant' | 'Employer' | 'Curator')}>
                <MenuItem value="Applicant">Соискатель</MenuItem>
                <MenuItem value="Employer">Работодатель</MenuItem>
                <MenuItem value="Curator">Куратор</MenuItem>
              </Select>
            </FormControl>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Зарегистрироваться
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login">Уже есть аккаунт? Войти</Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;