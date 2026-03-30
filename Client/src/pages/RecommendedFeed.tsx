import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Chip,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { recommendationsService } from '../services/api';
import type { RecommendedFeedItem } from '../types';
import {
    formatMoney,
    getOpportunityAccent,
    opportunityTypeLabel,
    splitTags,
    workFormatLabel,
} from '../utils/presentation';

// ─── компонент карточки ───────────────────────────────────────────────────────

function FeedCard({ item }: { item: RecommendedFeedItem }) {
    const accent = getOpportunityAccent(item.type);
    const tags = splitTags(item.tags).slice(0, 4); // не более 4 тегов в карточке

    return (
        <Paper
            component={RouterLink}
            to={`/opportunities/${item.id}`}
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 4,
                textDecoration: 'none',
                display: 'block',
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: 4 },
            }}
        >
            <Stack spacing={1}>
                {/* Тип + формат */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                        label={opportunityTypeLabel[item.type]}
                        size="small"
                        sx={{ backgroundColor: accent?.surface, color: accent?.color, fontWeight: 600 }}
                    />
                    <Chip label={workFormatLabel[item.workFormat]} size="small" variant="outlined" />
                    {item.isVerifiedOnly && (
                        <Chip label="Только верифицированным" size="small" color="warning" variant="outlined" />
                    )}
                </Stack>

                {/* Заголовок */}
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" noWrap>
                    {item.title}
                </Typography>

                {/* Компания + город */}
                <Typography variant="body2" color="text.secondary">
                    {item.employer?.companyName ?? item.companyName}
                    {item.city ? ` · ${item.city}` : ''}
                </Typography>

                {/* Зарплата */}
                {(item.salaryFrom != null || item.salaryTo != null) && (
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatMoney(item.salaryFrom, item.salaryTo)}
                    </Typography>
                )}

                {/* Теги */}
                {tags.length > 0 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

// ─── скелетон ────────────────────────────────────────────────────────────────

function FeedSkeleton() {
    return (
        <Stack spacing={1.5}>
            {Array.from({ length: 3 }).map((_, i) => (
                <Paper key={i} sx={{ p: 2.5, borderRadius: 4 }}>
                    <Stack spacing={1}>
                        <Skeleton variant="rounded" width={100} height={24} />
                        <Skeleton variant="text" width="70%" height={22} />
                        <Skeleton variant="text" width="40%" height={18} />
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}

// ─── основной компонент ───────────────────────────────────────────────────────

interface RecommendedFeedProps {
    /** Количество рекомендаций (1-20, по умолчанию 10) */
    topN?: number;
}

const RecommendedFeed = ({ topN = 10 }: RecommendedFeedProps) => {
    const [items, setItems] = useState<RecommendedFeedItem[]>([]);
    const [emptyMessage, setEmptyMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await recommendationsService.getFeed(topN);
                if (cancelled) return;
                setItems(data.items ?? []);
                setEmptyMessage(data.message ?? '');
            } catch {
                if (!cancelled) setError('Не удалось загрузить персональные рекомендации.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [topN]);

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                Рекомендуем вам
            </Typography>

            {loading && <FeedSkeleton />}

            {!loading && error && (
                <Typography color="error" variant="body2">{error}</Typography>
            )}

            {!loading && !error && items.length === 0 && (
                <Paper sx={{ p: 2.5, borderRadius: 4 }}>
                    <Typography color="text.secondary" variant="body2">
                        {emptyMessage || 'Пока нет персональных рекомендаций.'}
                    </Typography>
                </Paper>
            )}

            {!loading && !error && items.length > 0 && (
                <Stack spacing={1.5}>
                    {items.map((item) => (
                        <FeedCard key={item.id} item={item} />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default RecommendedFeed;
