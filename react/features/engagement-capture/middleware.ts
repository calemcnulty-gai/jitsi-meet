import { AnyAction } from 'redux';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getCurrentConference } from '../base/conference/functions';
import { TRACK_ADDED, TRACK_UPDATED, TRACK_REMOVED } from '../base/tracks/actionTypes';
import { captureVideoFrame } from './frame-capture-service';
import logger from './logger';
import { getLocalParticipant } from '../base/participants/functions';
import { SET_ROOM } from '../base/conference/actionTypes';

/**
 * Redux middleware to handle engagement capture track events.
 * This directly manages frame capture without modifying core components.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    // Handle room initialization
    if (action.type === SET_ROOM) {
        logger.info(`Room set to: ${action.room}`);
    }

    if ([TRACK_ADDED, TRACK_UPDATED, TRACK_REMOVED].includes(action.type)) {
        logger.debug(`Processing ${action.type} event`);
        const { jitsiTrack, local, mediaType } = action.track || {};
        
        if (!jitsiTrack) {
            logger.debug('No jitsiTrack found in action, skipping');
            return result;
        }

        // We only want to capture local video tracks
        if (!local || !jitsiTrack.isLocal()) {
            logger.debug('Track is not local, skipping');
            return result;
        }

        if (mediaType !== 'video') {
            logger.debug(`Track is ${mediaType}, skipping non-video track`);
            return result;
        }

        if (jitsiTrack.disposed) {
            logger.debug('Track is disposed, skipping');
            return result;
        }

        const state = store.getState();
        const conference = getCurrentConference(state);
        
        // Get the unique meeting ID from the conference
        const meetingId = conference?.getMeetingUniqueId() || conference?.getName() || state['features/base/conference'].room;
        const localParticipant = getLocalParticipant(state);

        if (!localParticipant) {
            logger.warn('No local participant found in state');
            return result;
        }

        // Use a consistent participant identifier
        // First try email as it's most likely to be consistent across sessions
        // Then try jwtId which might be consistent for the current session
        // Finally fall back to the participant id which is guaranteed to exist
        const participantId = localParticipant.email 
            ? `email:${localParticipant.email}`  // prefix to avoid collisions with other ID types
            : localParticipant.jwtId 
                ? `jwt:${localParticipant.jwtId}` 
                : `local:${localParticipant.id}`;

        if (!meetingId) {
            logger.warn('No meeting ID found in state');
            return result;
        }

        logger.info(`Using unique meeting ID: ${meetingId} for participant: ${participantId}`);

        // Handle frame capture based on action type
        switch (action.type) {
            case TRACK_ADDED:
            case TRACK_UPDATED:
                logger.info(`Starting frame capture for local participant ${participantId}`);
                captureVideoFrame(jitsiTrack, participantId, meetingId);
                break;
            
            case TRACK_REMOVED:
                logger.info(`Track removed for local participant ${participantId}, cleanup will be handled by frame-capture-service`);
                break;
        }

        logger.debug('Dispatching ENGAGEMENT_CAPTURE_TRACK_UPDATED action');
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