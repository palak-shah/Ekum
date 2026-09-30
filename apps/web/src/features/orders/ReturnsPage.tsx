import { Navigate } from 'react-router-dom';

/** Returns are out of the product — old links land on Orders. */
export function ReturnsPage() {
  return <Navigate to="/orders" replace />;
}
