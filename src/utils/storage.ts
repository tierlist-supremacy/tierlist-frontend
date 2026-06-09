export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const formatDate = (timestamp: number | string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR');
};