const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeIndianPhone(value: string): null | string {
  const digits = digitsOnly(value);

  if (digits.length === 10 && INDIAN_MOBILE_PATTERN.test(digits)) {
    return `+91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    const nationalNumber = digits.slice(1);
    if (INDIAN_MOBILE_PATTERN.test(nationalNumber)) {
      return `+91${nationalNumber}`;
    }
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    const nationalNumber = digits.slice(2);
    if (INDIAN_MOBILE_PATTERN.test(nationalNumber)) {
      return `+91${nationalNumber}`;
    }
  }

  return null;
}

export function formatIndianPhoneDisplay(value: string): string {
  const normalized = normalizeIndianPhone(value);
  if (!normalized) return value;
  const nationalNumber = normalized.slice(3);
  return `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
}

export function isValidIndianPhone(value: string): boolean {
  return normalizeIndianPhone(value) !== null;
}
