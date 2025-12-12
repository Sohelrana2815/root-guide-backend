export const getTransactionId = () => {
  return `TXN-${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
