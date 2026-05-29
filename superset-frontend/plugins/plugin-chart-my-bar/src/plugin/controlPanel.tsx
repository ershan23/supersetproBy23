import { t } from '@apache-superset/core/translation';
import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';
import { validateNonEmpty } from '@superset-ui/core';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: t('X Axis'),
              description: t('Columns to group by on the X axis'),
            },
          },
        ],
        [
          {
            name: 'metrics',
            config: {
              ...sharedControls.metrics,
              validators: [validateNonEmpty],
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'orderDesc',
            config: {
              type: 'CheckboxControl',
              label: t('Sort descending'),
              default: true,
              description: t('Sort data in descending order'),
            },
          },
        ],
        ['row_limit'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'xAxisLabel',
            config: {
              type: 'TextControl',
              label: t('X Axis Label'),
              default: '',
              description: t('Custom label for the X axis'),
            },
          },
        ],
        [
          {
            name: 'yAxisLabel',
            config: {
              type: 'TextControl',
              label: t('Y Axis Label'),
              default: '',
              description: t('Custom label for the Y axis'),
            },
          },
        ],
        [
          {
            name: 'showLegend',
            config: {
              type: 'CheckboxControl',
              label: t('Show Legend'),
              default: true,
              description: t('Whether to display the legend'),
            },
          },
        ],
        [
          {
            name: 'showValues',
            config: {
              type: 'CheckboxControl',
              label: t('Show Values'),
              default: false,
              description: t('Show data values on the chart'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
