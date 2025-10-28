const VAPID_ENV_KEY = "VITE_VAPID_PUBLIC_KEY";

const vapidKey = import.meta.env[VAPID_ENV_KEY] as string | undefined;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export class PushSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PushSubscriptionError";
  }
}

export const ensurePushSubscription = async (): Promise<PushSubscription> => {
  if (!("Notification" in window)) {
    throw new PushSubscriptionError("Notifications are not supported in this browser.");
  }

  if (Notification.permission !== "granted") {
    throw new PushSubscriptionError("Notification permission has not been granted.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new PushSubscriptionError("Service workers are not supported in this browser.");
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    return subscription;
  }

  if (!("pushManager" in registration)) {
    throw new PushSubscriptionError("Push manager is not available on the service worker registration.");
  }

  if (!vapidKey) {
    throw new PushSubscriptionError(`Missing ${VAPID_ENV_KEY} environment variable.`);
  }

  const convertedKey = urlBase64ToUint8Array(vapidKey);
  const keyBuffer = convertedKey.buffer;

  if (!(keyBuffer instanceof ArrayBuffer)) {
    throw new PushSubscriptionError("Unsupported buffer type for push subscription.");
  }

  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBuffer,
  });

  return subscription;
};

export const getPushSubscriptionPayload = async (): Promise<PushSubscriptionJSON> => {
  const subscription = await ensurePushSubscription();
  const payload = subscription.toJSON();

  if (!payload) {
    throw new PushSubscriptionError("Unable to serialize push subscription.");
  }

  return payload;
};
