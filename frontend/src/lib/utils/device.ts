import { browser } from '$app/environment';

const DEVICE_ID_KEY = 'tarkify_device_id';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (!browser) return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function clearDeviceId(): void {
  if (!browser) return;
  localStorage.removeItem(DEVICE_ID_KEY);
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let osName = 'Unknown';
  let deviceType = 'desktop';

  if (ua.includes('Firefox')) browserName = 'Firefox';
  else if (ua.includes('Chrome')) browserName = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browserName = 'Safari';
  else if (ua.includes('Edge')) browserName = 'Edge';

  if (ua.includes('Windows')) osName = 'Windows';
  else if (ua.includes('Mac OS')) osName = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) osName = 'Linux';
  else if (ua.includes('Android')) osName = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';

  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';

  return {
    deviceId: getDeviceId(),
    deviceName: `${browserName} on ${osName}`,
    deviceType,
    browser: browserName,
    os: osName,
  };
}
