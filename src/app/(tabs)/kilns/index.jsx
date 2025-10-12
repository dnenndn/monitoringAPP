import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Activity,
  Thermometer,
  Wind,
  Gauge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const STATUS_COLORS = {
  firing: "#059669",
  standby: "#D97706", 
  idle: "#6B7280",
  offline: "#DC2626",
};

function getParameterIcon(paramName) {
  const name = paramName.toLowerCase();
  if (name.includes('temp')) return Thermometer;
  if (name.includes('fan') || name.includes('speed')) return Wind;
  if (name.includes('pressure') || name.includes('gauge')) return Gauge;
  return Activity;
}

function getParameterStatus(value, min, max) {
  if (value < min || value > max) {
    return { color: "#DC2626", trend: "critical" };
  }
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
    return { color: "#D97706", trend: "warning" };
  }
  return { color: "#059669", trend: "normal" };
}

function KilnCard({ kiln, onPress, onTrendPress }) {
  const statusColor = STATUS_COLORS[kiln.status] || "#6B7280";
  const hasAlerts = kiln.alert_count > 0;
  const hasCriticalAlerts = kiln.critical_alerts > 0;

  // Get main temperature parameter for display
  const mainTemp = kiln.parameters?.find(p => 
    p.parameter_name.toLowerCase().includes('main') && 
    p.parameter_name.toLowerCase().includes('temp')
  );

  const handleTrendPress = (param) => {
    Haptics.selectionAsync();
    onTrendPress(param);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        borderLeftWidth: 4,
        borderLeftColor: hasCriticalAlerts ? "#DC2626" : statusColor,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Flame size={24} color={statusColor} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#1F2937",
              marginLeft: 12,
            }}
          >
            {kiln.name}
          </Text>
        </View>

        {hasAlerts && (
          <View
            style={{
              backgroundColor: hasCriticalAlerts ? "#DC2626" : "#D97706",
              borderRadius: 16,
              paddingHorizontal: 10,
              paddingVertical: 6,
              minWidth: 28,
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
              {kiln.alert_count}
            </Text>
          </View>
        )}
      </View>

      {/* Status and Main Temperature */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 4,
            }}
          >
            Status
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: statusColor,
              textTransform: "capitalize",
            }}
          >
            {kiln.status}
          </Text>
        </View>

        {mainTemp && (
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              Main Temperature
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: getParameterStatus(
                  mainTemp.current_value,
                  mainTemp.min_threshold,
                  mainTemp.max_threshold
                ).color,
              }}
            >
              {mainTemp.current_value}°C
            </Text>
          </View>
        )}
      </View>

      {/* Key Parameters Grid */}
      {kiln.parameters && kiln.parameters.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 12,
              fontWeight: "600",
            }}
          >
            Key Parameters
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {kiln.parameters.slice(0, 4).map((param) => {
              const Icon = getParameterIcon(param.parameter_name);
              const status = getParameterStatus(
                param.current_value,
                param.min_threshold,
                param.max_threshold
              );

              return (
                <TouchableOpacity
                  key={param.id}
                  onPress={() => handleTrendPress(param)}
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 12,
                    padding: 12,
                    flex: 1,
                    minWidth: "45%",
                    borderWidth: 1,
                    borderColor: status.color + "20",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Icon size={14} color={status.color} />
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: status.color,
                        marginLeft: "auto",
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      marginBottom: 4,
                    }}
                  >
                    {param.parameter_name}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: status.color,
                    }}
                  >
                    {param.current_value} {param.unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {kiln.parameters.length > 4 && (
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 12,
                fontStyle: "italic",
              }}
            >
              +{kiln.parameters.length - 4} more parameters • Tap to view details
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function KilnsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch equipment list filtered for kilns
  const {
    data: kilns,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["kilns"],
    queryFn: async () => {
      const response = await fetch("/api/equipment");
      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }
      const data = await response.json();

      // Filter for kilns and fetch their parameters
      const kilnData = data.equipment.filter(eq => eq.type === 'kiln');
      
      const kilnsWithParams = await Promise.all(
        kilnData.map(async (kiln) => {
          try {
            const paramResponse = await fetch(`/api/equipment/${kiln.id}`);
            if (paramResponse.ok) {
              const paramData = await paramResponse.json();
              return paramData.equipment;
            }
            return kiln;
          } catch (_) {
            // Failed to fetch parameters for this kiln; swallow to avoid noisy logs in production
            return kiln;
          }
        })
      );

      return kilnsWithParams;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["kilns"] });
    setRefreshing(false);
  };

  const handleKilnPress = (kiln) => {
    Haptics.selectionAsync();
    router.push(`/kilns/${kiln.id}`);
  };

  const handleTrendPress = (parameter) => {
    router.push(`/kilns/trend/${parameter.id}`);
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
          Failed to load kilns
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
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Try Again
          </Text>
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
          <Flame size={28} color="#2563EB" />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1F2937",
              marginLeft: 12,
            }}
          >
            Kilns
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            marginTop: 4,
          }}
        >
          High-temperature processing units
        </Text>
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
              Loading kiln data...
            </Text>
          </View>
        )}

        {/* Kilns List */}
        {kilns && kilns.length > 0 ? (
          kilns.map((kiln) => (
            <KilnCard
              key={kiln.id}
              kiln={kiln}
              onPress={() => handleKilnPress(kiln)}
              onTrendPress={handleTrendPress}
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
              <Flame size={48} color="#6B7280" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#374151",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No Kilns Found
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                No kiln equipment is currently configured
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}