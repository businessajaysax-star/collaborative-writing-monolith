import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ReviewList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('review.reviews')}
      </Typography>
      <Typography variant="body1">
        Review list page - Coming soon!
      </Typography>
    </Box>
  );
};

export default ReviewList;


