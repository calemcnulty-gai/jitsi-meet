import { useSelector } from 'react-redux';

import EngagementMetricsButton from './components/web/EngagementMetricsButton';
import { isEngagementMetricsButtonVisible } from './functions';

const engagementMetrics = {
    key: 'engagement-metrics',
    Content: EngagementMetricsButton,
    group: 3
};

export function useEngagementMetricsButton() {
    const _isEngagementMetricsButtonVisible = useSelector(isEngagementMetricsButtonVisible);

    if (_isEngagementMetricsButtonVisible) {
        return engagementMetrics;
    }
} 