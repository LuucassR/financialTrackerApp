import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const TAB_ICON_SIZE = 22;
const ACTIVE_COLOR = '#22c55e';
const INACTIVE_COLOR = '#6b7280';
const BG_COLOR = '#0f172a';
const BORDER_COLOR = '#1e293b';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: BG_COLOR,
          borderTopColor: BORDER_COLOR,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <Feather name="home" size={TAB_ICON_SIZE} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Presupuesto',
          tabBarIcon: ({ focused }) => <Feather name="pie-chart" size={TAB_ICON_SIZE} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ focused }) => <Feather name="list" size={TAB_ICON_SIZE} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />,
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Gráficos',
          tabBarIcon: ({ focused }) => <Feather name="bar-chart-2" size={TAB_ICON_SIZE} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ focused }) => <Feather name="settings" size={TAB_ICON_SIZE} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />,
        }}
      />
    </Tabs>
  );
}
