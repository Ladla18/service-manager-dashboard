import type { DeviceInfo } from '../types/auth';

interface WindowWithOpera extends Window {
  opera?: string;
  MSStream?: unknown;
}

export function getOperatingSystem(): string {
  const windowWithOpera = window as WindowWithOpera;
  const userAgent = navigator.userAgent || navigator.vendor || windowWithOpera.opera || '';
  
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iPad|iPhone|iPod/.test(userAgent) && !windowWithOpera.MSStream) return 'iOS';
  
  return 'Unknown';
}

export function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }
  if (userAgent.indexOf('Firefox') > -1) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }
  if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    const match = userAgent.match(/Version\/(\d+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }
  if (userAgent.indexOf('Edg') > -1) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return match ? `Edge ${match[1]}` : 'Edge';
  }
  
  return 'Unknown';
}

export function getScreenResolution(): string {
  return `${screen.width}x${screen.height}`;
}

export function getIsMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function getIPAddress(): Promise<string> {
  const primaryService = 'https://api.ipify.org?format=json';
  const fallbackService = 'https://api64.ipify.org?format=json';
  
  const fetchWithTimeout = (url: string, timeout: number): Promise<Response> => {
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  };
  
  try {
    const response = await fetchWithTimeout(primaryService, 5000);
    const data = (await response.json()) as { ip?: string };
    return data.ip || 'Unknown';
  } catch {
    try {
      const response = await fetchWithTimeout(fallbackService, 3000);
      const data = (await response.json()) as { ip?: string };
      return data.ip || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const ipAddress = await getIPAddress();
  
  return {
    os: getOperatingSystem(),
    browser: getBrowserInfo(),
    screenResolution: getScreenResolution(),
    isMobile: getIsMobile(),
    ipAddress,
  };
}

