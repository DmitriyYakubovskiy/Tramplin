import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Opportunity } from '../types';
import {
  formatMoney,
  getOpportunityAccent,
  getOpportunityLocation,
  getOpportunityTimeline,
  getStatusColor,
  opportunityStatusLabel,
  opportunityTypeLabel,
  splitTags,
  workFormatLabel,
} from '../utils/presentation';

interface OpportunityTileProps {
  opportunity: Opportunity;
  isFavorite?: boolean;
  onToggleFavorite?: (opportunity: Opportunity) => void;
  showStatus?: boolean;
  disableNavigation?: boolean;
}

const OpportunityTile = ({
  opportunity,
  isFavorite = false,
  onToggleFavorite,
  showStatus = false,
  disableNavigation = false,
}: OpportunityTileProps) => {
  const accent = getOpportunityAccent(opportunity.type);
  const tags = splitTags(opportunity.tags).slice(0, 4);
  const opportunityLink = `/opportunity/${opportunity.id}`;

  return (
    <Card
      sx={{
        borderRadius: 5,
        border: '1px solid rgba(19, 34, 56, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '0 auto auto 0',
          width: '100%',
          height: 4,
          background: accent.color,
        }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={opportunityTypeLabel[opportunity.type]}
              sx={{ backgroundColor: accent.surface, color: accent.color }}
            />
            <Chip size="small" label={workFormatLabel[opportunity.workFormat]} variant="outlined" />
            {showStatus && (
              <Chip
                size="small"
                label={opportunityStatusLabel[opportunity.status]}
                color={getStatusColor(opportunity.status)}
              />
            )}
          </Stack>
          {onToggleFavorite && (
            <Tooltip title={isFavorite ? 'Убрать из избранного' : 'Сохранить в избранное'}>
              <IconButton onClick={() => onToggleFavorite(opportunity)} color={isFavorite ? 'secondary' : 'default'} sx={{ alignSelf: 'flex-start' }}>
                {isFavorite ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Box>
          {disableNavigation ? (
            <Typography variant="h6" sx={{ display: 'inline-block' }}>
              {opportunity.title}
            </Typography>
          ) : (
            <Typography component={RouterLink} to={opportunityLink} variant="h6" sx={{ display: 'inline-block' }}>
              {opportunity.title}
            </Typography>
          )}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 1, color: 'text.secondary' }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <BusinessRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">{opportunity.companyName}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <PlaceRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">{getOpportunityLocation(opportunity)}</Typography>
            </Stack>
            {opportunity.employer?.isVerified && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <VerifiedRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="body2">Проверенный работодатель</Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Typography color="text.secondary">{opportunity.shortDescription}</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.length > 0
            ? tags.map((tag) => <Chip key={tag} size="small" label={tag} variant="outlined" />)
            : <Chip size="small" label="Теги не указаны" variant="outlined" />}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box>
            <Typography variant="subtitle1">{formatMoney(opportunity.salaryFrom, opportunity.salaryTo)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {getOpportunityTimeline(opportunity)}
            </Typography>
          </Box>
          {disableNavigation ? (
            <Button variant="contained" disabled sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Предпросмотр
            </Button>
          ) : (
            <Button component={RouterLink} to={opportunityLink} variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Открыть
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OpportunityTile;
