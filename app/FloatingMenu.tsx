import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* Background semicircle - now truly half-circle */}
      {open && <View style={styles.menuBackground} />}

      {open && (
        <>
          {/* Dashboard */}
          <TouchableOpacity
            style={[styles.menuItem, { bottom: 0, right: 110 }]}
            onPress={() => {
              router.push("/dashboard");
              setOpen(false);
            }}
          >
            <Entypo name="home" size={20} color={colors.white} />
            <Text style={styles.label}>Dashboard</Text>
          </TouchableOpacity>

          {/* Contacts */}
          <TouchableOpacity
            style={[styles.menuItem, { bottom: 60, right: 80 }]}
            onPress={() => {
              router.push("/contacts");
              setOpen(false);
            }}
          >
            <Entypo name="old-phone" size={20} color={colors.white} />
            <Text style={styles.label}>Contacts</Text>
          </TouchableOpacity>

          {/* Scan */}
          <TouchableOpacity
            style={[styles.menuItem, { bottom: 70, right: -0 }]}
            onPress={() => {
              router.push("/scan");
              setOpen(false);
            }}
          >
            <Entypo name="camera" size={20} color={colors.white} />
            <Text style={styles.label}>Scan</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen(!open)}
      >
        <Entypo
          name={open ? "cross" : "plus"}
          size={28}
          color={colors.white}
        />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    right: 25,
    alignItems: "center",
  },

  fab: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: colors.amber,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    zIndex: 10, // Ensure FAB is above the semicircle
  },

  menuBackground: {
    position: "absolute",
    width: 270, // Wider than full circle to create semicircle effect
    height: 160, // Half the width to create a semicircle
    borderTopLeftRadius: 140, // Half of width
    borderTopRightRadius: 140, // Half of width
    backgroundColor: colors.navy,
    opacity: 0.95,
    bottom: -20, // Adjusted positioning
    right: -80,
    transform: [{ rotate: '0deg' }], // You can adjust rotation if needed
    // Alternative: use borderBottomLeftRadius/RightRadius as 0 to make it a half circle
  },

  menuItem: {
    position: "absolute",
    alignItems: "center",
    zIndex: 20, // Ensure menu items are above the background
  },

  label: {
    color: colors.white,
    marginTop: 5,
    fontSize: 11,
    fontWeight: "500",
  },
});