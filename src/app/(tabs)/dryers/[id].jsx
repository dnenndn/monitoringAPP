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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../utils/supabaseClient";
import {
  ArrowLeft,
  Wind,
  Gauge,
  Droplets,
  Activity,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const STATUS = {
  normal: {
    bg: "rgba(34, 197, 94, 0.1)",
    border: "rgba(34, 197, 94, 0.3)",
    glow: "rgba(34, 197, 94, 0.4)",
    color: "#22c55e",
  },
  warning: {
    bg: "rgba(249, 115, 22, 0.1)",
    border: "rgba(249, 115, 22, 0.3)",
    glow: "rgba(249, 115, 22, 0.4)",
    color: "#f97316",
  },
  critical: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    glow: "rgba(239, 68, 68, 0.4)",
    color: "#ef4444",
  },
};

const getStatus = (val, min, max) => {
  if (val < min || val > max) return STATUS.critical;
  if (val < min + (max - min) * 0.1 || val > max - (max - min) * 0.1)
    return STATUS.warning;
  return STATUS.normal;
};

export default function DryerDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: dryer, isLoading, isError } = useQuery({
    queryKey: ["dryer", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("*, plc_parameters(*)")
        .eq("id", id)
        .single();
      if (data && Array.isArray(data.plc_parameters)) {
        data.parameters = data.plc_parameters;
      }
      return data;
    },
    enabled: !!id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries(["dryer", id]);
    setRefreshing(false);
  };

  const handleTrendPress = (param) => {
    Haptics.selectionAsync();
    router.push(`/(tabs)/dryers/trend/${param.id}`);
  };

  // 🧱 Loading or Error State
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading dryer data...</Text>
      </View>
    );
  }

  if (isError || !dryer) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error loading dryer data.</Text>
      </View>
    );
  }

  try {
    return (
      <View style={{ flex: 1, backgroundColor: "#f6f7f8" }}>
        <StatusBar style="dark" />

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 18,
              fontWeight: "700",
              color: "#1f2937",
            }}
          >
            {dryer?.name || "Dryer Details"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Parameters */}
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {dryer?.parameters?.map((param) => {
              console.log("Param:", param); // 🧭 Debug log

              const currentValue =
                typeof param.current_value === "object"
                  ? JSON.stringify(param.current_value)
                  : param.current_value ?? "N/A";

              const s = getStatus(
                Number(param.current_value) || 0,
                param.min_threshold,
                param.max_threshold
              );

              const Icon =
                param.parameter_name?.toLowerCase().includes("temp")
                  ? Wind
                  : param.parameter_name?.toLowerCase().includes("humidity")
                  ? Droplets
                  : param.parameter_name?.toLowerCase().includes("pressure")
                  ? Gauge
                  : Activity;

              const percent =
                ((Number(param.current_value) - param.min_range) /
                  (param.max_range - param.min_range)) *
                100;

              return (
                <TouchableOpacity
                  key={param.id}
                  onPress={() => handleTrendPress(param)}
                  style={{
                    width: "48%",
                    backgroundColor: s.bg,
                    borderColor: s.border,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 12,
                    shadowColor: s.glow,
                    shadowOpacity: 1,
                    shadowRadius: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon size={16} color={s.color} />
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        marginLeft: 6,
                        fontWeight: "600",
                        color: "#1f2937",
                        fontSize: 13,
                      }}
                    >
                      {param.parameter_name || "Unnamed Param"}
                    </Text>
                  </View>

                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 28,
                      fontWeight: "700",
                      color: s.color,
                      marginVertical: 6,
                    }}
                  >
                    {currentValue}
                    <Text style={{ fontSize: 16, color: "#6b7280" }}>
                      {" "}
                      {param.unit}
                    </Text>
                  </Text>

                  <Text
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      textAlign: "center",
                      marginBottom: 4,
                    }}
                  >
                    Range: {param.min_range}-{param.max_range} {param.unit}
                  </Text>

                  <View
                    style={{
                      height: 6,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.max(0, Math.min(percent, 100))}%`,
                        height: 6,
                        backgroundColor: s.color,
                      }}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Nav */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            flexDirection: "row",
            justifyContent: "space-around",
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
          }}
        >
          {[
            { label: "Dashboard", icon: "📊" },
            { label: "Kilns", icon: "🔥" },
            { label: "Dryers", icon: "💨", active: true },
            { label: "Alerts", icon: "🔔" },
            { label: "Settings", icon: "⚙️" },
          ].map((tab, i) => (
            <TouchableOpacity key={i} style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  opacity: tab.active ? 1 : 0.5,
                }}
              >
                {tab.icon}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: tab.active ? "#1193d4" : "#6b7280",
                  fontWeight: tab.active ? "700" : "500",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  } catch (e) {
    console.error("Render error:", e);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error rendering DryerDetailScreen.</Text>
      </View>
    );
  }
}
