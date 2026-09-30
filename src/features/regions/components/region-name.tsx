import { useQuery } from '@tanstack/react-query';

import { allRegionsQueryOptions } from '../api/queries';
import { regionLabel } from '../lookup';

/** 지역 ID를 '서울 강남구'처럼 보여 준다. 목록에 없으면 '#ID' */
export function RegionName({ regionId }: { regionId: string }) {
  const regions = useQuery(allRegionsQueryOptions());
  return <>{regionLabel(regions.data ?? [], regionId) ?? `#${regionId}`}</>;
}
