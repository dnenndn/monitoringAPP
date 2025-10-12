import React, { useState, useEffect , useCallback} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  Thermometer,
  Droplets,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../../../utils/supabaseClient";

const STATUS_COLORS = {
  firing: "#059669", // green
  drying: "#059669", // green
  standby: "#D97706", // orange
  idle: "#6B7280", // gray
  offline: "#DC2626", // red
};

const STATUS_ICONS = {
  firing: Activity,
  drying: Activity,
  standby: AlertCircle,
  idle: XCircle,
  offline: XCircle,
};

function SystemStatusCard({ status }) {
  const isConnected = status?.is_connected;
  const isOffline = status?.offline_mode;

  return (
    <View
      style={{
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: isConnected ? "#10B981" : "#EF4444",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {isConnected ? (
          <Wifi size={20} color="#10B981" />
        ) : (
          <WifiOff size={20} color="#EF4444" />
        )}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#1F2937",
            marginLeft: 8,
          }}
        >
          PLC System Status
        </Text>
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: isConnected ? "#10B981" : "#EF4444",
          marginBottom: 4,
        }}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </Text>

      {isOffline && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEF3C7",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginTop: 8,
          }}
        >
          <AlertTriangle size={16} color="#D97706" />
          <Text
            style={{
              color: "#92400E",
              fontSize: 12,
              fontWeight: "500",
              marginLeft: 4,
            }}
          >
            Operating in Offline Mode
          </Text>
        </View>
      )}
    </View>
  );
}

