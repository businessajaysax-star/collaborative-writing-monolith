import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const UserList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('user.users')}
      </Typography>
      <Typography variant="body1">
        User list page - Coming soon!
      </Typography>
    </Box>
  );
};

export default UserList;


