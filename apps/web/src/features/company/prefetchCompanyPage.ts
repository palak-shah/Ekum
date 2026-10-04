/** Warm the company profile route chunk before navigating from Explore. */
export function prefetchCompanyPage(): void {
  void import('@/features/company/CompanyProfilePage');
}
