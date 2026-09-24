import { Navigate, useSearchParams } from 'react-router-dom';

/** List home is You. Keep create/edit under `/catalog/...`. */
export function CatalogToYou() {
  const [params] = useSearchParams();
  const query = params.toString();
  return <Navigate to={query ? `/more?${query}` : '/more'} replace />;
}
