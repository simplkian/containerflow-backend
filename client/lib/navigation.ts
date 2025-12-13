import { Linking, Platform, Alert } from "react-native";

interface NavigationParams {
  latitude: number;
  longitude: number;
  label?: string;
}

export async function openMapsNavigation({ latitude, longitude, label = "Destination" }: NavigationParams): Promise<boolean> {
  const encodedLabel = encodeURIComponent(label);
  
  if (Platform.OS === "web") {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    try {
      await Linking.openURL(googleMapsUrl);
      return true;
    } catch (error) {
      console.error("Failed to open Google Maps:", error);
      return false;
    }
  }

  const googleMapsUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });

  const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&dirflg=d`;

  const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  try {
    if (googleMapsUrl) {
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl);
        return true;
      }
    }

    if (Platform.OS === "ios") {
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapsUrl);
        return true;
      }
    }

    await Linking.openURL(googleMapsWebUrl);
    return true;
  } catch (error) {
    console.error("Failed to open maps:", error);
    Alert.alert(
      "Navigation Error",
      "Unable to open maps application. Please ensure you have Google Maps or Apple Maps installed.",
      [{ text: "OK" }]
    );
    return false;
  }
}

export function getMapsPreviewUrl(latitude: number, longitude: number, zoom: number = 15): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=400x200&markers=color:red%7C${latitude},${longitude}`;
}
