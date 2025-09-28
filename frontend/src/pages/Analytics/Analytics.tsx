import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Analytics: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('analytics.title')}
      </Typography>
      <Typography variant="body1">
        Analytics page - Coming soon!
      </Typography>
    </Box>
  );
};

export default Analytics;


