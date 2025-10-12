import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
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

const TIME_PERIODS = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "12H", hours: 12 },
  { label: "24H", hours: 24 },
  { label: "7D", hours: 168 },
];

function getParameterIcon(paramName) {
  const name = paramName.toLowerCase();
  if (name.includes('temp')) return Thermometer;
  if (name.includes('fan') || name.includes('speed')) return Wind;
  if (name.includes('pressure') || name.includes('gauge')) return Gauge;
  return Activity;
}

function getParameterStatus(value, min, max) {
  if (value < min || value > max) {
    return { 
      color: "#DC2626", 
      label: "CRITICAL",
      bg: "#FEE2E2"
    };
  }
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
    return { 
      color: "#D97706", 
      label: "WARNING",
      bg: "#FEF3C7"
    };
  }
  return { 
    color: "#059669", 
    label: "NORMAL",
    bg: "#D1FAE5"
  };
}

function getTrendDirection(data) {
  if (data.length < 2) return { icon: Minus, color: "#6B7280", label: "NO DATA" };
  
  const recent = data.slice(-5);
  const older = data.slice(-10, -5);
  
  if (recent.length === 0 || older.length === 0) return { icon: Minus, color: "#6B7280", label: "NO DATA" };
  
  const recentAvg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
  const olderAvg = older.reduce((sum, point) => sum + point.value, 0) / older.length;
  
  const difference = recentAvg - olderAvg;
  const threshold = Math.abs(olderAvg) * 0.02; // 2% threshold
  
  if (Math.abs(difference) < threshold) {
    return { icon: Minus, color: "#6B7280", label: "STABLE" };
  } else if (difference > 0) {
    return { icon: TrendingUp, color: "#059669", label: "RISING" };
  } else {
    return { icon: TrendingDown, color: "#DC2626", label: "FALLING" };
  }
}

export default function KilnTrendScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[3]); // Default to 24H
  const [refreshing, setRefreshing] = useState(false);
  
  const windowWidth = Dimensions.get("window").width;
  const graphWidth = windowWidth - 40;

  // Guarded dynamic requires: react-native-graph and react-native-gesture-handler
  // can crash at module-evaluation time on some dev setups (native reanimated errors).
  // Require them lazily and fall back to safe placeholders so the route can register.
  let LineGraphComp = null;
  let GestureHandlerRootViewComp = null;
  try {
    // require inside try to avoid throwing during module evaluation
    // prefer CommonJS require because these packages may export CJS in RN
    // eslint-disable-next-line global-require
    LineGraphComp = require('react-native-graph').LineGraph;
  } catch {
    LineGraphComp = null;
  }

  try {
    // eslint-disable-next-line global-require
    GestureHandlerRootViewComp = require('react-native-gesture-handler').GestureHandlerRootView;
  } catch {
    GestureHandlerRootViewComp = null;
  }

  const Wrapper = GestureHandlerRootViewComp || View;

  // Fetch parameter details
  const {
    data: parameter,
    isLoading: paramLoading,
    error: paramError,
  } = useQuery({
    queryKey: ["parameter", id],
    queryFn: async () => {
      const response = await fetch(`/api/parameters/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch parameter details");
      }
      const data = await response.json();
      return data.parameter;
    },
  });

  // Fetch historical data
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ["parameter-history", id, selectedPeriod.hours],
    queryFn: async () => {
      const response = await fetch(`/api/parameters/${id}/history?hours=${selectedPeriod.hours}`);
      if (!response.ok) {
        throw new Error("Failed to fetch parameter history");
      }
      const data = await response.json();
      return data.history.map(point => ({
        date: new Date(point.timestamp),
        value: parseFloat(point.value)
      }));
    },
    enabled: !!parameter,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["parameter", id] });
    await queryClient.invalidateQueries({ queryKey: ["parameter-history", id] });
    setRefreshing(false);
  };

  const handlePeriodChange = (period) => {
    Haptics.selectionAsync();
    setSelectedPeriod(period);
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  if (paramError || historyError) {
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
          Failed to load trend data
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

  if (paramLoading || historyLoading) {
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
          Loading trend data...
        </Text>
      </View>
    );
  }

  const Icon = getParameterIcon(parameter?.parameter_name || '');
  const status = parameter ? getParameterStatus(
    parameter.current_value,
    parameter.min_threshold,
    parameter.max_threshold
  ) : { color: "#6B7280", label: "UNKNOWN", bg: "#F3F4F6" };

  const trend = historyData && historyData.length > 0 ? getTrendDirection(historyData) : 
    { icon: Minus, color: "#6B7280", label: "NO DATA" };
  const TrendIcon = trend.icon;

  return (
    <Wrapper style={{ flex: 1 }}>
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

            <Flame size={28} color="#2563EB" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1F2937",
                }}
              >
                {parameter?.equipment_name || 'Kiln'} Trend
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                }}
              >
                {parameter?.parameter_name}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
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
          {/* Current Value Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
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
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Icon size={20} color="#6B7280" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1F2937",
                      marginLeft: 8,
                    }}
                  >
                    Current Value
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "bold",
                    color: status.color,
                    marginBottom: 8,
                  }}
                >
                  {parameter?.current_value}
                  <Text style={{ fontSize: 20, color: "#6B7280" }}>
                    {" "}{parameter?.unit}
                  </Text>
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: status.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
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

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: trend.color + "20",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <TrendIcon size={14} color={trend.color} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: trend.color,
                        marginLeft: 4,
                      }}
                    >
                      {trend.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Time Period Selector */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 12,
              }}
            >
              Time Period
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              {TIME_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.label}
                  onPress={() => handlePeriodChange(period)}
                  style={{
                    backgroundColor: selectedPeriod.label === period.label ? "#2563EB" : "#F3F4F6",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flex: 1,
                    marginHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: selectedPeriod.label === period.label ? "#FFFFFF" : "#6B7280",
                      textAlign: "center",
                    }}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chart Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 16,
              }}
            >
              Trend Chart - {selectedPeriod.label}
            </Text>

            {historyData && historyData.length > 0 ? (
              <View style={{ height: 250, width: "100%" }}>
                {LineGraphComp ? (
                  <LineGraphComp
                    points={historyData}
                    color="#2563EB"
                    animated={true}
                    enablePanGesture={true}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    gradientFillColors={[
                      "rgba(37, 99, 235, 0.2)",
                      "rgba(37, 99, 235, 0)",
                    ]}
                    xLength={historyData.length}
                    height={250}
                    width={graphWidth}
                    /* TopAxisLabel and BottomAxisLabel removed to avoid inline component
                       definitions that can trigger lint/runtime warnings in some envs. */
                  />
                ) : (
                  <View style={{ height: 250, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
                      Charts are not available in this environment.
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                      (Missing native module: react-native-graph or reanimated)
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View
                style={{
                  height: 250,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Activity size={48} color="#6B7280" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#374151",
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  No Historical Data
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  No data available for the selected time period
                </Text>
              </View>
            )}
          </View>

          {/* Parameter Info */}
          {parameter && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                marginTop: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1F2937",
                  marginBottom: 16,
                }}
              >
                Parameter Information
              </Text>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>Operating Range</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                    {parameter.min_range} - {parameter.max_range} {parameter.unit}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>Alert Thresholds</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                    {parameter.min_threshold} - {parameter.max_threshold} {parameter.unit}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>Last Updated</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                    {new Date(parameter.last_updated).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Wrapper>
  );
}