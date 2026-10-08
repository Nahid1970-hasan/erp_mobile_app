import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../utils/theme';
import { loadSession } from '../redux/authSlice';
import { Mark } from '../components/ui';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ApprovalsScreen from '../screens/ApprovalsScreen';
import ApprovalDetailScreen from '../screens/ApprovalDetailScreen';
import FloorScreen from '../screens/FloorScreen';
import ProductionScreen from '../screens/ProductionScreen';
import QcScreen from '../screens/QcScreen';
import ShipmentsScreen from '../screens/ShipmentsScreen';
import StoreScreen from '../screens/StoreScreen';
import HrScreen from '../screens/HrScreen';
import PayslipsScreen from '../screens/PayslipsScreen';
import NoticesScreen from '../screens/NoticesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AssistantScreen from '../screens/AssistantScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ApprovalStack = createNativeStackNavigator();
const FloorStack = createNativeStackNavigator();
const HrStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper },
};

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Mark size={84} />
      <Text style={styles.brand}>Isho</Text>
      <Text style={styles.splashSub}>Dekko Isho Group</Text>
      <ActivityIndicator color={colors.brass} />
    </View>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Orders" component={OrdersScreen} />
      <HomeStack.Screen name="Assistant" component={AssistantScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function ApprovalStackScreen() {
  return (
    <ApprovalStack.Navigator screenOptions={{ headerShown: false }}>
      <ApprovalStack.Screen name="Approvals" component={ApprovalsScreen} />
      <ApprovalStack.Screen name="ApprovalDetail" component={ApprovalDetailScreen} />
    </ApprovalStack.Navigator>
  );
}

function FloorStackScreen() {
  return (
    <FloorStack.Navigator screenOptions={{ headerShown: false }}>
      <FloorStack.Screen name="Floor" component={FloorScreen} />
      <FloorStack.Screen name="Production" component={ProductionScreen} />
      <FloorStack.Screen name="QC" component={QcScreen} />
      <FloorStack.Screen name="Shipments" component={ShipmentsScreen} />
      <FloorStack.Screen name="Store" component={StoreScreen} />
    </FloorStack.Navigator>
  );
}

function HrStackScreen() {
  return (
    <HrStack.Navigator screenOptions={{ headerShown: false }}>
      <HrStack.Screen name="People" component={HrScreen} />
      <HrStack.Screen name="Payslips" component={PayslipsScreen} />
      <HrStack.Screen name="Notices" component={NoticesScreen} />
    </HrStack.Navigator>
  );
}

function MoreStackScreen() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
      <MoreStack.Screen name="Assistant" component={AssistantScreen} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  const role = useSelector((state) => state.auth.user?.role);
  const approvals = role === 'manager' || role === 'merchandiser';
  const floor = role === 'manager' || role === 'merchandiser' || role === 'supervisor' || role === 'store';
  const hr = role !== 'store';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            HomeTab: focused ? 'grid' : 'grid-outline',
            ApprovalsTab: focused ? 'checkmark-done' : 'checkmark-done-outline',
            FloorTab: focused ? 'construct' : 'construct-outline',
            HrTab: focused ? 'people' : 'people-outline',
            MoreTab: focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: 'Home' }} />
      {approvals ? <Tab.Screen name="ApprovalsTab" component={ApprovalStackScreen} options={{ title: 'Approvals' }} /> : null}
      {floor ? <Tab.Screen name="FloorTab" component={FloorStackScreen} options={{ title: 'Floor' }} /> : null}
      {hr ? <Tab.Screen name="HrTab" component={HrStackScreen} options={{ title: 'HR' }} /> : null}
      <Tab.Screen name="MoreTab" component={MoreStackScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { ready, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  if (!ready) return <SplashScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? <Stack.Screen name="Main" component={MainTabs} /> : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', gap: 10 },
  brand: { color: colors.brass, fontSize: 36, fontWeight: '800', letterSpacing: 1 },
  splashSub: { color: '#D9C49A', marginBottom: 12 },
});
