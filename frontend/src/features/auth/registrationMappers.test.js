import { describe, it, expect } from 'vitest';
import { mapAdvertiser, mapOwner, mapAgency } from './registrationMappers';

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
        widthFt: 40,
        heightFt: 20,
        groundHeightFt: 10,
        startPrice: 150000,
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
});
