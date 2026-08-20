import { Navigate } from 'react-router-dom';

/** Returns live on the Orders list — Find kind=return. */
export function ReturnsPage() {
  return <Navigate to="/orders?kind=return" replace />;
}
