import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const OrganizationDetail: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('organization.title')}
      </Typography>
      <Typography variant="body1">
        Organization detail page - Coming soon!
      </Typography>
    </Box>
  );
};

export default OrganizationDetail;


