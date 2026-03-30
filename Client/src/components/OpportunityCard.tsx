import React from 'react';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Opportunity } from '../types';
import {
  formatOpportunityType,
  formatSalary,
  formatWorkFormat,
  getOpportunityLocation,
  getOpportunityTimeline,
  getOpportunityTone,
  splitTags,
} from '../utils/opportunity';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isFavorite?: boolean;
  onToggleFavorite?: (opportunityId: string) => void;
  compact?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isFavorite = false,
  onToggleFavorite,
  compact = false,
}) => {
  const tone = getOpportunityTone(opportunity.type);
  const tags = splitTags(opportunity.tags).slice(0, compact ? 3 : 5);

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        borderRadius: 6,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 28px 80px rgba(19, 34, 56, 0.14)',
          borderColor: 'rgba(19, 34, 56, 0.14)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '0 auto auto 0',
          width: '100%',
          height: 5,
          background: `linear-gradient(90deg, ${tone.accent}, rgba(255,255,255,0))`,
        }}
      />
      <CardContent sx={{ p: compact ? 2.5 : 3, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={formatOpportunityType(opportunity.type)}
              size="small"
              sx={{
                backgroundColor: tone.surface,
                color: tone.text,
              }}
            />
            <Chip label={formatWorkFormat(opportunity.workFormat)} size="small" variant="outlined" />
            {opportunity.employer?.isVerified && (
              <Chip
                icon={<VerifiedRoundedIcon />}
                label="Проверенный работодатель"
                size="small"
                sx={{
                  backgroundColor: 'rgba(15, 118, 110, 0.12)',
                  color: '#0f766e',
                }}
              />
            )}
          </Stack>
          {onToggleFavorite && (
            <Tooltip title={isFavorite ? 'Убрать из избранного' : 'Сохранить в браузере'}>
              <IconButton
                color={isFavorite ? 'secondary' : 'default'}
                onClick={() => onToggleFavorite(opportunity.id)}
                sx={{
                  backgroundColor: isFavorite ? 'rgba(249, 115, 22, 0.12)' : 'rgba(19, 34, 56, 0.04)',
                }}
              >
                {isFavorite ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Box>
          <Typography
            variant="h6"
            component={RouterLink}
            to={`/opportunity/${opportunity.id}`}
            sx={{
              display: 'inline-block',
              mb: 1,
              lineHeight: 1.15,
              transition: 'color 0.2s ease',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {opportunity.title}
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ color: 'text.secondary' }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <BusinessRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">{opportunity.companyName}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <LocationOnRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">{getOpportunityLocation(opportunity)}</Typography>
            </Stack>
          </Stack>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: compact ? 3 : 4,
            minHeight: compact ? 63 : 84,
          }}
        >
          {opportunity.shortDescription}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
              />
            ))
          ) : (
            <Chip label="Теги появятся после публикации" size="small" variant="outlined" />
          )}
        </Stack>

        <Divider />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
              {formatSalary(opportunity.salaryFrom, opportunity.salaryTo)}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption">{getOpportunityTimeline(opportunity)}</Typography>
            </Stack>
          </Box>
          <Button component={RouterLink} to={`/opportunity/${opportunity.id}`} variant="contained" color="primary">
            Подробнее
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OpportunityCard;
