import { useMemo } from 'react';
import {
  DataRecord,
  getNumberFormatter,
  NumberFormatter,
} from '@superset-ui/core';
import ReactEChartsCore from 'echarts-for-react';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { MyBarChartProps } from './types';

echarts.use([
  BarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
]);

type EChartsCoreOption = echarts.EChartsCoreOption;

interface MetricLabel {
  key: string;
  label: string;
  formatter: NumberFormatter;
}

interface ProcessedData {
  categories: string[];
  series: { name: string; type: 'bar'; data: number[] }[];
}

function processData(
  data: DataRecord[],
  groupby: string[],
  metrics: MetricLabel[],
): ProcessedData {
  const firstMetric = metrics[0];
  const categoryCol = groupby[0] || 'key';

  const categories = data.map(row => String(row[categoryCol] ?? ''));
  const values = data.map(row => {
    if (!firstMetric) return 0;
    const val = row[firstMetric.key];
    return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
  });

  return {
    categories,
    series: [
      {
        name: firstMetric?.label || 'Value',
        type: 'bar',
        data: values,
      },
    ],
  };
}

function buildEChartsOption(
  processed: ProcessedData,
  props: MyBarChartProps,
): EChartsCoreOption {
  const { xAxisLabel, yAxisLabel, showLegend, showValues } = props;

  return {
    grid: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      show: showLegend,
      top: 0,
    },
    xAxis: {
      type: 'category',
      name: xAxisLabel,
      data: processed.categories,
      axisLabel: {
        rotate: processed.categories.length > 8 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
    },
    series: processed.series.map(s => ({
      ...s,
      label: {
        show: showValues,
        position: 'top' as const,
      },
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    })),
  };
}

export default function MyBarChart(props: MyBarChartProps) {
  const { width, height, data, groupby, metrics, xAxisLabel, yAxisLabel } =
    props;

  const processedData = useMemo(() => {
    const metricLabels: MetricLabel[] = (Array.isArray(metrics)
      ? metrics
      : [metrics]
    )
      .filter(Boolean)
      .map(m => {
        const metricObj = typeof m === 'string' ? { label: m } : m;
        const label =
          typeof metricObj === 'object' && metricObj !== null && 'label' in metricObj
            ? String(metricObj.label ?? m)
            : String(m);
        return {
          key: label,
          label,
          formatter: getNumberFormatter(),
        };
      });

    return processData(
      data,
      Array.isArray(groupby) ? (groupby as string[]) : [String(groupby)],
      metricLabels,
    );
  }, [data, groupby, metrics]);

  const option = useMemo(
    () => buildEChartsOption(processedData, props),
    [processedData, xAxisLabel, yAxisLabel],
  );

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width, height }}
      notMerge
    />
  );
}
