import { AnyAction } from 'redux';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getLogger } from '../base/logging/functions';
import { getCurrentConference } from '../base/conference/functions';
import { TRACK_ADDED, TRACK_UPDATED, TRACK_REMOVED } from '../base/tracks/actionTypes';
import { captureVideoFrame } from './frame-capture-service';

const logger = getLogger('features/engagement-capture/middleware');

/**
 * Redux middleware to handle engagement capture track events.
 * This directly manages frame capture without modifying core components.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    if ([TRACK_ADDED, TRACK_UPDATED, TRACK_REMOVED].includes(action.type)) {
        const { jitsiTrack, local, mediaType } = action.track || {};
        
        if (!jitsiTrack || local || mediaType !== 'video' || jitsiTrack.disposed) {
            return result;
        }

        const state = store.getState();
        const conference = getCurrentConference(state);
        const meetingId = conference?.getName();
        const participantId = jitsiTrack.getParticipantId();

        if (!meetingId) {
            logger.warn('No meeting ID found in state');
            return result;
        }

        // Handle frame capture based on action type
        switch (action.type) {
            case TRACK_ADDED:
            case TRACK_UPDATED:
                // Start frame capture for this track
                captureVideoFrame(jitsiTrack, participantId, meetingId);
                break;
            
            case TRACK_REMOVED:
                // Clean up is handled by frame-capture-service
                break;
        }

        // Update state for engagement capture
        store.dispatch({
            type: 'ENGAGEMENT_CAPTURE_TRACK_UPDATED',
            participantId,
            meetingId,
            track: jitsiTrack
        });
    }

    return result;
}); 