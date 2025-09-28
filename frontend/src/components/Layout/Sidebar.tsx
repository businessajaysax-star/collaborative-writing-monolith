import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Article as ContentIcon,
  RateReview as ReviewIcon,
  MenuBook as MagazineIcon,
  People as UserIcon,
  Business as OrganizationIcon,
  Notifications as NotificationIcon,
  Folder as FileIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const menuItems = [
    {
      text: t('navigation.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.REVIEWER],
    },
    {
      text: t('navigation.content'),
      icon: <ContentIcon />,
      path: '/content',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.REVIEWER],
    },
    {
      text: t('navigation.reviews'),
      icon: <ReviewIcon />,
      path: '/reviews',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.REVIEWER],
    },
    {
      text: t('navigation.magazines'),
      icon: <MagazineIcon />,
      path: '/magazines',
      roles: [UserRole.ADMIN, UserRole.TEACHER],
    },
    {
      text: t('navigation.users'),
      icon: <UserIcon />,
      path: '/users',
      roles: [UserRole.ADMIN],
    },
    {
      text: t('navigation.organizations'),
      icon: <OrganizationIcon />,
      path: '/organizations',
      roles: [UserRole.ADMIN, UserRole.TEACHER],
    },
    {
      text: t('navigation.notifications'),
      icon: <NotificationIcon />,
      path: '/notifications',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.REVIEWER],
    },
    {
      text: t('navigation.files'),
      icon: <FileIcon />,
      path: '/files',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.REVIEWER],
    },
    {
      text: t('navigation.analytics'),
      icon: <AnalyticsIcon />,
      path: '/analytics',
      roles: [UserRole.ADMIN, UserRole.TEACHER],
    },
    {
      text: t('navigation.settings'),
      icon: <SettingsIcon />,
      path: '/settings',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.REVIEWER],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          Writing Platform
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;


