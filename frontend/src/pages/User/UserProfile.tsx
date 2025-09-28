import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const UserProfile: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('user.profile')}
      </Typography>
      <Typography variant="body1">
        User profile page - Coming soon!
      </Typography>
    </Box>
  );
};

export default UserProfile;


