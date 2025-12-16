/**
 * Funções de formatação de dados
 */

// Formata números com locale PT
export const formatNumber = (value, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  return value.toLocaleString('pt-PT');
};

// Formata strings com fallback
export const formatString = (value, fallback = '—') => {
  if (!value) return fallback;
  return String(value);
};

// Capitaliza primeira letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Formata data/hora
export const formatDate = (date) => {
  if (!date) return '—';
  const formatter = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatter.format(new Date(date));
};

// Badge booleano
export const formatBoolean = (value) => {
  return value ? '✔' : '✖';
};
