import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ReviewDetail: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('review.title')}
      </Typography>
      <Typography variant="body1">
        Review detail page - Coming soon!
      </Typography>
    </Box>
  );
};

export default ReviewDetail;


