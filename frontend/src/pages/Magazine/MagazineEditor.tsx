import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MagazineEditor: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('magazine.createMagazine')}
      </Typography>
      <Typography variant="body1">
        Magazine editor page - Coming soon!
      </Typography>
    </Box>
  );
};

export default MagazineEditor;


