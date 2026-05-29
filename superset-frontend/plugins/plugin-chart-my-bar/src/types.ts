import {
  DataRecord,
  QueryFormColumn,
  QueryFormData,
  QueryFormMetric,
} from '@superset-ui/core';

export interface MyBarChartStylesProps {
  height: number;
  width: number;
}

interface MyBarChartCustomizeProps {
  groupby: QueryFormColumn[];
  metrics: QueryFormMetric[];
  xAxisLabel: string;
  yAxisLabel: string;
  showLegend: boolean;
  showValues: boolean;
  orderDesc: boolean;
}

export type MyBarChartQueryFormData = QueryFormData &
  MyBarChartStylesProps &
  MyBarChartCustomizeProps;

export type MyBarChartProps = MyBarChartStylesProps &
  MyBarChartCustomizeProps & {
    data: DataRecord[];
  };
