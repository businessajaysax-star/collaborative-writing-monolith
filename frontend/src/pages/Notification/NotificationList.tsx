import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NotificationList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('notification.notifications')}
      </Typography>
      <Typography variant="body1">
        Notification list page - Coming soon!
      </Typography>
    </Box>
  );
};

export default NotificationList;


