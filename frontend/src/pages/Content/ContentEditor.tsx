import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ContentEditor: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('content.createContent')}
      </Typography>
      <Typography variant="body1">
        Content editor page - Coming soon!
      </Typography>
    </Box>
  );
};

export default ContentEditor;


