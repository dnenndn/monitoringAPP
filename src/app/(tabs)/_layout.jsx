import { Tabs } from "expo-router";
import { Factory, Flame, Wind, Bell, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#2563EB",
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          height: 65,
        },
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Factory size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kilns"
        options={{
          title: "Kilns",
          tabBarIcon: ({ color, size }) => <Flame size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dryers"
        options={{
          title: "Dryers",
          tabBarIcon: ({ color, size }) => <Wind size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => <Bell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={24} color={color} />,
        }}
      />

      {/* Hidden routes for nested navigation */}
      <Tabs.Screen
        name="kilns/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="kilns/trend/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="dryers/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="dryers/trend/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
