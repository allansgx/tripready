import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/** Marca que o convite já foi feito — "Agora não" também conta. */
const ASKED_KEY = 'tripready:reminders-asked';

export async function hasReminderPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/** `true` só quando ainda dá para perguntar sem cair em cima de uma negativa. */
export async function canAskForReminders(): Promise<boolean> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  if (granted || !canAskAgain) return false;
  return (await AsyncStorage.getItem(ASKED_KEY)) === null;
}

export async function requestReminderPermission(): Promise<boolean> {
  await markRemindersAsked();
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

export async function markRemindersAsked(): Promise<void> {
  await AsyncStorage.setItem(ASKED_KEY, '1');
}
