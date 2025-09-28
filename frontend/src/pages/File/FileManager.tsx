import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const FileManager: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('file.files')}
      </Typography>
      <Typography variant="body1">
        File manager page - Coming soon!
      </Typography>
    </Box>
  );
};

export default FileManager;


