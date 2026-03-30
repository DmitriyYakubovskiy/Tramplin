import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, Grid, Card, CardContent, Chip } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import type { Opportunity } from '../types';
import { opportunityService } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HomePage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    filterOpportunities();
  }, [opportunities, search, city, type]);

  const loadOpportunities = async () => {
    try {
      const data = await opportunityService.getAll();
      setOpportunities(data);
    } catch (error) {
      console.error('Failed to load opportunities', error);
    }
  };

  const filterOpportunities = () => {
    let filtered = opportunities;
    if (search) {
      filtered = filtered.filter(o =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
        o.tags.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (city) {
      filtered = filtered.filter(o => o.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (type) {
      filtered = filtered.filter(o => o.type === type);
    }
    setFilteredOpportunities(filtered);
  };

  const OpportunityCard: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component={Link} to={`/opportunity/${opportunity.id}`} sx={{ textDecoration: 'none', color: 'primary.main' }}>
          {opportunity.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {opportunity.companyName} • {opportunity.city}
        </Typography>
        <Typography variant="body2">{opportunity.shortDescription}</Typography>
        <Box sx={{ mt: 1 }}>
          <Chip label={opportunity.type} size="small" />
          <Chip label={opportunity.workFormat} size="small" sx={{ ml: 1 }} />
          {opportunity.salaryFrom && <Chip label={`от ${opportunity.salaryFrom}₽`} size="small" sx={{ ml: 1 }} />}
        </Box>
        <Typography variant="caption" color="text.secondary">
          Опубликовано: {new Date(opportunity.publishedAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Платформа "Трамплин"
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Найди свою первую работу или стажировку в IT
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
          />
          <TextField
            label="Город"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Тип</InputLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="Vacancy">Вакансия</MenuItem>
              <MenuItem value="Internship">Стажировка</MenuItem>
              <MenuItem value="Mentorship">Менторство</MenuItem>
              <MenuItem value="Event">Мероприятие</MenuItem>
            </Select>
          </FormControl>
          <Button variant={viewMode === 'map' ? 'contained' : 'outlined'} onClick={() => setViewMode('map')}>
            Карта
          </Button>
          <Button variant={viewMode === 'list' ? 'contained' : 'outlined'} onClick={() => setViewMode('list')}>
            Список
          </Button>
        </Box>

        {/* Content */}
        {viewMode === 'map' ? (
          <Box sx={{ height: 600 }}>
            <MapContainer center={[55.7558, 37.6173]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredOpportunities.map((opp) => (
                opp.latitude && opp.longitude && (
                  <Marker key={opp.id} position={[opp.latitude, opp.longitude]}>
                    <Popup>
                      <Typography variant="h6">{opp.title}</Typography>
                      <Typography>{opp.companyName}</Typography>
                      <Typography>{opp.shortDescription}</Typography>
                      <Link to={`/opportunity/${opp.id}`}>Подробнее</Link>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredOpportunities.map((opp) => (
              <Grid item xs={12} md={6} lg={4} key={opp.id}>
                <OpportunityCard opportunity={opp} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;