export const ADMIN_DOCUMENT_TYPES = Object.freeze({
  AGREEMENT: 'agreement',
  INVOICE: 'invoice',
  PAYMENT_RECEIPT: 'payment-receipt',
  PROJECT_STAGE: 'project-stage',
});

export const ADMIN_DOCUMENT_TYPE_VALUES = Object.freeze(
  Object.values(ADMIN_DOCUMENT_TYPES)
);

export const ADMIN_DOCUMENT_LABELS = Object.freeze({
  [ADMIN_DOCUMENT_TYPES.AGREEMENT]: 'Service Agreement',
  [ADMIN_DOCUMENT_TYPES.INVOICE]: 'Invoice',
  [ADMIN_DOCUMENT_TYPES.PAYMENT_RECEIPT]: 'Payment Receipt',
  [ADMIN_DOCUMENT_TYPES.PROJECT_STAGE]: 'Project Stage Report',
});
