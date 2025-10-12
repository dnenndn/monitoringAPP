import { Tabs } from "expo-router";
import { Factory, Flame, Wind, Bell, Settings } from "lucide-react-native";

import { View, Text } from "react-native";

// Reusable Tab icon component
function TabIcon({ icon, label, focused }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 12,
          color: focused ? "#1193d4" : "#6b7280",
          fontWeight: focused ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#f1ebeaff",
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingTop: 10,
          height: 70,
        },
        tabBarActiveTintColor: "#000000ff",
        tabBarInactiveTintColor: "rgba(0, 0, 0, 0.6)",
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
        name="dashboard/index"
        options={{
          title: "Dashboard",
           tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊"  focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="kilns/index"
        options={{
          title: "Kilns",
           tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔥" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dryers/index"
        options={{
          title: "Dryers",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💨"  focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts/index"
        options={{
          title: "Alerts",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔔"  focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️"  focused={focused} />
          ),
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
