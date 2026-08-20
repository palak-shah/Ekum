import { Navigate } from 'react-router-dom';

/** Sellers historically used /buyers — fold into Network → Requests. */
export function MyBuyersPage() {
  return <Navigate to="/network/requests" replace />;
}
