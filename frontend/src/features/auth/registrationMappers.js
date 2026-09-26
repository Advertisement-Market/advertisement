/**
 * Maps the register-wizard state ({ data: { f_* fields }, selections: { multi-selects } })
 * into the backend registration DTOs. Field names mirror the frontend wizard fields.
 */

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

export function mapOwner(d) {
  const { minBookingValue, minBookingUnit } = parseMinBooking(d.f_minBooking);
  const isTypeOther = d.f_bbType === 'Other' || d.f_bbType === 'other';
  const isTrafficOther = d.f_trafficType === 'other' || d.f_trafficType === 'Other';
  const isAudienceOther = d.f_audience === 'other' || d.f_audience === 'Other';

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
  const { minBookingValue, minBookingUnit } = parseMinBooking(d.f_minBooking);
  const isTypeOther = d.f_bbType === 'Other' || d.f_bbType === 'other';
  const isTrafficOther = d.f_trafficType === 'other' || d.f_trafficType === 'Other';
  const isAudienceOther = d.f_audience === 'other' || d.f_audience === 'Other';

  return {
    name: d.f_bbName,
    addressLine1: d.f_bbAddr,
    addressLine2: trimOrNull(d.f_bbAddr2),
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
  };
}
