import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { opportunityService } from '../services/api';

const CreateOpportunityPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    type: 'Vacancy',
    workFormat: 'Office',
    companyName: '',
    city: '',
    address: '',
    salaryFrom: '',
    salaryTo: '',
    contactEmail: '',
    contactPhone: '',
    externalUrl: '',
    tags: '',
    latitude: '',
    longitude: '',
    expiresAt: '',
    eventDate: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        salaryFrom: formData.salaryFrom ? parseFloat(formData.salaryFrom) : null,
        salaryTo: formData.salaryTo ? parseFloat(formData.salaryTo) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        expiresAt: formData.expiresAt || null,
        eventDate: formData.eventDate || null,
      };
      await opportunityService.create(data);
      setSuccess('Вакансия создана!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Создать вакансию/мероприятие
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Название"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Краткое описание"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            required
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Полное описание"
            name="fullDescription"
            value={formData.fullDescription}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={5}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип</InputLabel>
            <Select name="type" value={formData.type} onChange={handleChange}>
              <MenuItem value="Vacancy">Вакансия</MenuItem>
              <MenuItem value="Internship">Стажировка</MenuItem>
              <MenuItem value="Mentorship">Менторство</MenuItem>
              <MenuItem value="Event">Мероприятие</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Формат работы</InputLabel>
            <Select name="workFormat" value={formData.workFormat} onChange={handleChange}>
              <MenuItem value="Office">Офис</MenuItem>
              <MenuItem value="Hybrid">Гибрид</MenuItem>
              <MenuItem value="Remote">Удаленно</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Компания"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Город"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Адрес"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Зарплата от"
            name="salaryFrom"
            type="number"
            value={formData.salaryFrom}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Зарплата до"
            name="salaryTo"
            type="number"
            value={formData.salaryTo}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email контакта"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Телефон контакта"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Внешняя ссылка"
            name="externalUrl"
            value={formData.externalUrl}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Теги (через запятую)"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Широта"
            name="latitude"
            type="number"
            value={formData.latitude}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Долгота"
            name="longitude"
            type="number"
            value={formData.longitude}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Дата истечения"
            name="expiresAt"
            type="date"
            value={formData.expiresAt}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Дата мероприятия"
            name="eventDate"
            type="date"
            value={formData.eventDate}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            Создать
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateOpportunityPage;