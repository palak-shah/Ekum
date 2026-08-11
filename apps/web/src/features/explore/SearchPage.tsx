import { Navigate, useSearchParams } from 'react-router-dom';

/** Legacy `/search` → Explore search mode (feed stays until the user types). */
export function SearchPage() {
  const [params] = useSearchParams();
  const next = new URLSearchParams();
  next.set('search', '1');
  const q = params.get('q');
  if (q) next.set('q', q);
  return <Navigate to={`/explore?${next.toString()}`} replace />;
}
