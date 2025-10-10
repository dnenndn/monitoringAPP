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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Wind,
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  AlertTriangle,
  TrendingUp,
  Settings,
  BarChart3,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const STATUS_COLORS = {
  drying: "#059669",
  standby: "#D97706",
  idle: "#6B7280",
  offline: "#DC2626",
};

function getParameterIcon(paramName) {
  const name = paramName.toLowerCase();
  if (name.includes("temp")) return Thermometer;
  if (name.includes("humidity")) return Droplets;
  if (name.includes("fan") || name.includes("speed")) return Wind;
  if (name.includes("pressure") || name.includes("valve")) return Gauge;
  return Activity;
}

function getParameterStatus(value, min, max) {
  if (value < min || value > max) {
    return {
      color: "#DC2626",
      label: "CRITICAL",
      bg: "#FEE2E2",
    };
  }
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
    return {
      color: "#D97706",
      label: "WARNING",
      bg: "#FEF3C7",
    };
  }
  return {
    color: "#059669",
    label: "NORMAL",
    bg: "#D1FAE5",
  };
}

function ParameterCard({ parameter, onTrendPress }) {
  const Icon = getParameterIcon(parameter.parameter_name);
  const status = getParameterStatus(
    parameter.current_value,
    parameter.min_threshold,
    parameter.max_threshold,
  );

  const progressPercentage = Math.min(
    Math.max(
      ((parameter.current_value - parameter.min_range) /
        (parameter.max_range - parameter.min_range)) *
        100,
      0,
    ),
    100,
  );

  return (
    <TouchableOpacity
      onPress={() => onTrendPress(parameter)}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: status.color,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Icon size={18} color="#6B7280" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginLeft: 8,
              }}
            >
              {parameter.parameter_name}
            </Text>
          </View>

          {/* Current Value */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: status.color,
              marginBottom: 4,
            }}
          >
            {parameter.current_value}
            <Text style={{ fontSize: 20, color: "#6B7280" }}>
              {" "}
              {parameter.unit}
            </Text>
          </Text>

          {/* Status Badge */}
          <View
            style={{
              backgroundColor: status.bg,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: status.color,
              }}
            >
              {status.label}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onTrendPress(parameter)}
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <BarChart3 size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Range Bar */}
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            height: 6,
            backgroundColor: "#F3F4F6",
            borderRadius: 3,
            position: "relative",
          }}
        >
          {/* Progress fill */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 6,
              width: `${progressPercentage}%`,
              backgroundColor: status.color,
              borderRadius: 3,
            }}
          />

          {/* Threshold markers */}
          <View
            style={{
              position: "absolute",
              left: `${
                ((parameter.min_threshold - parameter.min_range) /
                  (parameter.max_range - parameter.min_range)) *
                100
              }%`,
              top: -2,
              width: 2,
              height: 10,
              backgroundColor: "#DC2626",
            }}
          />
          <View
            style={{
              position: "absolute",
              left: `${
                ((parameter.max_threshold - parameter.min_range) /
                  (parameter.max_range - parameter.min_range)) *
                100
              }%`,
              top: -2,
              width: 2,
              height: 10,
              backgroundColor: "#DC2626",
            }}
          />
        </View>

        {/* Range Labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            {parameter.min_range} {parameter.unit}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            Thresholds: {parameter.min_threshold} - {parameter.max_threshold}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            {parameter.max_range} {parameter.unit}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DryerDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dryer details
  const {
    data: dryer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dryer", id],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dryer details");
      }
      const data = await response.json();
      return data.equipment;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["dryer", id] });
    setRefreshing(false);
  };

  const handleTrendPress = (parameter) => {
    Haptics.selectionAsync();
    router.push(`/(tabs)/dryers/trend/${parameter.id}`);
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
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
          Failed to load dryer details
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

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Loading dryer details...
        </Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[dryer.status] || "#6B7280";

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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{
              marginRight: 16,
              padding: 4,
            }}
          >
            <ArrowLeft size={24} color="#6B7280" />
          </TouchableOpacity>

          <Wind size={28} color={statusColor} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#1F2937",
              marginLeft: 12,
            }}
          >
            {dryer.name}
          </Text>
        </View>

        {/* Status and Last Updated */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 44,
          }}
        >
          <View
            style={{
              backgroundColor: statusColor + "20",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: statusColor,
                textTransform: "uppercase",
              }}
            >
              {dryer.status}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            Updated: {new Date(dryer.updated_at).toLocaleTimeString()}
          </Text>
        </View>
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
        {/* Parameters List */}
        {dryer.parameters && dryer.parameters.length > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 16,
              }}
            >
              PLC Data Parameters
            </Text>

            {dryer.parameters.map((parameter) => (
              <ParameterCard
                key={parameter.id}
                parameter={parameter}
                onTrendPress={handleTrendPress}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              padding: 40,
              alignItems: "center",
            }}
          >
            <Activity size={48} color="#6B7280" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#374151",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              No Parameters Configured
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              No PLC parameters are configured for this dryer
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
