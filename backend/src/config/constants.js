'use strict';

// The exact set of fields GrowEasy's CRM accepts. Order matters for CSV export.
const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];

const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
];

const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

const DEFAULTS = {
  PORT: 4000,
  BATCH_SIZE: 25,
  MAX_ROWS: 5000,
  AI_PROVIDER: 'gemini',
  GEMINI_MODEL: 'gemini-2.5-flash',
};

module.exports = {
  CRM_FIELDS,
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  DEFAULTS,
};
