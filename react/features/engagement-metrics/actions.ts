import { IStore } from '../app/types';
import { createToolbarEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { openDialog } from '../base/dialog/actions';

import {
    SET_ENGAGEMENT_METRICS_OPEN,
    OPEN_ENGAGEMENT_MODAL,
    CLOSE_ENGAGEMENT_MODAL,
    UPDATE_METRICS_DATA
} from './actionTypes';
import { IEngagementMetricsAction, IMetricData } from './reducer';
import EngagementMetricsModal from './components/EngagementMetricsModal';

/**
 * Sets the engagement metrics visibility state.
 *
 * @param {boolean} isOpen - The visibility flag.
 * @returns {{
 *      type: SET_ENGAGEMENT_METRICS_OPEN,
 *      isOpen: boolean
 * }}
 */
export const setEngagementMetricsOpen = (isOpen: boolean): IEngagementMetricsAction => {
    if (isOpen) {
        sendAnalytics(createToolbarEvent('engagement.metrics.open'));
    }

    return {
        type: SET_ENGAGEMENT_METRICS_OPEN,
        isOpen
    };
};

/**
 * Opens the engagement metrics modal.
 *
 * @returns {Function}
 */
export function openEngagementModal() {
    return (dispatch: IStore['dispatch']) => {
        sendAnalytics(createToolbarEvent('engagement.metrics.modal.open'));
        dispatch(openDialog(EngagementMetricsModal));
    };
}

/**
 * Closes the engagement metrics modal.
 *
 * @returns {{
 *      type: CLOSE_ENGAGEMENT_MODAL
 * }}
 */
export const closeEngagementModal = (): IEngagementMetricsAction => {
    sendAnalytics(createToolbarEvent('engagement.metrics.modal.close'));

    return {
        type: CLOSE_ENGAGEMENT_MODAL
    };
};

/**
 * Updates the metrics data in the store.
 *
 * @param {IMetricData[]} metricsData - The new metrics data.
 * @returns {{
 *      type: UPDATE_METRICS_DATA,
 *      metricsData: IMetricData[]
 * }}
 */
export const updateMetricsData = (metricsData: IMetricData[]): IEngagementMetricsAction => {
    return {
        type: UPDATE_METRICS_DATA,
        metricsData
    };
}; 