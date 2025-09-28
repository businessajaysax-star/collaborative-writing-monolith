import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ContentView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('content.viewContent')}
      </Typography>
      <Typography variant="body1">
        Content view page - Coming soon!
      </Typography>
    </Box>
  );
};

export default ContentView;


