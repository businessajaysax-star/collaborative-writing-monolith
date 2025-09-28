import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>
      <Typography variant="body1">
        Settings page - Coming soon!
      </Typography>
    </Box>
  );
};

export default Settings;


