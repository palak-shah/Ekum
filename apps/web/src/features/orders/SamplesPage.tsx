import { Navigate } from 'react-router-dom';

/** Samples live on the Orders list — Find kind=sample. */
export function SamplesPage() {
  return <Navigate to="/orders?kind=sample" replace />;
}
