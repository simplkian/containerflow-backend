import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WarehouseScreen from "@/screens/WarehouseScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ContainersStackParamList = {
  Warehouse: undefined;
};

const Stack = createNativeStackNavigator<ContainersStackParamList>();

export default function ContainersStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Warehouse"
        component={WarehouseScreen}
        options={{ headerTitle: "Lager" }}
      />
    </Stack.Navigator>
  );
}
