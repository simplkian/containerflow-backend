import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AutomotiveTasksScreen from "@/screens/AutomotiveTasksScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type TasksStackParamList = {
  Tasks: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<TasksStackParamList>();

export default function TasksStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Tasks"
        component={AutomotiveTasksScreen}
        options={{ headerTitle: "Aufgaben" }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ headerTitle: "Aufgabendetails" }}
      />
    </Stack.Navigator>
  );
}
