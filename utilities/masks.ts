/**
 * Utility functions for input masks
 */

/**
 * Apply CPF mask to a string
 * Format: XXX.XXX.XXX-XX
 * @param value - The CPF string (numbers only)
 * @returns Formatted CPF string
 */
export const maskCPF = (value: string): string => {
  if (!value) return '';
  
  // Remove non-numeric characters
  const cleanValue = value.replace(/\D/g, '');
  
  // Limit to 11 digits
  const truncated = cleanValue.slice(0, 11);
  
  // Apply mask: XXX.XXX.XXX-XX
  if (truncated.length <= 3) {
    return truncated;
  } else if (truncated.length <= 6) {
    return `${truncated.slice(0, 3)}.${truncated.slice(3)}`;
  } else if (truncated.length <= 9) {
    return `${truncated.slice(0, 3)}.${truncated.slice(3, 6)}.${truncated.slice(6)}`;
  } else {
    return `${truncated.slice(0, 3)}.${truncated.slice(3, 6)}.${truncated.slice(6, 9)}-${truncated.slice(9)}`;
  }
};

/**
 * Remove CPF mask from a string
 * @param value - The formatted CPF string
 * @returns CPF string with only numbers
 */
export const unmaskCPF = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Validate CPF format
 * @param cpf - The CPF string (can be masked or not)
 * @returns True if valid format, false otherwise
 */
export const isValidCPFFormat = (cpf: string): boolean => {
  const clean = unmaskCPF(cpf);
  return clean.length === 11 && /^\d{11}$/.test(clean);
};

/**
 * Apply WhatsApp mask to a string
 * Format: (+55) 11 99999-9999 or (11) 99999-9999
 * @param value - The phone string (numbers only)
 * @param includeCountryCode - Whether to include the country code +55
 * @returns Formatted WhatsApp string
 */
export const maskWhatsApp = (value: string, includeCountryCode: boolean = false): string => {
  if (!value) return '';
  
  // Remove non-numeric characters
  let cleanValue = value.replace(/\D/g, '');
  
  // If value starts with 55, it already has country code
  if (cleanValue.startsWith('55')) {
    includeCountryCode = true;
    if (!includeCountryCode) {
      cleanValue = cleanValue.slice(2); // Remove country code if not needed
    }
  }
  
  // Limit to appropriate length
  if (includeCountryCode) {
    cleanValue = cleanValue.slice(0, 13); // +55 11 99999-9999 = 13 digits
    
    if (cleanValue.length <= 2) {
      return includeCountryCode ? `+${cleanValue}` : cleanValue;
    } else if (cleanValue.length <= 4) {
      return `(+${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    } else if (cleanValue.length <= 9) {
      return `(+${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 4)} ${cleanValue.slice(4)}`;
    } else {
      return `(+${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 4)} ${cleanValue.slice(4, 9)}-${cleanValue.slice(9)}`;
    }
  } else {
    cleanValue = cleanValue.slice(0, 11); // 11 99999-9999 = 11 digits
    
    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 7) {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    } else {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7)}`;
    }
  }
};

/**
 * Remove WhatsApp mask from a string
 * @param value - The formatted WhatsApp string
 * @returns Phone string with only numbers
 */
export const unmaskWhatsApp = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Validate WhatsApp format
 * @param phone - The phone string (can be masked or not)
 * @returns True if valid format, false otherwise
 */
export const isValidWhatsAppFormat = (phone: string): boolean => {
  const clean = unmaskWhatsApp(phone);
  // Valid if 11 digits (without country code) or 13 digits (with country code +55)
  return (clean.length === 11 || clean.length === 13) && /^\d{11,13}$/.test(clean);
};

/**
 * Format WhatsApp for API (only numbers, with country code)
 * @param phone - The phone string (can be masked or not)
 * @returns Phone with country code and only numbers, e.g., "5511999999999"
 */
export const formatWhatsAppForAPI = (phone: string): string => {
  let clean = unmaskWhatsApp(phone);
  
  // If doesn't start with 55, add it
  if (!clean.startsWith('55')) {
    clean = `55${clean}`;
  }
  
  return clean;
};
