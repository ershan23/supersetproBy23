import {
  buildQueryContext,
  ensureIsArray,
  QueryFormColumn,
} from '@superset-ui/core';
import { MyBarChartQueryFormData } from '../types';

export default function buildQuery(formData: MyBarChartQueryFormData) {
  const { groupby, orderDesc, metrics } = formData;

  const columns = ensureIsArray<QueryFormColumn>(groupby);

  return buildQueryContext(formData, baseQueryObject => {
    const orderByClause = metrics?.[0]
      ? [[metrics[0], !orderDesc]]
      : undefined;

    return [
      {
        ...baseQueryObject,
        columns,
        orderby: orderByClause as [[string, boolean]] | undefined,
      },
    ];
  });
}
