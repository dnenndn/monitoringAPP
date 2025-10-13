import React, { useState } from "react";
import PropTypes from "prop-types";
import { Svg, Path, Circle, Rect } from "react-native-svg";

// SimpleLineChart: top-level fallback component using react-native-svg
const SimpleLineChart = ({ points, width, height, color = "#2563EB" }) => {
  if (!points || points.length === 0) return null;

  const values = points.map((p) => p.value || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.1 || 1;
  const top = max + pad;
  const bottom = min - pad;
  const range = top - bottom || 1;
  const n = points.length;
  const xStep = n === 1 ? width / 2 : width / (n - 1);

  const coords = points.map((p, i) => {
    const x = i * xStep;
    const y = ((top - p.value) / range) * height;
    return { x, y, key: p.date ? +p.date : i };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      <Path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c) => (
        <Circle key={c.key} cx={c.x} cy={c.y} r={1.6} fill={color} />
      ))}
    </Svg>
  );
};

SimpleLineChart.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({ date: PropTypes.instanceOf(Date), value: PropTypes.number })
  ).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  color: PropTypes.string,
};

// Helper: timeout a promise to avoid indefinite hangs
const withTimeout = (p, ms = 10000) => new Promise((resolve, reject) => {
  let finished = false;
  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      reject(new Error(`Request timed out after ${ms}ms`));
    }
  }, ms);
  Promise.resolve(p)
    .then((v) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(v);
      }
    })
    .catch((err) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        reject(err);
      }
    });
});
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
  Wind,
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../../../../utils/supabaseClient";

const TIME_PERIODS = [
  { label: "1/2H", hours: 0.5 },
  { label: "1H", hours: 1 },
  { label: "2H", hours: 2 },
  { label: "4H", hours: 4 },
  { label: "8H", hours: 8 },
];

// -----------------------------
// Icon + Status Helpers
// -----------------------------
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
    return { color: "#DC2626", label: "CRITICAL", bg: "#FEE2E2" };
  }
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
    return { color: "#D97706", label: "WARNING", bg: "#FEF3C7" };
  }
  return { color: "#059669", label: "NORMAL", bg: "#D1FAE5" };
}

function getTrendDirection(data) {
  if (data.length < 2) return { icon: Minus, color: "#6B7280", label: "NO DATA" };
console.log("-----getTrendDirection------");
  const recent = data.slice(-5);
  const older = data.slice(-10, -5);
  if (recent.length === 0 || older.length === 0)
    return { icon: Minus, color: "#6B7280", label: "NO DATA" };

  const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
  const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;
  const diff = recentAvg - olderAvg;
  const threshold = Math.abs(olderAvg) * 0.02;

  if (Math.abs(diff) < threshold) return { icon: Minus, color: "#6B7280", label: "STABLE" };
  if (diff > 0) return { icon: TrendingUp, color: "#059669", label: "RISING" };
  return { icon: TrendingDown, color: "#DC2626", label: "FALLING" };
}

