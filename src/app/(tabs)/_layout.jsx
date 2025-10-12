import { Tabs } from "expo-router";
import { Factory, Flame, Wind, Bell, Settings } from "lucide-react-native";

// Move tab bar icon renderers to module scope to avoid inline component definitions
const DashboardIcon = ({ color, size }) => <Factory size={24} color={color} />;
const KilnsIcon = ({ color, size }) => <Flame size={24} color={color} />;
const DryersIcon = ({ color, size }) => <Wind size={24} color={color} />;
const AlertsIcon = ({ color, size }) => <Bell size={24} color={color} />;
const SettingsIcon = ({ color, size }) => <Settings size={24} color={color} />;

// PropTypes for the small icon components
import PropTypes from 'prop-types';
DashboardIcon.propTypes = { color: PropTypes.string, size: PropTypes.number };
KilnsIcon.propTypes = { color: PropTypes.string, size: PropTypes.number };
DryersIcon.propTypes = { color: PropTypes.string, size: PropTypes.number };
AlertsIcon.propTypes = { color: PropTypes.string, size: PropTypes.number };
SettingsIcon.propTypes = { color: PropTypes.string, size: PropTypes.number };

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
          height: 90,
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
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tabs.Screen
        name="kilns/index"
        options={{
          title: "Kilns",
          tabBarIcon: KilnsIcon,
        }}
      />
      <Tabs.Screen
        name="dryers/index"
        options={{
          title: "Dryers",
          tabBarIcon: DryersIcon,
        }}
      />
      <Tabs.Screen
        name="alerts/index"
        options={{
          title: "Alerts",
          tabBarIcon: AlertsIcon,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
          tabBarIcon: SettingsIcon,
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
