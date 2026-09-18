export const COLUMN_SELECT_CHECKBOX = 'select-checkbox' as const;
export const COLUMN_CREATED_BY = 'createdBy' as const;
export const COLUMN_CREATED_DATE = 'createdDate' as const;
export const COLUMN_LAST_MODIFIED_BY = 'lastModifiedBy' as const;
export const COLUMN_LAST_MODIFIED_DATE = 'lastModifiedDate' as const;
export const COLUMN_ACTIONS = 'actions' as const;

export const AUDIT_COLUMN_VISIBILITY = {
  createdBy: false,
  createdDate: false,
  lastModifiedBy: false,
  lastModifiedDate: false,
} as const;

export const AUDIT_COLUMN_KEYS = Object.keys(AUDIT_COLUMN_VISIBILITY);
