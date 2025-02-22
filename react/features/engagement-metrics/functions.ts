import { IReduxState } from '../app/types';
import { getFeatureFlag } from '../base/flags/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';

interface EngagementMetricsConfig {
    enabled?: boolean;
}

/**
 * Returns the engagement metrics state.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object}
 */
const getEngagementMetricsState = (state: IReduxState) => state['features/engagement-metrics'] || { isOpen: false };

/**
 * Indicates whether the engagement metrics feature is enabled.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isEngagementMetricsEnabled = (state: IReduxState): boolean => {
    const { engagementMetrics = {} as EngagementMetricsConfig } = state['features/base/config'];

    return Boolean(engagementMetrics.enabled || getFeatureFlag(state, 'engagementMetrics'));
};

/**
 * Indicates whether the engagement metrics panel is visible.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isEngagementMetricsVisible = (state: IReduxState): boolean =>
    getEngagementMetricsState(state).isOpen;

/**
 * Indicates whether the engagement metrics button should be visible.
 * Follows the same pattern as whiteboard - visible when enabled and user is moderator
 * or metrics are already open.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isEngagementMetricsButtonVisible = (state: IReduxState): boolean =>
    isEngagementMetricsEnabled(state) && (
        isLocalParticipantModerator(state) || 
        isEngagementMetricsVisible(state)
    ); 