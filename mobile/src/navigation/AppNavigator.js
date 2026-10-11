import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../utils/theme';
import { loadSession } from '../redux/authSlice';
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
      <Text style={styles.brand}>ISHO</Text>
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
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: '#9AA0AE',
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: '#ECEEF4', height: 60, paddingBottom: 6, paddingTop: 4 },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => {
          const icons = {
            HomeTab: focused ? 'grid' : 'grid-outline',
            SalesTab: focused ? 'pricetag' : 'pricetag-outline',
            ApprovalsTab: focused ? 'cart' : 'cart-outline',
            FloorTab: focused ? 'cube' : 'cube-outline',
            HrTab: focused ? 'people' : 'people-outline',
            MoreTab: focused ? 'document-text' : 'document-text-outline',
          };
          return <Ionicons name={icons[route.name]} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: 'DASHBOARD' }} />
      {approvals ? <Tab.Screen name="ApprovalsTab" component={ApprovalStackScreen} options={{ title: 'PURCHASE' }} /> : null}
      {floor ? <Tab.Screen name="FloorTab" component={FloorStackScreen} options={{ title: 'PRODUCTS' }} /> : null}
      {hr ? <Tab.Screen name="HrTab" component={HrStackScreen} options={{ title: 'STAFF' }} /> : null}
      <Tab.Screen name="MoreTab" component={MoreStackScreen} options={{ title: 'REPORTS' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { ready, user } = useSelector((state) => state.auth);
  const [holdSplash, setHoldSplash] = useState(true);

  useEffect(() => {
    dispatch(loadSession());
    const timer = setTimeout(() => setHoldSplash(false), 1600);
    return () => clearTimeout(timer);
  }, [dispatch]);

  if (!ready || holdSplash) return <SplashScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? <Stack.Screen name="Main" component={MainTabs} /> : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.white, fontSize: 40, fontWeight: '800', letterSpacing: 3 },
});
