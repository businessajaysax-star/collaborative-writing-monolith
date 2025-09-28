import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ContentList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('content.title')}
      </Typography>
      <Typography variant="body1">
        Content list page - Coming soon!
      </Typography>
    </Box>
  );
};

export default ContentList;


