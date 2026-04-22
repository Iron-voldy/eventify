import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Review Screens
import Reviews from '../modules/reviews/Reviews';
import ManageReviews from '../modules/reviews/ManageReviews';

const Stack = createNativeStackNavigator();

const commonOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: { ...FONTS.bold },
  headerShadowVisible: false,
};

const AppNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading Reviews..." />;
  }

  return (
    <NavigationContainer theme={{
      ...DefaultTheme,
      dark: false,
      colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        background: COLORS.background,
        card: COLORS.surface,
        text: COLORS.textPrimary,
        border: COLORS.border,
        notification: COLORS.primary,
      },
    }}>
      <Stack.Navigator screenOptions={commonOptions}>
          <Stack.Screen name="ManageReviews" component={ManageReviews} options={{ title: 'Admin Reviews' }} />
          <Stack.Screen name="Reviews" component={Reviews} options={{ title: 'Public Reviews' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
