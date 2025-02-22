/**
 * Action types for engagement metrics feature.
 */

/**
 * Sets the engagement metrics visibility state.
 * {{
 *      type: SET_ENGAGEMENT_METRICS_OPEN,
 *      isOpen
 * }}
 */
export const SET_ENGAGEMENT_METRICS_OPEN: string = 'SET_ENGAGEMENT_METRICS_OPEN';

/**
 * Opens the engagement metrics modal.
 * {{
 *      type: OPEN_ENGAGEMENT_MODAL
 * }}
 */
export const OPEN_ENGAGEMENT_MODAL: string = 'OPEN_ENGAGEMENT_MODAL';

/**
 * Closes the engagement metrics modal.
 * {{
 *      type: CLOSE_ENGAGEMENT_MODAL
 * }}
 */
export const CLOSE_ENGAGEMENT_MODAL: string = 'CLOSE_ENGAGEMENT_MODAL';

/**
 * Action to update the engagement metrics data.
 */
export const UPDATE_METRICS_DATA = 'UPDATE_METRICS_DATA'; 