import { Navigate, useSearchParams } from 'react-router-dom';
import { youSavedHref } from './youSavedHref';

export function SavedToYou() {
  const [params] = useSearchParams();
  return (
    <Navigate
      to={youSavedHref({
        collections: params.get('tab') === 'collections',
        select: params.get('select') === '1',
      })}
      replace
    />
  );
}
