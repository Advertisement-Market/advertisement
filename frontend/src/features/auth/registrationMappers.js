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
  v == null ? [] : String(v).split(/[,\n]/).map((t) => t.trim()).filter(Boolean);

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
    officeAddress: d.f_officeAddress,
    pincode: d.f_pincode,
    project: {
      title: d.f_projectTitle,
      description: d.f_projectDesc,
      targetAudience: d.f_targetAudience,
      targetLocation: d.f_targetLocation,
      startDate: d.f_startDate,
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

export function mapOwner(d) {
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
    businessAddressLine1: d.f_bizAddr1,
    businessAddressLine2: trimOrNull(d.f_bizAddr2),
    businessPincode: d.f_bizPin,
    tradeLicenseNo: trimOrNull(d.f_licenseNo),
    ownershipType: trimOrNull(d.f_ownership),
    regulatoryApprovals: trimOrNull(d.f_approval),
    billboard: {
      name: d.f_bbName,
      pincode: d.f_bbPin,
      address: d.f_bbAddr,
      landmark: trimOrNull(d.f_bbLandmark),
      type: d.f_bbType,
      widthFt: toNumber(d.f_bbWidth),
      heightFt: toNumber(d.f_bbHeight),
      groundHeightFt: toNumber(d.f_bbGroundHeight),
      facing: d.f_facing,
      trafficType: trimOrNull(d.f_trafficOther) || d.f_trafficType,
      audienceType: trimOrNull(d.f_audienceOther) || d.f_audience,
      footfall: trimOrNull(d.f_footfall),
      startPrice: toNumber(d.f_startPrice),
      minBooking: d.f_minBooking,
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
    landline: trimOrNull(d.f_landline),
    linkedinUrl: trimOrNull(d.f_linkedin),
    headquartersPincode: d.f_pincode,
    officeAddress: d.f_officeAddress,
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
