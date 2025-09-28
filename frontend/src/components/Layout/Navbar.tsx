import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings,
  Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuthStore();
  const { notifications } = useSocketStore();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('navigation.dashboard')}
        </Typography>

        {/* Notifications */}
        <IconButton
          size="large"
          color="inherit"
          onClick={handleNotificationMenuOpen}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Profile Menu */}
        <IconButton
          size="large"
          edge="end"
          onClick={handleProfileMenuOpen}
          color="inherit"
        >
          <Avatar
            src={user?.avatar_url}
            sx={{ width: 32, height: 32 }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
        </IconButton>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <AccountCircle sx={{ mr: 1 }} />
            {t('user.profile')}
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Settings sx={{ mr: 1 }} />
            {t('settings.title')}
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            {t('auth.logout')}
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {notifications.length === 0 ? (
            <MenuItem disabled>
              {t('notification.noNotifications')}
            </MenuItem>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <MenuItem key={notification.id} onClick={handleMenuClose}>
                <Box>
                  <Typography variant="body2" fontWeight={notification.is_read ? 'normal' : 'bold'}>
                    {notification.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;