function EquipmentCard({ equipment, onPress }) {
  const StatusIcon = STATUS_ICONS[equipment.status] || Activity;
  const statusColor = STATUS_COLORS[equipment.status] || "#6B7280";
  const hasAlerts = equipment.alert_count > 0;
  const hasCriticalAlerts = equipment.critical_alerts > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: hasCriticalAlerts ? "#DC2626" : statusColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#1F2937",
              marginBottom: 4,
            }}
          >
            {equipment.name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <StatusIcon size={16} color={statusColor} />
            <Text
              style={{
                fontSize: 14,
                color: statusColor,
                fontWeight: "500",
                marginLeft: 6,
                textTransform: "capitalize",
              }}
            >
              {equipment.status}
            </Text>
          </View>
        </View>

        {hasAlerts && (
          <View
            style={{
              backgroundColor: hasCriticalAlerts ? "#DC2626" : "#D97706",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
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
              {equipment.alert_count}
            </Text>
          </View>
        )}
      </View>

      {/* Equipment parameters preview */}
      {equipment.parameters && equipment.parameters.length > 0 && (
        <View>
          {equipment.parameters.slice(0, 2).map((param) => {
            const isOutOfRange =
              param.current_value < param.min_threshold ||
              param.current_value > param.max_threshold;

            return (
              <View
                key={param.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth:
                    equipment.parameters.indexOf(param) === 1 ? 0 : 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {param.parameter_name.toLowerCase().includes("temp") ? (
                    <Thermometer size={14} color="#6B7280" />
                  ) : (
                    <Droplets size={14} color="#6B7280" />
                  )}
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      marginLeft: 6,
                    }}
                  >
                    {param.parameter_name}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isOutOfRange ? "#DC2626" : "#1F2937",
                  }}
                >
                  {param.current_value} {param.unit}
                </Text>
              </View>
            );
          })}

          {equipment.parameters.length > 2 && (
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 8,
                fontStyle: "italic",
              }}
            >
              +{equipment.parameters.length - 2} more parameters
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
   const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  // local state for server-driven data
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const [equipment, setEquipment] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState(null);

  // Fetch system status from a "system_status" table (adjust to your schema)
  const fetchSystemStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const { data, error } = await supabase
        .from("system_status")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      setSystemStatus(data);
    } catch (err) {
      setStatusError(err);
      setSystemStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Fetch equipment
  const fetchEquipment = useCallback(async () => {
    setEquipmentLoading(true);
    setEquipmentError(null);
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          id,
          name,
          type,
          status,
          is_active,
          plc_parameters (
            id,
            equipment_id,
            parameter_name,
            current_value,
            unit,
            min_threshold,
            max_threshold,
            last_updated
          )
        `);
     
      if (error) throw error;
      setEquipment(data || []);
    } catch (err) {
      setEquipmentError(err);
      setEquipment([]);
    } finally {
      setEquipmentLoading(false);
    }
  }, []);

// Initial fetch + setup real-time subscriptions
  useEffect(() => {
    fetchSystemStatus();
    fetchEquipment();

    // ✅ Subscribe to real-time equipment changes
    const equipmentChannel = supabase
      .channel("realtime-equipment")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment" },
        (payload) => {
          // Handle equipment change payload from realtime subscription
          if (payload.eventType === "INSERT") {
            setEquipment((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setEquipment((prev) =>
              prev.map((eq) => (eq.id === payload.new.id ? payload.new : eq))
            );
          } else if (payload.eventType === "DELETE") {
            setEquipment((prev) =>
              prev.filter((eq) => eq.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // ✅ Subscribe to real-time parameter changes
    const paramChannel = supabase
      .channel("realtime-parameters")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plc_parameters" },
        (payload) => {
          // Handle PLC parameter changes from realtime subscription
          if (payload.eventType === "UPDATE") {
            setEquipment((prev) =>
              prev.map((eq) =>
                eq.id === payload.new.equipment_id
                  ? {
                      ...eq,
                      plc_parameters: eq.plc_parameters.map((p) =>
                        p.id === payload.new.id ? payload.new : p
                      ),
                    }
                  : eq
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(paramChannel);
    };
  }, [fetchSystemStatus, fetchEquipment]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["equipment"] });
    await queryClient.invalidateQueries({ queryKey: ["system-status"] });
    setRefreshing(false);
  };

  const handleEquipmentPress = (eq) => {
    Haptics.selectionAsync();
    if (eq.type === "kiln") {
      router.push(`/kilns/${eq.id}`);
    } else if (eq.type === "dryer") {
      router.push(`/dryers/${eq.id}`);
    }
  };

  const kilns = equipment?.filter((eq) => eq.type === "kiln") || [];
  const dryers = equipment?.filter((eq) => eq.type === "dryer") || [];

  if (statusError || equipmentError) {
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
          Failed to load dashboard data
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
    flexDirection: "row",   // make children align horizontally
    alignItems: "center",   // vertically center image and text
  }}
>
  <Image
    source={require("./factory.png")}
    style={{
      width: 99,
      height: 70,
      marginRight: 2, // space between image and text
      borderRadius: 3,
      marginLeft: -12,
    }}
  />
  <View>
    <Text
      style={{
        fontSize: 26,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 4,
      }}
    >
      IBB Factory Monitoring
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: "#6B7280",
      }}
    >
      Real-time PLC monitoring system
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
        {/* System Status */}
        <SystemStatusCard status={systemStatus} />

        {/* Kilns Section */}
        {kilns.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1F2937",
                marginBottom: 16,
              }}
            >
              Kilns ({kilns.length})
            </Text>
            {kilns.map((kiln) => (
              <EquipmentCard
                key={kiln.id}
                equipment={kiln}
                onPress={() => handleEquipmentPress(kiln)}
              />
            ))}
          </View>
        )}

        {/* Dryers Section */}
        {dryers.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1F2937",
                marginBottom: 16,
              }}
            >
              Dryers ({dryers.length})
            </Text>
            {dryers.map((dryer) => (
              <EquipmentCard
                key={dryer.id}
                equipment={dryer}
                onPress={() => handleEquipmentPress(dryer)}
              />
            ))}
          </View>
        )}

        {/* Loading State */}
        {(statusLoading || equipmentLoading) && (
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
              Loading equipment data...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!equipmentLoading && equipment && equipment.length === 0 && (
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
              No Equipment Found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Connect your PLC devices to start monitoring
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}