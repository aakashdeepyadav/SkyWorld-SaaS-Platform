export const formatINR = (amount, options = {}) => {
  const value = Number(amount);
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  if (!Number.isFinite(value)) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(0);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};
