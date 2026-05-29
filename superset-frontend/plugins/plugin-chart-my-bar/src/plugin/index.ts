import { t } from '@apache-superset/core/translation';
import {
  Behavior,
  ChartMetadata,
  ChartPlugin,
  ChartProps,
  QueryFormData,
} from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import { MyBarChartQueryFormData } from '../types';

export default class MyBarChartPlugin extends ChartPlugin<
  MyBarChartQueryFormData,
  ChartProps<QueryFormData>
> {
  constructor() {
    const metadata = new ChartMetadata({
      behaviors: [Behavior.InteractiveChart],
      category: t('Custom'),
      description: t('A custom bar chart for demonstrating plugin development'),
      name: t('My Bar Chart'),
      tags: [t('Custom'), t('Bar')],
      thumbnail: '',
    });

    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../MyBarChart'),
      metadata,
      transformProps,
    });
  }
}
