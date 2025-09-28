import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  Article as ContentIcon,
  RateReview as ReviewIcon,
  MenuBook as MagazineIcon,
  People as UserIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stats = [
    {
      title: t('content.title'),
      value: '12',
      icon: <ContentIcon />,
      color: '#1976d2',
      path: '/content',
    },
    {
      title: t('review.title'),
      value: '8',
      icon: <ReviewIcon />,
      color: '#dc004e',
      path: '/reviews',
    },
    {
      title: t('magazine.title'),
      value: '3',
      icon: <MagazineIcon />,
      color: '#2e7d32',
      path: '/magazines',
    },
    {
      title: t('user.title'),
      value: '45',
      icon: <UserIcon />,
      color: '#ed6c02',
      path: '/users',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('common.goodMorning');
    if (hour < 18) return t('common.goodAfternoon');
    return t('common.goodEvening');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {getGreeting()}, {user?.first_name}!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to your collaborative writing platform dashboard.
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: stat.color,
                      color: 'white',
                      borderRadius: 1,
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" color="primary">
                  {stat.value}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" href={stat.path}>
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent activity to display.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" href="/content/new">
                Create Content
              </Button>
              {user?.role === UserRole.ADMIN && (
                <Button variant="outlined" href="/users">
                  Manage Users
                </Button>
              )}
              {user?.role === UserRole.TEACHER && (
                <Button variant="outlined" href="/magazines/new">
                  Create Magazine
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;


