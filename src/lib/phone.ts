/**
 * Pakistani Phone Number Normalization and Action Link Helpers
 * Handles landlines (068-xxxxxxx for Sadiqabad/RYK) and mobile numbers (03xx-xxxxxxx)
 */

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');

  // Pakistani mobile (e.g. 03001234567 or 923001234567)
  if (digits.startsWith('923') && digits.length === 12) {
    const local = '0' + digits.slice(2);
    return `${local.slice(0, 4)}-${local.slice(4)}`;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  // Sadiqabad/RYK landlines (068 area code, e.g. 0685741234)
  if (digits.startsWith('068') && digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  // Other landlines or numbers
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}

export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');

  // If starts with 03..., replace leading 0 with 92
  if (digits.startsWith('03') && digits.length === 11) {
    digits = '92' + digits.slice(1);
  } else if (digits.startsWith('3') && digits.length === 10) {
    digits = '92' + digits;
  } else if (digits.startsWith('0092')) {
    digits = digits.slice(2);
  } else if (!digits.startsWith('92') && digits.length === 10) {
    digits = '92' + digits;
  }
  return digits;
}

export function generateWhatsAppUrl(phone: string, businessName?: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return '#';
  const text = businessName
    ? encodeURIComponent(`Assalam-o-Alaikum! I found ${businessName} on Sadiqabad City Directory. Can you please provide more information?`)
    : encodeURIComponent(`Assalam-o-Alaikum! I found your contact on Sadiqabad City Directory.`);
  return `https://wa.me/${normalized}?text=${text}`;
}

export function generateCallUrl(phone: string): string {
  const digits = cleanPhoneNumber(phone);
  return `tel:${digits}`;
}
