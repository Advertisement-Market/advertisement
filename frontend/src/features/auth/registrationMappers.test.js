import { describe, it, expect } from 'vitest';
import {
  mapAdvertiser,
  mapOwner,
  mapAgency,
  mapBillboardListing,
  mapListingToFormData,
  mapFormDataToPatchPayload,
} from './registrationMappers';

describe('registrationMappers - Address and Payload Structure', () => {
  describe('mapAdvertiser', () => {
    it('maps full advertiser form data including structured address with trimOrNull on optional fields', () => {
      const formData = {
        f_loginEmail: 'adv@example.com',
        f_password: 'Passw0rd!',
        f_companyName: 'Nimbus Foods',
        f_businessType: 'FMCG',
        f_website: '  https://nimbus.in  ',
        f_gst: '  27AAAAA0000A1Z5  ',
        f_pan: '  ABCDE1234F  ',
        f_firstName: 'Rohan',
        f_lastName: '  Kapoor  ',
        f_desig: 'Marketing Head',
        f_email: 'rohan@nimbus.in',
        f_phone: '+91 98765 43210',
        f_addressLine1: '12 MG Road',
        f_addressLine2: '  Suite 400  ',
        f_landmark: '  Near Metro  ',
        f_city: 'Bengaluru',
        f_state: 'Karnataka',
        f_pincode: '560001',
        f_projectTitle: 'Summer Launch',
        f_projectDesc: 'Campaign details',
        f_targetAudience: 'Youth 18-30',
        f_targetLocation: 'Bengaluru',
        f_startDate: '2026-08-01',
        f_endDate: '2026-09-01',
        f_duration: '1 month',
        f_budgetMinValue: '500,000',
        f_budgetMinUnit: 'INR',
        f_budgetMaxValue: '1,200,000',
        f_budgetMaxUnit: 'INR',
        f_flexBudget: 'yes',
        f_quoteCount: '3-5',
        f_termsAccept: true,
      };
      const selections = {
        industries: ['FMCG', 'Retail & Fashion'],
        agencyPref: ['Verified only', 'OOH Specialist'],
      };

      const result = mapAdvertiser(formData, selections);

      expect(result).toMatchObject({
        accountEmail: 'adv@example.com',
        password: 'Passw0rd!',
        companyName: 'Nimbus Foods',
        businessType: 'FMCG',
        website: 'https://nimbus.in',
        gstNumber: '27AAAAA0000A1Z5',
        panNumber: 'ABCDE1234F',
        industries: ['FMCG', 'Retail & Fashion'],
        firstName: 'Rohan',
        lastName: 'Kapoor',
        contactDesignation: 'Marketing Head',
        contactEmail: 'rohan@nimbus.in',
        contactPhone: '+91 98765 43210',
        addressLine1: '12 MG Road',
        addressLine2: 'Suite 400',
        landmark: 'Near Metro',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        acceptedTerms: true,
      });

      expect(result.project).toMatchObject({
        title: 'Summer Launch',
        budgetMinValue: 500000,
        budgetMaxValue: 1200000,
        flexibleBudget: true,
        agencyPreferences: ['Verified only', 'OOH Specialist'],
      });
    });

    it('converts blank optional address fields to null', () => {
      const formData = {
        f_loginEmail: 'adv@example.com',
        f_password: 'Passw0rd!',
        f_companyName: 'Nimbus Foods',
        f_businessType: 'FMCG',
        f_firstName: 'Rohan',
        f_desig: 'Head',
        f_email: 'rohan@nimbus.in',
        f_phone: '9876543210',
        f_addressLine1: '12 MG Road',
        f_addressLine2: '   ',
        f_landmark: '',
        f_city: 'Bengaluru',
        f_state: 'Karnataka',
        f_pincode: '560001',
      };

      const result = mapAdvertiser(formData, {});

      expect(result.addressLine1).toBe('12 MG Road');
      expect(result.addressLine2).toBeNull();
      expect(result.landmark).toBeNull();
      expect(result.city).toBe('Bengaluru');
      expect(result.state).toBe('Karnataka');
      expect(result.pincode).toBe('560001');
    });
  });

  describe('mapOwner', () => {
    it('maps business address and billboard address with proper structured contracts', () => {
      const formData = {
        f_firstName: 'Amit',
        f_lastName: 'Patel',
        f_email: 'amit@example.com',
        f_phone: '+91 98765 43210',
        f_password: 'Passw0rd!',
        f_companyName: 'Gujarat Outdoor Media',
        f_companyPhone: '  079-12345678  ',
        f_companyReg: '  REG-1234  ',
        f_gst: '  24AAAAA0000A1Z5  ',
        f_bizAddr1: '100 Ring Road',
        f_bizAddr2: '  Near SG Highway  ',
        f_bizCity: 'Ahmedabad',
        f_bizState: 'Gujarat',
        f_bizPin: '380015',
        f_licenseNo: 'TL-999',
        f_ownership: 'Sole Proprietor',
        f_approval: 'approved',
        f_bbName: 'Prime Unipole SG Highway',
        f_bbAddr: 'Plot 45, SG Highway',
        f_bbLandmark: '  Opposite Iscon Mall  ',
        f_bbCity: 'Ahmedabad',
        f_bbState: 'Gujarat',
        f_bbPin: '380015',
        f_bbType: 'Unipole',
        f_bbWidth: '40',
        f_bbHeight: '20',
        f_bbGroundHeight: '10',
        f_facing: 'North',
        f_trafficType: 'Vehicular',
        f_audience: 'Commuters',
        f_footfall: '50,000/day',
        f_startPrice: '150,000',
        f_minBooking: '1 month',
        f_discountNote: '10% discount on 3+ months',
        f_termsAccept: true,
      };

      const result = mapOwner(formData);

      // Business Address
      expect(result.addressLine1).toBe('100 Ring Road');
      expect(result.addressLine2).toBe('Near SG Highway');
      expect(result.landmark).toBeNull();
      expect(result.city).toBe('Ahmedabad');
      expect(result.state).toBe('Gujarat');
      expect(result.pincode).toBe('380015');

      // Billboard Address
      expect(result.billboard).toMatchObject({
        name: 'Prime Unipole SG Highway',
        addressLine1: 'Plot 45, SG Highway',
        addressLine2: null,
        landmark: 'Opposite Iscon Mall',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        type: 'Unipole',
        typeOther: null,
        widthFt: 40,
        heightFt: 20,
        groundHeightFt: 10,
        startPrice: 150000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      });
    });
  });

  describe('mapAgency', () => {
    it('maps headquarters address and agency profile fields', () => {
      const formData = {
        f_loginEmail: 'agency@example.com',
        f_password: 'Passw0rd!',
        f_agencyName: 'Pixel & Print',
        f_agencyType: 'Full-Service Ad Agency',
        f_yearEst: '2014',
        f_yearsExp: '10+ years',
        f_tagline: 'Bold ideas',
        f_about: 'Full-service agency',
        f_website: 'https://pp.in',
        f_contactNo: '022-12345678',
        f_linkedin: 'https://linkedin.com/company/pp',
        f_addressLine1: '4th Floor, Pinnacle Park',
        f_addressLine2: '',
        f_landmark: 'Andheri East',
        f_city: 'Mumbai',
        f_state: 'Maharashtra',
        f_pincode: '400069',
        f_firstName: 'Priya',
        f_lastName: 'Mehta',
        f_desig: 'Director',
        f_email: 'priya@pp.in',
        f_phone: '+91 98765 43211',
        f_expertiseTags: 'OOH, Transit, Digital',
        f_languages: 'English, Hindi, Marathi',
        f_campaigns: '50+',
        f_pricingModel: 'Retainer',
        f_geoCoverage: 'National',
        f_tenderBudget: '10 Lakhs',
        f_cities: 'Mumbai, Pune',
        f_regNum: 'REG-987',
        f_gst: '27AAAAA0000A1Z5',
        f_pan: 'ABCDE1234F',
        f_client: 'Brand A, Brand B',
        f_pf_title_0: 'Summer Campaign',
        f_pf_meta_0: 'FMCG, 2025',
        f_termsAccept: true,
      };
      const selections = {
        services: ['OOH Media', 'Media Planning'],
        industries: ['Retail & Fashion', 'FMCG'],
      };

      const result = mapAgency(formData, selections);

      expect(result.addressLine1).toBe('4th Floor, Pinnacle Park');
      expect(result.addressLine2).toBeNull();
      expect(result.landmark).toBe('Andheri East');
      expect(result.city).toBe('Mumbai');
      expect(result.state).toBe('Maharashtra');
      expect(result.pincode).toBe('400069');
      expect(result.yearEstablished).toBe(2014);
      expect(result.contactNo).toBe('022-12345678');
      expect(result.expertiseTags).toEqual(['OOH', 'Transit', 'Digital']);
      expect(result.portfolio).toEqual([{ title: 'Summer Campaign', meta: 'FMCG, 2025' }]);
    });
  });

  describe('mapBillboardListing', () => {
    it('maps form data to standalone BillboardListingCreateRequest format with proper types', () => {
      const formData = {
        f_bbName: 'Prime Unipole SG Highway',
        f_bbAddr: 'Plot 45, SG Highway',
        f_bbAddr2: '  Phase 2  ',
        f_bbLandmark: '  Opposite Iscon Mall  ',
        f_bbCity: 'Ahmedabad',
        f_bbState: 'Gujarat',
        f_bbPin: '380015',
        f_bbType: 'Unipole',
        f_bbWidth: '40',
        f_bbHeight: '20',
        f_bbGroundHeight: '10',
        f_facing: 'North',
        f_trafficType: 'Vehicular',
        f_audience: 'Commuters',
        f_footfall: '50,000/day',
        f_startPrice: '150,000',
        f_minBooking: '1 month',
        f_discountNote: '10% discount on 3+ months',
      };

      const result = mapBillboardListing(formData);

      expect(result).toEqual({
        name: 'Prime Unipole SG Highway',
        addressLine1: 'Plot 45, SG Highway',
        addressLine2: 'Phase 2',
        landmark: 'Opposite Iscon Mall',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        type: 'Unipole',
        typeOther: null,
        widthFt: 40,
        heightFt: 20,
        groundHeightFt: 10,
        facing: 'North',
        trafficType: 'Vehicular',
        trafficTypeOther: null,
        audienceType: 'Commuters',
        audienceTypeOther: null,
        footfall: '50,000/day',
        startPrice: 150000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
        discountNote: '10% discount on 3+ months',
      });
    });

    it('falls back to custom traffic and audience options when other is specified', () => {
      const formData = {
        f_bbName: 'Tech Park Screen',
        f_bbAddr: 'Whitefield Main Rd',
        f_bbCity: 'Bengaluru',
        f_bbState: 'Karnataka',
        f_bbPin: '560066',
        f_bbType: 'LED Digital',
        f_bbWidth: '30',
        f_bbHeight: '15',
        f_facing: 'East',
        f_trafficType: 'other',
        f_trafficOther: 'Metro Corridor',
        f_audience: 'other',
        f_audienceOther: 'IT Professionals',
        f_startPrice: '200000',
        f_minBooking: '2 weeks',
      };

      const result = mapBillboardListing(formData);

      expect(result.trafficType).toBe('OTHER');
      expect(result.trafficTypeOther).toBe('Metro Corridor');
      expect(result.audienceType).toBe('OTHER');
      expect(result.audienceTypeOther).toBe('IT Professionals');
      expect(result.minBookingValue).toBe(2);
      expect(result.minBookingUnit).toBe('WEEKS');
      expect(result.addressLine2).toBeNull();
      expect(result.landmark).toBeNull();
      expect(result.groundHeightFt).toBeNull();
      expect(result.footfall).toBeNull();
      expect(result.discountNote).toBeNull();
    });

    it('maps uppercase OTHER codes and trims companion strings', () => {
      const formData = {
        f_bbName: 'Custom Type Billboard',
        f_bbAddr: 'Ring Road',
        f_bbCity: 'Pune',
        f_bbState: 'Maharashtra',
        f_bbPin: '411001',
        f_bbType: 'OTHER',
        f_bbTypeOther: '  Skywalk Gantries  ',
        f_bbWidth: '30',
        f_bbHeight: '15',
        f_facing: 'East',
        f_trafficType: 'OTHER',
        f_trafficOther: '  Expressway Corridor  ',
        f_audience: 'OTHER',
        f_audienceOther: '  Highway Travelers  ',
        f_startPrice: '200000',
        f_minBookingValue: 1,
        f_minBookingUnit: 'MONTHS',
      };

      const result = mapBillboardListing(formData);

      expect(result.type).toBe('OTHER');
      expect(result.typeOther).toBe('Skywalk Gantries');
      expect(result.trafficType).toBe('OTHER');
      expect(result.trafficTypeOther).toBe('Expressway Corridor');
      expect(result.audienceType).toBe('OTHER');
      expect(result.audienceTypeOther).toBe('Highway Travelers');
    });

    it('nulls out companion texts when selection is switched away from OTHER', () => {
      const formData = {
        f_bbName: 'Switched Billboard',
        f_bbAddr: 'Ring Road',
        f_bbCity: 'Pune',
        f_bbState: 'Maharashtra',
        f_bbPin: '411001',
        f_bbType: 'STATIC_HOARDING',
        f_bbTypeOther: 'Stale Custom Type',
        f_bbWidth: '30',
        f_bbHeight: '15',
        f_facing: 'East',
        f_trafficType: 'Vehicular',
        f_trafficOther: 'Stale Traffic',
        f_audience: 'Commuters',
        f_audienceOther: 'Stale Audience',
        f_startPrice: '200000',
        f_minBookingValue: 1,
        f_minBookingUnit: 'MONTHS',
      };

      const result = mapBillboardListing(formData);

      expect(result.type).toBe('STATIC_HOARDING');
      expect(result.typeOther).toBeNull();
      expect(result.trafficType).toBe('Vehicular');
      expect(result.trafficTypeOther).toBeNull();
      expect(result.audienceType).toBe('Commuters');
      expect(result.audienceTypeOther).toBeNull();
    });

    it('strictly excludes UI-only calendar and media upload fields from the API payload', () => {
      const formDataWithMediaAndCalendar = {
        f_bbName: 'Prime LED Hoarding',
        f_bbAddr: 'JVLR Junction',
        f_bbCity: 'Mumbai',
        f_bbState: 'Maharashtra',
        f_bbPin: '400076',
        f_bbType: 'LED Digital',
        f_bbWidth: '40',
        f_bbHeight: '20',
        f_facing: 'South',
        f_trafficType: 'Highway',
        f_audience: 'Commuters',
        f_startPrice: '300000',
        f_minBooking: '1 month',
        // UI-only fields from Step 2 and Step 3:
        f_photos: ['blob:http://localhost/photo1.jpg', 'blob:http://localhost/photo2.jpg'],
        f_videoUrl: 'https://youtube.com/demo',
        f_calBookedDates: ['2026-10-01', '2026-10-02'],
        f_availOption: 'available',
        f_lat: 19.1234,
        f_lng: 72.8456,
      };

      const result = mapBillboardListing(formDataWithMediaAndCalendar);

      // Verify exact 22 keys in output payload
      const expectedKeys = [
        'name',
        'addressLine1',
        'addressLine2',
        'landmark',
        'city',
        'state',
        'pincode',
        'type',
        'typeOther',
        'widthFt',
        'heightFt',
        'groundHeightFt',
        'facing',
        'trafficType',
        'trafficTypeOther',
        'audienceType',
        'audienceTypeOther',
        'footfall',
        'startPrice',
        'minBookingValue',
        'minBookingUnit',
        'discountNote',
      ];
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
      expect(Object.keys(result).length).toBe(22);

      // Explicitly assert UI-only fields are NOT present
      expect(result).not.toHaveProperty('photos');
      expect(result).not.toHaveProperty('f_photos');
      expect(result).not.toHaveProperty('videoUrl');
      expect(result).not.toHaveProperty('f_videoUrl');
      expect(result).not.toHaveProperty('calBookedDates');
      expect(result).not.toHaveProperty('availOption');
      expect(result).not.toHaveProperty('lat');
      expect(result).not.toHaveProperty('lng');
    });

    it('maps controlled f_minBookingValue and f_minBookingUnit directly without parsing heuristics', () => {
      const formData = {
        f_bbName: 'Controlled Booking Billboard',
        f_bbAddr: 'Highway Point',
        f_bbCity: 'Mumbai',
        f_bbState: 'Maharashtra',
        f_bbPin: '400001',
        f_bbType: 'LED Digital',
        f_bbWidth: '40',
        f_bbHeight: '20',
        f_facing: 'North',
        f_trafficType: 'Vehicular',
        f_audience: 'Commuters',
        f_startPrice: '350000',
        f_minBookingValue: '15',
        f_minBookingUnit: 'DAYS',
      };

      const result = mapBillboardListing(formData);

      expect(result.minBookingValue).toBe(15);
      expect(result.minBookingUnit).toBe('DAYS');
    });
  });

  describe('mapListingToFormData & mapFormDataToPatchPayload (Round-Trip Parity)', () => {
    const sampleDto = {
      id: 42,
      name: 'Highway Prime Hoarding',
      addressLine1: 'NH 48 KM Marker 45',
      addressLine2: 'Plot 12-A',
      landmark: 'Near Milestone Hotel',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      type: 'STATIC_HOARDING',
      typeOther: null,
      widthFt: 40.0,
      heightFt: 20.0,
      groundHeightFt: 15.0,
      facing: 'NORTH_EAST',
      trafficType: 'HIGHWAY',
      trafficTypeOther: null,
      audienceType: 'HIGHWAY_TRAVELERS',
      audienceTypeOther: null,
      footfall: '85,000/day',
      startPrice: 450000.0,
      minBookingValue: 2,
      minBookingUnit: 'WEEKS',
      minBookingDays: 14,
      discountNote: '10% on quarterly booking',
    };

    it('reproduces all 22 persisted fields in a full round-trip (DTO -> Form -> PATCH)', () => {
      const formData = mapListingToFormData(sampleDto);

      // Verify formData mapped properly
      expect(formData.f_bbName).toBe('Highway Prime Hoarding');
      expect(formData.f_facing).toBe('North-East');
      expect(formData.f_trafficType).toBe('Highway');
      expect(formData.f_audience).toBe('Highway Travelers');
      expect(formData.f_minBookingValue).toBe(2);
      expect(formData.f_minBookingUnit).toBe('WEEKS');

      // Round-trip to patch payload
      const patchPayload = mapFormDataToPatchPayload(formData);

      // Required fields: strict exact equality
      expect(patchPayload.name).toBe(sampleDto.name);
      expect(patchPayload.addressLine1).toBe(sampleDto.addressLine1);
      expect(patchPayload.city).toBe(sampleDto.city);
      expect(patchPayload.state).toBe(sampleDto.state);
      expect(patchPayload.pincode).toBe(sampleDto.pincode);
      expect(patchPayload.type).toBe(sampleDto.type);
      expect(patchPayload.widthFt).toBe(sampleDto.widthFt);
      expect(patchPayload.heightFt).toBe(sampleDto.heightFt);
      expect(patchPayload.groundHeightFt).toBe(sampleDto.groundHeightFt);
      expect(patchPayload.facing).toBe(sampleDto.facing);
      expect(patchPayload.trafficType).toBe(sampleDto.trafficType);
      expect(patchPayload.audienceType).toBe(sampleDto.audienceType);
      expect(patchPayload.startPrice).toBe(sampleDto.startPrice);
      expect(patchPayload.minBookingValue).toBe(sampleDto.minBookingValue);
      expect(patchPayload.minBookingUnit).toBe(sampleDto.minBookingUnit);

      // Optional text fields: null vs "" equivalence
      expect(patchPayload.addressLine2).toBe(sampleDto.addressLine2);
      expect(patchPayload.landmark).toBe(sampleDto.landmark);
      expect(patchPayload.discountNote).toBe(sampleDto.discountNote);
      expect(patchPayload.footfall).toBe(sampleDto.footfall);

      // Companion text when not OTHER must be null
      expect(patchPayload.typeOther).toBeNull();
      expect(patchPayload.trafficTypeOther).toBeNull();
      expect(patchPayload.audienceTypeOther).toBeNull();
    });

    it('round-trips OTHER with alphanumeric companion descriptions preserving digits', () => {
      const otherDto = {
        ...sampleDto,
        type: 'OTHER',
        typeOther: 'Pillar 101 Overpass',
        trafficType: 'OTHER',
        trafficTypeOther: 'Terminal 2 Airport Route',
        audienceType: 'OTHER',
        audienceTypeOther: 'Gate 4 Commuters & Tech 24/7',
      };

      const formData = mapListingToFormData(otherDto);
      expect(formData.f_bbType).toBe('OTHER');
      expect(formData.f_bbTypeOther).toBe('Pillar 101 Overpass');
      expect(formData.f_trafficType).toBe('other');
      expect(formData.f_trafficOther).toBe('Terminal 2 Airport Route');
      expect(formData.f_audience).toBe('other');
      expect(formData.f_audienceOther).toBe('Gate 4 Commuters & Tech 24/7');

      const patchPayload = mapFormDataToPatchPayload(formData);
      expect(patchPayload.type).toBe('OTHER');
      expect(patchPayload.typeOther).toBe('Pillar 101 Overpass');
      expect(patchPayload.trafficType).toBe('OTHER');
      expect(patchPayload.trafficTypeOther).toBe('Terminal 2 Airport Route');
      expect(patchPayload.audienceType).toBe('OTHER');
      expect(patchPayload.audienceTypeOther).toBe('Gate 4 Commuters & Tech 24/7');
    });

    it('clearing optional fields transmits empty string "" so the backend clears them', () => {
      const formData = mapListingToFormData(sampleDto);

      // User clears optional fields
      formData.f_bbAddr2 = '   ';
      formData.f_bbLandmark = '';
      formData.f_discountNote = '';
      formData.f_footfall = '  ';

      const patchPayload = mapFormDataToPatchPayload(formData);

      expect(patchPayload.addressLine2).toBe('');
      expect(patchPayload.landmark).toBe('');
      expect(patchPayload.discountNote).toBe('');
      expect(patchPayload.footfall).toBe('');
    });
  });
});