// -----------------------------
// Component
// -----------------------------
export default function DryerTrendScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[3]); // Default: 24H
  const [refreshing, setRefreshing] = useState(false);

  const windowWidth = Dimensions.get("window").width;
  const graphWidth = windowWidth - 40;

  // -----------------------------
  // Guarded imports (for Expo/web safety)
  // -----------------------------
  let LineGraphComp = null;
  let GestureHandlerRootViewComp = null;

  try {
    const _lg = require("react-native-graph");
    LineGraphComp = _lg?.LineGraph ?? null;
  } catch {
    LineGraphComp = null;
  }

  try {
    const _gh = require("react-native-gesture-handler");
    GestureHandlerRootViewComp = _gh?.GestureHandlerRootView ?? null;
  } catch {
    GestureHandlerRootViewComp = null;
  }

  const Wrapper = GestureHandlerRootViewComp || View;

  // -----------------------------
  // Supabase Queries
  // -----------------------------
  const {
    data: parameter,
    isLoading: paramLoading,
    error: paramError,
  } = useQuery({
    queryKey: ["parameter", id],
    queryFn: async () => {
      const fn = async () => {
        const { data, error } = await supabase
          .from("plc_parameters")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        return data;
      };
      return withTimeout(fn(), 10000);
    },
    enabled: !!id,
    retry: 1,
    staleTime: 1000 * 30,
  });

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ["parameter-history", id, selectedPeriod.hours],
    queryFn: async () => {
      const since = new Date(Date.now() - selectedPeriod.hours * 3600 * 1000).toISOString();
      const fn = async () => {
        const { data, error } = await supabase
          .from("parameter_history")
          .select("timestamp, value")
          .eq("parameter_id", id)
          .gte("timestamp", since)
          .order("timestamp", { ascending: true });
        if (error) throw error;
        return data.map((p) => ({ date: new Date(p.timestamp), value: parseFloat(p.value) }));
      };
      return withTimeout(fn(), 12000);
    },
    enabled: !!parameter,
    retry: 1,
    staleTime: 1000 * 30,
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

  // -----------------------------
  // UI States
  // -----------------------------
  if (paramError || historyError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <AlertTriangle size={48} color="#DC2626" />
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#DC2626", marginTop: 12 }}>
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
        <Text style={{ fontSize: 16, color: "#6B7280" }}>Loading trend data...</Text>
      </View>
    );
  }

  const Icon = getParameterIcon(parameter?.parameter_name || "");
  const status = parameter
    ? getParameterStatus(parameter.current_value, parameter.min_threshold, parameter.max_threshold)
    : { color: "#6B7280", label: "UNKNOWN", bg: "#F3F4F6" };

  const trend =
    historyData && historyData.length > 0
      ? getTrendDirection(historyData)
      : { icon: Minus, color: "#6B7280", label: "NO DATA" };
  const TrendIcon = trend.icon;

  // Extract chart block to avoid nested ternary in JSX (easier to read and lints cleanly)
  let chartContent = null;
  if (historyData?.length > 0) {
    if (LineGraphComp) {
      chartContent = (
        <View style={{ height: 250, width: "100%" }}>
          <LineGraphComp
            points={historyData}
            color="#2563EB"
            animated
            enablePanGesture
            style={{ width: "100%", height: "100%" }}
            gradientFillColors={["rgba(37, 99, 235, 0.2)", "rgba(37, 99, 235, 0)"]}
            xLength={historyData.length}
            height={250}
            width={graphWidth}
          />
        </View>
      );
    } else {
      // Use lightweight SVG fallback when react-native-graph is not available
      chartContent = (
        <View style={{ height: 250, width: "100%", justifyContent: 'center', alignItems: 'center' }}>
          <SimpleLineChart points={historyData} width={graphWidth} height={220} color="#2563EB" />
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
            historyData length: {historyData.length}
          </Text>
        </View>
      );
    }
  } else {
    chartContent = (
      <View style={{ height: 250, justifyContent: "center", alignItems: "center" }}>
        <Activity size={48} color="#6B7280" />
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 12 }}>
          No Historical Data
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 4 }}>
          No data available for the selected time period
        </Text>
      </View>
    );
  }

  // -----------------------------
  // Main Render
  // -----------------------------
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={handleBack} style={{ marginRight: 16, padding: 4 }}>
              <ArrowLeft size={24} color="#6B7280" />
            </TouchableOpacity>

            <Wind size={28} color="#2563EB" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1F2937" }}>
                {parameter?.equipment_name || "Dryer"} Trend
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>{parameter?.parameter_name}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Value */}
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
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Icon size={20} color="#6B7280" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginLeft: 8 }}>
                Current Value
              </Text>
            </View>

            <Text style={{ fontSize: 36, fontWeight: "bold", color: status.color, marginBottom: 8 }}>
              {parameter?.current_value}
              <Text style={{ fontSize: 20, color: "#6B7280" }}> {parameter?.unit}</Text>
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View
                style={{
                  backgroundColor: status.bg,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: status.color }}>{status.label}</Text>
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
                <Text style={{ fontSize: 12, fontWeight: "600", color: trend.color, marginLeft: 4 }}>
                  {trend.label}
                </Text>
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
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
              Time Period
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {TIME_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.label}
                  onPress={() => handlePeriodChange(period)}
                  style={{
                    backgroundColor:
                      selectedPeriod.label === period.label ? "#2563EB" : "#F3F4F6",
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
                      color:
                        selectedPeriod.label === period.label ? "#FFFFFF" : "#6B7280",
                      textAlign: "center",
                    }}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chart */}
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
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 16 }}>
              Trend Chart - {selectedPeriod.label}
            </Text>

            {chartContent}
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
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 16 }}>
                Parameter Information
              </Text>
              <View style={{ gap: 12 }}>
                <InfoRow label="Operating Range" value={`${parameter.min_range} - ${parameter.max_range} ${parameter.unit}`} />
                <InfoRow label="Alert Thresholds" value={`${parameter.min_threshold} - ${parameter.max_threshold} ${parameter.unit}`} />
                <InfoRow label="Last Updated" value={new Date(parameter.last_updated).toLocaleString()} />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Wrapper>
  );
}

// Small helper subcomponent
const InfoRow = ({ label, value }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <Text style={{ fontSize: 14, color: "#6B7280" }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>{value}</Text>
  </View>
);

InfoRow.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};
