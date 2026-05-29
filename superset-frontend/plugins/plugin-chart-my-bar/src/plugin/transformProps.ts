import { ChartProps } from '@superset-ui/core';
import { MyBarChartProps, MyBarChartQueryFormData } from '../types';

export default function transformProps(
  chartProps: ChartProps<MyBarChartQueryFormData>,
): MyBarChartProps {
  const {
    width,
    height,
    formData,
    queriesData,
  } = chartProps;

  const {
    groupby = [],
    metrics = [],
    xAxisLabel = '',
    yAxisLabel = '',
    showLegend = true,
    showValues = false,
    orderDesc = true,
  } = formData;

  const { data = [] } = queriesData[0] || {};

  return {
    width,
    height,
    data,
    groupby,
    metrics,
    xAxisLabel,
    yAxisLabel,
    showLegend,
    showValues,
    orderDesc,
  };
}
