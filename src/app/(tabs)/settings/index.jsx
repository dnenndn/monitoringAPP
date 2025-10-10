import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings as SettingsIcon,
  Bell,
  Download,
  Shield,
  Wifi,
  Moon,
  AlertTriangle,
  Clock,
  ChevronRight,
  Info,
  HelpCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

function SettingSection({ title, children }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: "#1F2937",
          marginBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          marginHorizontal: 20,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  icon: Icon,
  iconColor = "#6B7280",
  title,
  subtitle,
  onPress,
  rightComponent,
  showChevron = false,
  isLast = false,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          backgroundColor: iconColor + "20",
          borderRadius: 8,
          padding: 8,
          marginRight: 16,
        }}
      >
        <Icon size={20} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: "#1F2937",
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightComponent}

      {showChevron && (
        <ChevronRight
          size={20}
          color="#6B7280"
          style={{ marginLeft: 8 }}
        />
      )}
    </TouchableOpacity>
  );
}

function ToggleRow({ icon: Icon, iconColor, title, subtitle, value, onValueChange, isLast = false }) {
  const handleToggle = (newValue) => {
    Haptics.selectionAsync();
    onValueChange(newValue);
  };

  return (
    <SettingRow
      icon={Icon}
      iconColor={iconColor}
      title={title}
      subtitle={subtitle}
      rightComponent={
        <Switch
          value={value}
          onValueChange={handleToggle}
          trackColor={{ false: "#D1D5DB", true: "#2563EB" }}
          thumbColor={value ? "#FFFFFF" : "#F3F4F6"}
        />
      }
      isLast={isLast}
    />
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [warningAlerts, setWarningAlerts] = useState(true);
  const [statusChanges, setStatusChanges] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  const handleExportData = () => {
    Haptics.selectionAsync();
    Alert.alert(
      "Export Data",
      "Choose the data you want to export:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Parameter History",
          onPress: () => {
            Alert.alert("Export", "Parameter history export will be available soon");
          },
        },
        {
          text: "Alert History",
          onPress: () => {
            Alert.alert("Export", "Alert history export will be available soon");
          },
        },
        {
          text: "All Data",
          onPress: () => {
            Alert.alert("Export", "Complete data export will be available soon");
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Haptics.selectionAsync();
    Alert.alert(
      "About Factory Monitoring",
      "Version 1.0.0\n\nReal-time PLC monitoring system for industrial equipment.\n\nBuilt with React Native and Expo.",
      [{ text: "OK" }]
    );
  };

  const handleHelp = () => {
    Haptics.selectionAsync();
    Alert.alert(
      "Help & Support",
      "For technical support or questions about the PLC monitoring system, please contact your system administrator.\n\nEmergency contact: +1 (555) 123-4567",
      [{ text: "OK" }]
    );
  };

  const handleConnectionSettings = () => {
    Haptics.selectionAsync();
    Alert.alert(
      "Connection Settings",
      "PLC connection settings are managed by your system administrator. Contact support if you're experiencing connectivity issues.",
      [{ text: "OK" }]
    );
  };

  const handleThresholdSettings = () => {
    Haptics.selectionAsync();
    Alert.alert(
      "Threshold Settings",
      "Parameter thresholds are configured per equipment. Navigate to individual equipment details to view current threshold settings.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <SettingsIcon size={28} color="#2563EB" />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1F2937",
              marginLeft: 12,
            }}
          >
            Settings
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            marginTop: 4,
          }}
        >
          App preferences and configurations
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <SettingSection title="Notifications">
          <ToggleRow
            icon={Bell}
            iconColor="#2563EB"
            title="Push Notifications"
            subtitle="Receive notifications on your device"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          
          <ToggleRow
            icon={AlertTriangle}
            iconColor="#DC2626"
            title="Critical Alerts"
            subtitle="Get notified for critical system issues"
            value={criticalAlerts}
            onValueChange={setCriticalAlerts}
          />
          
          <ToggleRow
            icon={AlertTriangle}
            iconColor="#D97706"
            title="Warning Alerts"
            subtitle="Get notified for warning conditions"
            value={warningAlerts}
            onValueChange={setWarningAlerts}
          />
          
          <ToggleRow
            icon={Info}
            iconColor="#059669"
            title="Status Changes"
            subtitle="Get notified when equipment status changes"
            value={statusChanges}
            onValueChange={setStatusChanges}
          />
          
          <ToggleRow
            icon={Bell}
            iconColor="#6B7280"
            title="Sound Alerts"
            subtitle="Play sound for critical alerts"
            value={soundAlerts}
            onValueChange={setSoundAlerts}
            isLast
          />
        </SettingSection>

        {/* Data & Sync */}
        <SettingSection title="Data & Sync">
          <ToggleRow
            icon={Clock}
            iconColor="#2563EB"
            title="Auto Refresh"
            subtitle="Automatically refresh data every 30 seconds"
            value={autoRefresh}
            onValueChange={setAutoRefresh}
          />
          
          <ToggleRow
            icon={Wifi}
            iconColor="#D97706"
            title="Offline Mode"
            subtitle="Use cached data when connection is unavailable"
            value={offlineMode}
            onValueChange={setOfflineMode}
          />
          
          <SettingRow
            icon={Download}
            iconColor="#059669"
            title="Export Data"
            subtitle="Export parameter history and alerts"
            onPress={handleExportData}
            showChevron
            isLast
          />
        </SettingSection>

        {/* System */}
        <SettingSection title="System">
          <ToggleRow
            icon={Moon}
            iconColor="#6B7280"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          
          <SettingRow
            icon={Shield}
            iconColor="#2563EB"
            title="Connection Settings"
            subtitle="PLC connection and security"
            onPress={handleConnectionSettings}
            showChevron
          />
          
          <SettingRow
            icon={AlertTriangle}
            iconColor="#D97706"
            title="Threshold Settings"
            subtitle="View parameter threshold configurations"
            onPress={handleThresholdSettings}
            showChevron
            isLast
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingRow
            icon={HelpCircle}
            iconColor="#2563EB"
            title="Help & Support"
            subtitle="Get help and technical support"
            onPress={handleHelp}
            showChevron
          />
          
          <SettingRow
            icon={Info}
            iconColor="#6B7280"
            title="About"
            subtitle="App version and information"
            onPress={handleAbout}
            showChevron
            isLast
          />
        </SettingSection>

        {/* Footer Info */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            padding: 16,
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Factory Monitoring System
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              textAlign: "center",
            }}
          >
            Version 1.0.0 • Last updated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}