// Country and province options for signup and the profile.
//
// South Africa is first and has its nine provinces listed because that is where
// most of the user base is. Countries we do not have subdivisions for fall back
// to a free-text province/region field rather than forcing a wrong list.

export const COUNTRIES: string[] = [
  'South Africa',
  'Australia',
  'Botswana',
  'Canada',
  'Eswatini',
  'France',
  'Germany',
  'Ghana',
  'India',
  'Ireland',
  'Italy',
  'Kenya',
  'Lesotho',
  'Malawi',
  'Mozambique',
  'Namibia',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Portugal',
  'Spain',
  'Tanzania',
  'Uganda',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Zambia',
  'Zimbabwe',
  'Other',
];

export const PROVINCES_BY_COUNTRY: Record<string, string[]> = {
  'South Africa': [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape',
  ],
  Zimbabwe: [
    'Bulawayo',
    'Harare',
    'Manicaland',
    'Mashonaland Central',
    'Mashonaland East',
    'Mashonaland West',
    'Masvingo',
    'Matabeleland North',
    'Matabeleland South',
    'Midlands',
  ],
  Namibia: [
    'Erongo', 'Hardap', 'Karas', 'Kavango East', 'Kavango West', 'Khomas',
    'Kunene', 'Ohangwena', 'Omaheke', 'Omusati', 'Oshana', 'Oshikoto', 'Otjozondjupa', 'Zambezi',
  ],
  Botswana: [
    'Central', 'Chobe', 'Ghanzi', 'Kgalagadi', 'Kgatleng', 'Kweneng',
    'North East', 'North West', 'South East', 'Southern',
  ],
};

/** Provinces for a country, or null when we only offer a free-text field. */
export function provincesFor(country: string | null | undefined): string[] | null {
  if (!country) return null;
  return PROVINCES_BY_COUNTRY[country] ?? null;
}

/** Label for the subdivision field — "Province" is wrong in plenty of places. */
export function regionLabel(country: string | null | undefined): string {
  if (country === 'United States') return 'State';
  if (country === 'United Kingdom') return 'Region';
  return 'Province';
}
