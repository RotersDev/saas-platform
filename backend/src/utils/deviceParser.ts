/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string): string {
  if (!userAgent) return 'Desconhecido';

  // Detect OS
  let os = 'Desconhecido';
  if (userAgent.includes('Windows')) {
    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
    else os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    const androidVersion = userAgent.match(/Android ([\d.]+)/);
    os = androidVersion ? `Android ${androidVersion[1]}` : 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const iosVersion = userAgent.match(/OS ([\d_]+)/);
    os = iosVersion ? `iOS ${iosVersion[1].replace(/_/g, '.')}` : 'iOS';
  }

  // Detect Browser
  let browser = 'Desconhecido';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const chromeVersion = userAgent.match(/Chrome\/([\d.]+)/);
    browser = chromeVersion ? `Chrome ${chromeVersion[1].split('.')[0]}` : 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    const firefoxVersion = userAgent.match(/Firefox\/([\d.]+)/);
    browser = firefoxVersion ? `Firefox ${firefoxVersion[1].split('.')[0]}` : 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const safariVersion = userAgent.match(/Version\/([\d.]+)/);
    browser = safariVersion ? `Safari ${safariVersion[1].split('.')[0]}` : 'Safari';
  } else if (userAgent.includes('Edg')) {
    const edgeVersion = userAgent.match(/Edg\/([\d.]+)/);
    browser = edgeVersion ? `Edge ${edgeVersion[1].split('.')[0]}` : 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }

  // Detect Device Type
  let deviceType = 'Desktop';
  if (userAgent.includes('Mobile')) {
    deviceType = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'Tablet';
  }

  return `${deviceType} - ${os} - ${browser}`;
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}




