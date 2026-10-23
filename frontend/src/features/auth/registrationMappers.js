/**
 * Maps the register-wizard state ({ data: { f_* fields }, selections: { multi-selects } })
 * into the backend registration DTOs. Field names mirror the frontend wizard fields.
 */

import { isOther, cleanText } from '@/lib/validators';

const trimOrNull = (v) => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};

const toNumber = (v) => {
  if (v == null || String(v).trim() === '') return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const toInt = (v) => {
  if (v == null || String(v).trim() === '') return null;
  const n = parseInt(String(v).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

const splitTags = (v) =>
  v == null
    ? []
    : String(v)
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);

function collectPortfolio(d) {
  const prefix = 'f_pf_title_';
  return Object.keys(d)
    .filter((k) => k.startsWith(prefix))
    .map((k) => {
      const idx = k.slice(prefix.length);
      const title = trimOrNull(d[k]);
      return title ? { title, meta: trimOrNull(d[`f_pf_meta_${idx}`]) } : null;
    })
    .filter(Boolean);
}

export function mapAdvertiser(d, s) {
  return {
    accountEmail: d.f_loginEmail,
    password: d.f_password,
    companyName: d.f_companyName,
    businessType: d.f_businessType,
    website: trimOrNull(d.f_website),
    gstNumber: trimOrNull(d.f_gst),
    panNumber: trimOrNull(d.f_pan),
    industries: s.industries ?? [],
    firstName: d.f_firstName,
    lastName: trimOrNull(d.f_lastName),
    contactDesignation: d.f_desig,
    contactEmail: d.f_email,
    contactPhone: d.f_phone,
    addressLine1: d.f_addressLine1,
    addressLine2: trimOrNull(d.f_addressLine2),
    landmark: trimOrNull(d.f_landmark),
    city: d.f_city,
    state: d.f_state,
    pincode: d.f_pincode,
    project: {
      title: d.f_projectTitle,
      description: d.f_projectDesc,
      targetAudience: d.f_targetAudience,
      targetLocation: d.f_targetLocation,
      startDate: d.f_startDate,
      endDate: d.f_endDate,
      duration: d.f_duration,
      budgetMinValue: toNumber(d.f_budgetMinValue),
      budgetMinUnit: trimOrNull(d.f_budgetMinUnit),
      budgetMaxValue: toNumber(d.f_budgetMaxValue),
      budgetMaxUnit: trimOrNull(d.f_budgetMaxUnit),
      flexibleBudget: d.f_flexBudget === 'yes',
      quotationsRequired: d.f_quoteCount,
      agencyPreferences: s.agencyPref ?? [],
    },
    acceptedTerms: !!d.f_termsAccept,
  };
}

export const parseMinBooking = (val) => {
  if (!val) return { minBookingValue: 1, minBookingUnit: 'MONTHS' };
  const str = String(val).toLowerCase().trim();
  if (str.includes('day')) {
    const num = parseInt(str.replace(/\D/g, ''), 10) || 15;
    return { minBookingValue: num, minBookingUnit: 'DAYS' };
  }
  if (str.includes('week')) {
    const num = parseInt(str.replace(/\D/g, ''), 10) || 1;
    return { minBookingValue: num, minBookingUnit: 'WEEKS' };
  }
  if (str.includes('year')) {
    const num = parseInt(str.replace(/\D/g, ''), 10) || 1;
    return { minBookingValue: num * 12, minBookingUnit: 'MONTHS' };
  }
  const num = parseInt(str.replace(/\D/g, ''), 10) || 1;
  return { minBookingValue: num, minBookingUnit: 'MONTHS' };
};

export const resolveBookingDuration = (d) => {
  if (d.f_minBookingValue != null && d.f_minBookingValue !== '') {
    const rawUnit = String(d.f_minBookingUnit || 'MONTHS').toUpperCase();
    const unit = ['DAYS', 'WEEKS', 'MONTHS'].includes(rawUnit) ? rawUnit : 'MONTHS';
    return {
      minBookingValue: Math.max(1, Math.round(Number(d.f_minBookingValue)) || 1),
      minBookingUnit: unit,
    };
  }
  return parseMinBooking(d.f_minBooking);
};

export function mapOwner(d) {
  const { minBookingValue, minBookingUnit } = resolveBookingDuration(d);
  const isTypeOther = isOther(d.f_bbType);
  const isTrafficOther = isOther(d.f_trafficType);
  const isAudienceOther = isOther(d.f_audience);

  return {
    firstName: d.f_firstName,
    lastName: d.f_lastName,
    accountEmail: d.f_email,
    phone: d.f_phone,
    password: d.f_password,
    companyName: d.f_companyName,
    companyPhone: trimOrNull(d.f_companyPhone),
    companyRegNumber: trimOrNull(d.f_companyReg),
    gstNumber: trimOrNull(d.f_gst),
    addressLine1: d.f_bizAddr1,
    addressLine2: trimOrNull(d.f_bizAddr2),
    landmark: null,
    city: d.f_bizCity,
    state: d.f_bizState,
    pincode: d.f_bizPin,
    tradeLicenseNo: trimOrNull(d.f_licenseNo),
    ownershipType: trimOrNull(d.f_ownership),
    regulatoryApprovals: trimOrNull(d.f_approval),
    billboard: {
      name: d.f_bbName,
      addressLine1: d.f_bbAddr,
      addressLine2: null,
      landmark: trimOrNull(d.f_bbLandmark),
      city: d.f_bbCity,
      state: d.f_bbState,
      pincode: d.f_bbPin,
      type: isTypeOther ? 'OTHER' : d.f_bbType,
      typeOther: isTypeOther ? trimOrNull(d.f_bbTypeOther) : null,
      widthFt: toNumber(d.f_bbWidth),
      heightFt: toNumber(d.f_bbHeight),
      groundHeightFt: toNumber(d.f_bbGroundHeight),
      facing: d.f_facing,
      trafficType: isTrafficOther ? 'OTHER' : d.f_trafficType,
      trafficTypeOther: isTrafficOther ? trimOrNull(d.f_trafficOther) : null,
      audienceType: isAudienceOther ? 'OTHER' : d.f_audience,
      audienceTypeOther: isAudienceOther ? trimOrNull(d.f_audienceOther) : null,
      footfall: trimOrNull(d.f_footfall),
      startPrice: toNumber(d.f_startPrice),
      minBookingValue,
      minBookingUnit,
      discountNote: trimOrNull(d.f_discountNote),
    },
    acceptedTerms: !!d.f_termsAccept,
  };
}
export function mapAgency(d, s) {
  return {
    accountEmail: d.f_loginEmail,
    password: d.f_password,
    agencyName: d.f_agencyName,
    agencyType: d.f_agencyType,
    yearEstablished: toInt(d.f_yearEst),
    yearsExperience: d.f_yearsExp,
    tagline: trimOrNull(d.f_tagline),
    about: trimOrNull(d.f_about),
    website: trimOrNull(d.f_website),
    contactNo: trimOrNull(d.f_contactNo),
    linkedinUrl: trimOrNull(d.f_linkedin),
    addressLine1: d.f_addressLine1,
    addressLine2: trimOrNull(d.f_addressLine2),
    landmark: trimOrNull(d.f_landmark),
    city: d.f_city,
    state: d.f_state,
    pincode: d.f_pincode,
    firstName: d.f_firstName,
    lastName: d.f_lastName,
    contactDesignation: d.f_desig,
    contactEmail: d.f_email,
    contactPhone: d.f_phone,
    services: s.services ?? [],
    industries: s.industries ?? [],
    expertiseTags: splitTags(d.f_expertiseTags),
    languages: splitTags(d.f_languages),
    campaignsCompleted: d.f_campaigns,
    pricingModel: d.f_pricingModel,
    geoCoverage: d.f_geoCoverage,
    minTenderBudget: trimOrNull(d.f_tenderBudget),
    coverageCities: trimOrNull(d.f_cities),
    regNumber: trimOrNull(d.f_regNum),
    gstNumber: trimOrNull(d.f_gst),
    panNumber: trimOrNull(d.f_pan),
    keyClients: trimOrNull(d.f_client),
    portfolio: collectPortfolio(d),
    acceptedTerms: !!d.f_termsAccept,
  };
}

export function mapBillboardListing(d) {
  const { minBookingValue, minBookingUnit } = resolveBookingDuration(d);
  const isTypeOther = isOther(d.f_bbType);
  const isTrafficOther = isOther(d.f_trafficType);
  const isAudienceOther = isOther(d.f_audience);

  return {
    name: trimOrNull(d.f_bbName),
    addressLine1: trimOrNull(d.f_bbAddr),
    addressLine2: trimOrNull(d.f_bbAddr2),
    landmark: trimOrNull(d.f_bbLandmark),
    city: trimOrNull(d.f_bbCity),
    state: trimOrNull(d.f_bbState),
    pincode: trimOrNull(d.f_bbPin),
    type: isTypeOther ? 'OTHER' : trimOrNull(d.f_bbType),
    typeOther: isTypeOther ? trimOrNull(d.f_bbTypeOther) : null,
    widthFt: toNumber(d.f_bbWidth),
    heightFt: toNumber(d.f_bbHeight),
    groundHeightFt: toNumber(d.f_bbGroundHeight),
    facing: d.f_facing,
    trafficType: isTrafficOther ? 'OTHER' : d.f_trafficType,
    trafficTypeOther: isTrafficOther ? trimOrNull(d.f_trafficOther) : null,
    audienceType: isAudienceOther ? 'OTHER' : d.f_audience,
    audienceTypeOther: isAudienceOther ? trimOrNull(d.f_audienceOther) : null,
    footfall: trimOrNull(d.f_footfall),
    startPrice: toNumber(d.f_startPrice),
    minBookingValue,
    minBookingUnit,
    discountNote: trimOrNull(d.f_discountNote),
  };
}

export const FACING_OPTIONS = [
  'North',
  'North-East',
  'East',
  'South-East',
  'South',
  'South-West',
  'West',
  'North-West',
];

export const TRAFFIC_OPTIONS = [
  { code: 'CITY_URBAN', label: 'City / Urban' },
  { code: 'HIGHWAY', label: 'Highway' },
  { code: 'COMMERCIAL_ZONE', label: 'Commercial Zone' },
  { code: 'RESIDENTIAL_AREA', label: 'Residential Area' },
  { code: 'INDUSTRIAL', label: 'Industrial' },
  { code: 'OTHER', label: 'Other', value: 'other' },
];

export const AUDIENCE_OPTIONS = [
  { code: 'IT_TECH_PROFESSIONALS', label: 'IT Crowd / Tech Professionals' },
  { code: 'COMMUTERS', label: 'Commuters' },
  { code: 'HIGHWAY_TRAVELERS', label: 'Highway Travelers' },
  { code: 'LOCAL_RESIDENTS', label: 'Local Residents' },
  { code: 'SHOPPERS', label: 'Shoppers' },
  { code: 'STUDENTS', label: 'Students' },
  { code: 'MIXED', label: 'Mixed' },
  { code: 'OTHER', label: 'Other', value: 'other' },
];

export function resolveFacingOption(val) {
  if (!val) return '';
  const normalized = String(val)
    .toUpperCase()
    .replace(/[^A-Z]/g, '_');
  const found = FACING_OPTIONS.find(
    (opt) => opt.toUpperCase().replace(/[^A-Z]/g, '_') === normalized,
  );
  return found || String(val);
}

export function formatFacingCode(val) {
  if (!val) return null;
  return String(val)
    .toUpperCase()
    .replace(/[^A-Z]/g, '_');
}

export function resolveTrafficOption(val) {
  if (!val) return '';
  if (isOther(val)) return 'other';
  const str = String(val).trim();
  const normalized = str.toUpperCase().replace(/[^A-Z]/g, '_');
  const found = TRAFFIC_OPTIONS.find(
    (o) => o.code === normalized || o.label.toUpperCase().replace(/[^A-Z]/g, '_') === normalized,
  );
  return found ? found.label : str;
}

export function formatTrafficCode(val) {
  if (!val) return null;
  if (isOther(val)) return 'OTHER';
  const str = String(val).trim();
  const normalized = str.toUpperCase().replace(/[^A-Z]/g, '_');
  const found = TRAFFIC_OPTIONS.find(
    (o) => o.code === normalized || o.label.toUpperCase().replace(/[^A-Z]/g, '_') === normalized,
  );
  return found ? found.code : normalized;
}

export function resolveAudienceOption(val) {
  if (!val) return '';
  if (isOther(val)) return 'other';
  const str = String(val).trim();
  const normalized = str.toUpperCase().replace(/[^A-Z]/g, '_');
  const found = AUDIENCE_OPTIONS.find(
    (o) => o.code === normalized || o.label.toUpperCase().replace(/[^A-Z]/g, '_') === normalized,
  );
  return found ? found.label : str;
}

export function formatAudienceCode(val) {
  if (!val) return null;
  if (isOther(val)) return 'OTHER';
  const str = String(val).trim();
  const normalized = str.toUpperCase().replace(/[^A-Z]/g, '_');
  const found = AUDIENCE_OPTIONS.find(
    (o) => o.code === normalized || o.label.toUpperCase().replace(/[^A-Z]/g, '_') === normalized,
  );
  return found ? found.code : normalized;
}

/**
 * Maps a backend BillboardListingDto into the wizard's f_* form fields.
 * Supports DTO fields as well as fallback property names (address, f_*) for resilience.
 */
export function mapListingToFormData(dto) {
  if (!dto) return {};

  const facing = resolveFacingOption(dto.facing ?? dto.f_facing);
  const trafficType = resolveTrafficOption(dto.trafficType ?? dto.f_trafficType);
  const audienceType = resolveAudienceOption(dto.audienceType ?? dto.f_audience);

  return {
    f_bbName: dto.name ?? dto.f_bbName ?? '',
    f_bbAddr: dto.addressLine1 ?? dto.address ?? dto.f_bbAddr ?? '',
    f_bbAddr2: dto.addressLine2 ?? dto.f_bbAddr2 ?? '',
    f_bbLandmark: dto.landmark ?? dto.f_bbLandmark ?? '',
    f_bbCity: dto.city ?? dto.f_bbCity ?? '',
    f_bbState: dto.state ?? dto.f_bbState ?? '',
    f_bbPin: dto.pincode ?? dto.f_bbPin ?? '',
    f_bbType: dto.type ?? dto.f_bbType ?? '',
    f_bbTypeOther: dto.typeOther ?? dto.f_bbTypeOther ?? '',
    f_bbWidth:
      dto.widthFt != null
        ? String(dto.widthFt)
        : dto.f_bbWidth != null && dto.f_bbWidth !== ''
          ? String(dto.f_bbWidth)
          : '',
    f_bbHeight:
      dto.heightFt != null
        ? String(dto.heightFt)
        : dto.f_bbHeight != null && dto.f_bbHeight !== ''
          ? String(dto.f_bbHeight)
          : '',
    f_bbGroundHeight:
      dto.groundHeightFt != null
        ? String(dto.groundHeightFt)
        : dto.f_bbGroundHeight != null && dto.f_bbGroundHeight !== ''
          ? String(dto.f_bbGroundHeight)
          : '',
    f_facing: facing,
    f_trafficType: trafficType,
    f_trafficOther: dto.trafficTypeOther ?? dto.f_trafficOther ?? '',
    f_audience: audienceType,
    f_audienceOther: dto.audienceTypeOther ?? dto.f_audienceOther ?? '',
    f_footfall: dto.footfall ?? dto.f_footfall ?? '',
    f_startPrice:
      dto.startPrice != null
        ? String(dto.startPrice)
        : dto.f_startPrice != null && dto.f_startPrice !== ''
          ? String(dto.f_startPrice)
          : '',
    f_minBookingValue:
      dto.minBookingValue != null
        ? dto.minBookingValue
        : dto.f_minBookingValue != null
          ? dto.f_minBookingValue
          : 1,
    f_minBookingUnit: dto.minBookingUnit || dto.f_minBookingUnit || 'MONTHS',
    f_discountNote: dto.discountNote ?? dto.f_discountNote ?? '',
  };
}

/**
 * Maps wizard f_* form fields into a BillboardListingUpdateRequest (PATCH payload).
 * Trims all strings before transmission and sends "" for blanked optional fields
 * so the backend explicitly clears them.
 */
export function mapFormDataToPatchPayload(d) {
  const { minBookingValue, minBookingUnit } = resolveBookingDuration(d);
  const isTypeOther = isOther(d.f_bbType);
  const isTrafficOther = isOther(d.f_trafficType);
  const isAudienceOther = isOther(d.f_audience);

  // cleanText strips leading/trailing whitespace plus \u200B \u200C \u200D \u2060 \uFEFF
  const trimToString = (v) => (v == null ? '' : cleanText(v));

  return {
    name: trimToString(d.f_bbName),
    addressLine1: trimToString(d.f_bbAddr),
    // Optional fields: '' = clear, null = untouched
    addressLine2: trimToString(d.f_bbAddr2),
    landmark: trimToString(d.f_bbLandmark),
    city: trimToString(d.f_bbCity),
    state: trimToString(d.f_bbState),
    pincode: trimToString(d.f_bbPin),
    type: isTypeOther ? 'OTHER' : trimToString(d.f_bbType),
    typeOther: isTypeOther ? trimToString(d.f_bbTypeOther) : null,
    widthFt: toNumber(d.f_bbWidth),
    heightFt: toNumber(d.f_bbHeight),
    groundHeightFt:
      d.f_bbGroundHeight != null && String(d.f_bbGroundHeight).trim() !== ''
        ? toNumber(d.f_bbGroundHeight)
        : null,
    facing: formatFacingCode(d.f_facing),
    trafficType: isTrafficOther ? 'OTHER' : formatTrafficCode(d.f_trafficType),
    trafficTypeOther: isTrafficOther ? trimToString(d.f_trafficOther) : null,
    audienceType: isAudienceOther ? 'OTHER' : formatAudienceCode(d.f_audience),
    audienceTypeOther: isAudienceOther ? trimToString(d.f_audienceOther) : null,
    // Optional fields: '' = clear, null = untouched
    footfall: trimToString(d.f_footfall),
    startPrice: toNumber(d.f_startPrice),
    minBookingValue,
    minBookingUnit,
    discountNote: trimToString(d.f_discountNote),
  };
}
