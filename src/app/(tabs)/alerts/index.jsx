import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Clock,
  Flame,
  Wind,
  Filter,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const ALERT_TYPE_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: "#DC2626",
    bg: "#FEE2E2",
    label: "Critical",
  },
  warning: {
    icon: AlertCircle,
    color: "#D97706",
    bg: "#FEF3C7",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "#2563EB",
    bg: "#DBEAFE",
    label: "Info",
  },
  status_change: {
    icon: Info,
    color: "#059669",
    bg: "#D1FAE5",
    label: "Status Change",
  },
};

const EQUIPMENT_ICONS = {
  kiln: Flame,
  dryer: Wind,
};

function AlertCard({ alert, onAcknowledge }) {
  const config = ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.info;
  const Icon = config.icon;
  const EquipmentIcon = EQUIPMENT_ICONS[alert.equipment_type] || Bell;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const handleAcknowledge = () => {
    Alert.alert(
      "Acknowledge Alert",
      `Are you sure you want to acknowledge this ${config.label.toLowerCase()} alert?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Acknowledge",
          style: "default",
          onPress: () => {
            Haptics.selectionAsync();
            onAcknowledge(alert.id);
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: config.color,
        opacity: alert.is_acknowledged ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            backgroundColor: config.bg,
            borderRadius: 8,
            padding: 8,
            marginRight: 12,
          }}
        >
          <Icon size={20} color={config.color} />
        </View>

        <View style={{ flex: 1 }}>
          {/* Alert Type and Time */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: config.color,
                textTransform: "uppercase",
                marginRight: 8,
              }}
            >
              {config.label}
            </Text>
            
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Clock size={12} color="#6B7280" />
              <Text
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  marginLeft: 4,
                }}
              >
                {formatTime(alert.created_at)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: 4,
            }}
          >
            {alert.title}
          </Text>

          {/* Equipment Info */}
          {alert.equipment_name && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <EquipmentIcon size={14} color="#6B7280" />
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginLeft: 6,
                }}
              >
                {alert.equipment_name}
                {alert.parameter_name && ` • ${alert.parameter_name}`}
              </Text>
            </View>
          )}

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              color: "#4B5563",
              lineHeight: 20,
            }}
          >
            {alert.message}
          </Text>
        </View>

        {/* Actions */}
        {!alert.is_acknowledged && (
          <TouchableOpacity
            onPress={handleAcknowledge}
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 6,
              padding: 8,
              marginLeft: 8,
            }}
          >
            <CheckCircle size={16} color="#059669" />
          </TouchableOpacity>
        )}
      </View>

      {/* Acknowledged Badge */}
      {alert.is_acknowledged && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F3F4F6",
            borderRadius: 6,
            padding: 8,
            alignSelf: "flex-start",
          }}
        >
          <CheckCircle size={12} color="#059669" />
          <Text
            style={{
              fontSize: 12,
              color: "#059669",
              marginLeft: 4,
              fontWeight: "500",
            }}
          >
            Acknowledged {formatTime(alert.acknowledged_at)}
          </Text>
        </View>
      )}
    </View>
  );
}

function FilterButton({ active, onPress, children, count }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: active ? "#2563EB" : "#F3F4F6",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: active ? "#FFFFFF" : "#6B7280",
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {children}
      </Text>
      {count !== undefined && (
        <View
          style={{
            backgroundColor: active ? "#FFFFFF" : "#D1D5DB",
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginLeft: 6,
            minWidth: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: active ? "#2563EB" : "#6B7280",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("active"); // active, all, critical, warning

  // Fetch alerts
  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch("/api/alerts");
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      return data.alerts;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["kilns"] });
      queryClient.invalidateQueries({ queryKey: ["dryers"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert("Error", "Failed to acknowledge alert");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    setRefreshing(false);
  };

  const handleAcknowledgeAlert = (alertId) => {
    acknowledgeAlertMutation.mutate(alertId);
  };

  // Filter alerts
  const filteredAlerts = alerts?.filter((alert) => {
    switch (filter) {
      case "active":
        return !alert.is_acknowledged;
      case "critical":
        return alert.alert_type === "critical";
      case "warning":
        return alert.alert_type === "warning";
      case "all":
      default:
        return true;
    }
  }) || [];

  // Count alerts by type
  const alertCounts = {
    active: alerts?.filter(a => !a.is_acknowledged).length || 0,
    critical: alerts?.filter(a => a.alert_type === "critical").length || 0,
    warning: alerts?.filter(a => a.alert_type === "warning").length || 0,
    all: alerts?.length || 0,
  };

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <AlertTriangle size={48} color="#DC2626" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#DC2626",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Failed to load alerts
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginTop: 16,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Bell size={28} color="#2563EB" />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1F2937",
              marginLeft: 12,
            }}
          >
            Alerts
          </Text>
          
          {alertCounts.active > 0 && (
            <View
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginLeft: 12,
                minWidth: 24,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {alertCounts.active}
              </Text>
            </View>
          )}
        </View>
        
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            marginTop: 4,
          }}
        >
          System notifications and alerts
        </Text>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
        >
          <FilterButton
            active={filter === "active"}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("active");
            }}
            count={alertCounts.active}
          >
            Active
          </FilterButton>
          
          <FilterButton
            active={filter === "critical"}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("critical");
            }}
            count={alertCounts.critical}
          >
            Critical
          </FilterButton>
          
          <FilterButton
            active={filter === "warning"}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("warning");
            }}
            count={alertCounts.warning}
          >
            Warning
          </FilterButton>
          
          <FilterButton
            active={filter === "all"}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("all");
            }}
            count={alertCounts.all}
          >
            All
          </FilterButton>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {isLoading && (
          <View
            style={{
              padding: 40,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Loading alerts...
            </Text>
          </View>
        )}

        {/* Alerts List */}
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledgeAlert}
            />
          ))
        ) : (
          !isLoading && (
            <View
              style={{
                padding: 40,
                alignItems: "center",
              }}
            >
              <CheckCircle size={48} color="#059669" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#374151",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                {filter === "active" ? "No Active Alerts" : `No ${filter === "all" ? "" : filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts`}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {filter === "active" 
                  ? "All systems are operating normally"
                  : `No ${filter === "all" ? "" : filter} alerts found`
                }
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}