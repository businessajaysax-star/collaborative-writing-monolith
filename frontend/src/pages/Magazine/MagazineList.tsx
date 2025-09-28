import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MagazineList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('magazine.magazines')}
      </Typography>
      <Typography variant="body1">
        Magazine list page - Coming soon!
      </Typography>
    </Box>
  );
};

export default MagazineList;


