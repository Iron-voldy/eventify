import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';
import LoadingSpinner from '../components/LoadingSpinner';

// User Screens
import Splash from '../modules/users/Splash';
import Onboarding from '../modules/users/Onboarding';
import Login from '../modules/users/Login';
import Register from '../modules/users/Register';
import Home from '../modules/users/Home';
import Events from '../modules/events/Events';
import Bookings from '../modules/bookings/Bookings';
import Profile from '../modules/users/Profile';
import EventDetails from '../modules/events/EventDetails';
import Checkout from '../modules/bookings/Checkout';
import Reviews from '../modules/reviews/Reviews';
import Support from '../modules/complaints/Support';
import Promotions from '../modules/promoCodes/Promotions';
import Wishlist from '../modules/events/Wishlist';
import EditProfile from '../modules/users/EditProfile';

// Admin Screens
import AdminLogin from '../modules/users/AdminLogin';
import Dashboard from '../modules/users/Dashboard';
import ManageUsers from '../modules/users/ManageUsers';
import ManageEvents from '../modules/events/ManageEvents';
import CreateEditEvent from '../modules/events/CreateEditEvent';
import ManageBookings from '../modules/bookings/ManageBookings';
import ManageReviews from '../modules/reviews/ManageReviews';
import ManageComplaints from '../modules/complaints/ManageComplaints';
import ManagePromos from '../modules/promoCodes/ManagePromos';
import QRScanner from '../modules/bookings/QRScanner';
import AdminMore from '../modules/users/AdminMore';
import ManageVenues from '../modules/venues/ManageVenues';
import Venues from '../modules/venues/Venues';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const commonOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: { ...FONTS.bold },
  headerShadowVisible: false,
};

const UserTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color }) => {
        const s = focused ? 25 : 23;
        if (route.name === 'Places')
          return <MaterialIcons name="location-city" size={s - 1} color={color} />;
        if (route.name === 'Promos')
          return <MaterialIcons name="local-offer" size={s - 1} color={color} />;
        if (route.name === 'Home')
          return (
            <View style={tabStyles.centerBtn}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tabStyles.centerGrad}
              >
                <MaterialIcons name="explore" size={27} color="#FFF" />
              </LinearGradient>
            </View>
          );
        if (route.name === 'Bookings')
          return <FontAwesome5 name="ticket-alt" size={s - 3} color={color} />;
        if (route.name === 'Profile')
          return <MaterialIcons name="person" size={s} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: 'rgba(167, 139, 250, 0.4)',
      tabBarStyle: {
        backgroundColor: '#0F0020',
        borderTopColor: 'rgba(139,92,246,0.2)',
        borderTopWidth: 1,
        height: 72,
        paddingBottom: 10,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Places" component={Venues} options={{ tabBarLabel: 'Places' }} />
    <Tab.Screen name="Promos" component={Promotions} />
    <Tab.Screen
      name="Home"
      component={Home}
      options={{ tabBarLabel: '' }}
    />
    <Tab.Screen name="Bookings" component={Bookings} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...commonOptions,
      headerShown: false,
      tabBarIcon: ({ focused, color }) => {
        const s = focused ? 24 : 22;
        if (route.name === 'Dashboard') return <MaterialIcons name="bar-chart" size={s} color={color} />;
        if (route.name === 'Events') return <MaterialIcons name="event" size={s} color={color} />;
        if (route.name === 'Users') return <MaterialIcons name="people" size={s} color={color} />;
        if (route.name === 'ScanQR') return <MaterialIcons name="qr-code-scanner" size={s} color={color} />;
        if (route.name === 'More') return <MaterialIcons name="grid-view" size={s} color={color} />;
      },
      tabBarActiveTintColor: COLORS.secondary,
      tabBarInactiveTintColor: 'rgba(167, 139, 250, 0.4)',
      tabBarStyle: {
        backgroundColor: '#0F0020',
        borderTopColor: 'rgba(139,92,246,0.2)',
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 10,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={Dashboard} />
    <Tab.Screen name="Events" component={ManageEvents} />
    <Tab.Screen name="Users" component={ManageUsers} />
    <Tab.Screen name="ScanQR" component={QRScanner} options={{ tabBarLabel: 'Scan QR' }} />
    <Tab.Screen name="More" component={AdminMore} />
  </Tab.Navigator>
);

const tabStyles = StyleSheet.create({
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    top: -16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 14,
  },
  centerGrad: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#07000F',
  },
});

const AppNavigator = () => {
  const { user, loading, isLoggedIn, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Starting Eventify..." />;
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
        {!isLoggedIn ? (
          // Auth Stack
          <>
            <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
            <Stack.Screen name="AdminLogin" component={AdminLogin} options={{ headerShown: false }} />
          </>
        ) : isAdmin ? (
          // Admin Stack
          <>
            <Stack.Screen name="AdminRoot" component={AdminTabs} options={{ headerShown: false }} />
            <Stack.Screen name="EventDetails" component={EventDetails} options={{ title: 'Event Details' }} />
            <Stack.Screen name="CreateEditEvent" component={CreateEditEvent} options={{ title: 'Event' }} />
            <Stack.Screen name="ManageBookings" component={ManageBookings} options={{ title: 'Bookings' }} />
            <Stack.Screen name="ManageReviews" component={ManageReviews} options={{ title: 'Reviews' }} />
            <Stack.Screen name="ManageComplaints" component={ManageComplaints} options={{ title: 'Support Tickets' }} />
            <Stack.Screen name="ManagePromos" component={ManagePromos} options={{ title: 'Promo Codes' }} />
            <Stack.Screen name="ManageVenues" component={ManageVenues} options={{ headerShown: false }} />
            <Stack.Screen name="Venues" component={Venues} options={{ headerShown: false }} />
            <Stack.Screen name="QRScanner" component={QRScanner} options={{ title: 'Scan Booking QR', headerShown: false }} />
          </>
        ) : (
          // User Stack
          <>
            <Stack.Screen name="UserRoot" component={UserTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ExploreEvents" component={Events} options={{ headerShown: false }} />
            <Stack.Screen name="EventDetails" component={EventDetails} options={{ title: 'Event Details' }} />
            <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'Complete Booking' }} />
            <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="Reviews" component={Reviews} options={{ headerShown: false }} />
            <Stack.Screen name="Support" component={Support} options={{ title: 'Support & Help' }} />
            <Stack.Screen name="Promotions" component={Promotions} options={{ title: 'Promotions', headerShown: false }} />
            <Stack.Screen name="Wishlist" component={Wishlist} options={{ headerShown: false }} />
            <Stack.Screen name="Venues" component={Venues} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
