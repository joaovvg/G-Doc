export const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .slice(0, 14);
};

export const formatCNPJ = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

export const normalizeIdentifier = (value: string) => value.replace(/\D/g, "");

export const formatIdentifier = (value: string) => {
  const digits = normalizeIdentifier(value);
  if (digits.length <= 11) return formatCPF(digits);
  return formatCNPJ(digits);
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback para navegadores antigos / ambiente sem crypto.randomUUID
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '0.0.0.0';
  } catch (e) {
    return 'IP Local/Indisponivel';
  }
};

export const base64ToBlobUrl = (base64: string): string => {
  if (!base64) return '';
  try {
    // Se ja for uma Data URL, extraimos apenas a parte base64
    const parts = base64.split(';base64,');
    const contentType = parts.length > 1 ? parts[0].split(':')[1] : 'application/pdf';
    const raw = window.atob(parts.length > 1 ? parts[1] : base64);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    const blob = new Blob([uInt8Array], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Erro ao converter base64 para Blob:', e);
    return base64;
  }
};

export const sha256FromString = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Calcula o Digito Verificador (DV) para o NUP padrao XXXXX.XXXXXX/AAAA-DD
 */
const calculateNUPDV = (base: string) => {
  const digits = base.replace(/\D/g, "");

  const calculateDigit = (numStr: string) => {
    let sum = 0;
    let weight = 2;
    for (let i = numStr.length - 1; i >= 0; i--) {
      sum += parseInt(numStr[i], 10) * weight;
      weight++;
    }
    const remainder = sum % 11;
    const digit = 11 - remainder;
    return digit >= 10 ? 0 : digit;
  };

  const d1 = calculateDigit(digits);
  const d2 = calculateDigit(digits + d1);
  return `${d1}${d2}`;
};

export const generateNUP = (sequence: number) => {
  const year = new Date().getFullYear();
  const prefix = "00001";
  const seqStr = sequence.toString().padStart(6, '0');

  const base = `${prefix}${seqStr}${year}`;
  const dv = calculateNUPDV(base);

  return `${prefix}.${seqStr}/${year}-${dv}`;
};

export const extractNUPSequence = (nup?: string | null) => {
  if (!nup) return 0;

  const match = nup.match(/^\d{5}\.(\d{6})\/\d{4}(?:-\d{2})?$/);
  if (!match) return 0;

  return Number(match[1] || 0);
};
