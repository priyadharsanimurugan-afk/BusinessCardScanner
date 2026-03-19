import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { dashboardStyles } from "@/components/styles/dashboardStyles";
import { colors } from "@/constants/colors";
import { getAllUsers, upgradeUser, downgradeUser } from "@/services/users";

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // const handleUpgrade = async (id: string) => {
  //   Alert.alert("Upgrade User", "Upgrade this user to Premium?", [
  //     { text: "Cancel" },
  //     {
  //       text: "Upgrade",
  //       onPress: async () => {
  //         await upgradeUser(id);
  //         fetchUsers();
  //       },
  //     },
  //   ]);
  // };

  // const handleDowngrade = async (id: string) => {
  //   Alert.alert("Downgrade User", "Downgrade this user to Free?", [
  //     { text: "Cancel" },
  //     {
  //       text: "Downgrade",
  //       onPress: async () => {
  //         await downgradeUser(id);
  //         fetchUsers();
  //       },
  //     },
  //   ]);
  // };
const handleUpgrade = async (id: string) => {
  try {
    await upgradeUser(id);
    fetchUsers();
  } catch (error) {
    console.log("Upgrade failed:", error);
  }
};

const handleDowngrade = async (id: string) => {
  try {
    await downgradeUser(id);
    fetchUsers();
  } catch (error) {
    console.log("Downgrade failed:", error);
  }
};

  if (loading) {
    return (
      <View
        style={[
          dashboardStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  return (
    <View style={dashboardStyles.container}>
      
      {/* HEADER WITH GLOW */}
      <View style={dashboardStyles.header}>
        <View style={dashboardStyles.headerGlow1} />
        <View style={dashboardStyles.headerGlow2} />

        <View style={dashboardStyles.headerTop}>
          <View>
            <Text style={dashboardStyles.greetText}>Admin Panel</Text>
            <Text style={dashboardStyles.titleText}>
              Manage <Text style={dashboardStyles.titleSpan}>Users</Text>
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={dashboardStyles.body}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Section Header */}
        <View style={dashboardStyles.sectionHead}>
          <Text style={dashboardStyles.sectionTitle}>All Users</Text>
        </View>

        {/* Users List */}
        <View style={dashboardStyles.contactList}>
          {users.map((user) => (
            <View key={user.id} style={dashboardStyles.contactCard}>
              
              {/* Avatar */}
              <View
                style={[
                  dashboardStyles.contactAvatar,
                  { backgroundColor: colors.navy },
                ]}
              >
                <Text style={dashboardStyles.contactAvatarText}>
                  {user.userName?.[0]?.toUpperCase()}
                </Text>
              </View>

              {/* User Info */}
              <View style={dashboardStyles.contactInfo}>
                <Text style={dashboardStyles.contactName}>
                  {user.userName}
                </Text>

                <Text style={dashboardStyles.contactRole}>
                  {user.email}
                </Text>

                <Text style={dashboardStyles.contactCompany}>
                  {user.accountType} Plan
                </Text>
              </View>

              {/* Action Buttons */}
              <View>
                {user.accountType === "Premium" ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.error,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                    onPress={() => handleDowngrade(user.id)}
                  >
                    <Text style={{ color: colors.white, fontSize: 11 }}>
                      Downgrade
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.amber,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                    onPress={() => handleUpgrade(user.id)}
                  >
                    <Text style={{ color: colors.white, fontSize: 11 }}>
                      Upgrade
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
