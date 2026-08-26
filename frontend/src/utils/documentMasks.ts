const digitsOnly = (value: string) => value.replace(/\D/g, "");

const formatCpf = (digits: string) => {
  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatCnpj = (digits: string) => {
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

export const maskCpf = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11);
  return formatCpf(digits);
};

export const maskCnpj = (value: string) => {
  const digits = digitsOnly(value).slice(0, 14);
  return formatCnpj(digits);
};

export const maskCpfOrCnpj = (value: string) => {
  const digits = digitsOnly(value).slice(0, 14);

  if (digits.length <= 11) {
    return formatCpf(digits);
  }

  return formatCnpj(digits);
};

export const getDocumentDigits = (value: string, maxDigits = 14) =>
  digitsOnly(value).slice(0, maxDigits);

/** Formats to the standard Brazilian mobile pattern: (00) 0 0000-0000. */
export const maskPhone = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : digits;
  }

  if (digits.length <= 3) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};
