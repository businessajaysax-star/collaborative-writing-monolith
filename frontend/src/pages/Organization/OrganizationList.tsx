import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const OrganizationList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('organization.organizations')}
      </Typography>
      <Typography variant="body1">
        Organization list page - Coming soon!
      </Typography>
    </Box>
  );
};

export default OrganizationList;


