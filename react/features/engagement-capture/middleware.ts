import { AnyAction } from 'redux';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getCurrentConference } from '../base/conference/functions';
import { TRACK_ADDED, TRACK_UPDATED, TRACK_REMOVED } from '../base/tracks/actionTypes';
import { captureVideoFrame } from './frameCaptureService';
import logger from './logger';
import { getLocalParticipant, isParticipantModerator } from '../base/participants/functions';
import { IEngagementTrack } from './types';
import { initializeFirebase } from './firebaseService';

// Track active captures to prevent duplicates
const activeCaptures = new Set();

// Track Firebase initialization state and promise
let firebaseInitialized = false;
let firebaseInitPromise: Promise<void> | null = null;

/**
 * Ensures Firebase is initialized before proceeding with capture
 * @returns {Promise<boolean>} Whether Firebase was successfully initialized
 */
async function ensureFirebaseInitialized(): Promise<boolean> {
    if (firebaseInitialized) {
        return true;
    }

    // If initialization is in progress, wait for it
    if (firebaseInitPromise) {
        try {
            await firebaseInitPromise;
            return true;
        } catch (error) {
            return false;
        }
    }

    // Start new initialization
    try {
        firebaseInitPromise = initializeFirebase();
        await firebaseInitPromise;
        firebaseInitialized = true;
        return true;
    } catch (error) {
        logger.error('Failed to initialize Firebase:', error);
        return false;
    } finally {
        firebaseInitPromise = null;
    }
}

/**
 * Redux middleware to handle engagement capture track events.
 * This directly manages frame capture without modifying core components.
 */
MiddlewareRegistry.register(store => next => async action => {
    const result = next(action);
    const state = store.getState();
    const conference = getCurrentConference(state);
    const room = state['features/base/conference'].room;

    // Early return if we don't have a room name
    if (!room) {
        return result;
    }

    const localParticipant = getLocalParticipant(state);
    if (!localParticipant) {
        return result;
    }

    // Skip capture for moderators
    if (isParticipantModerator(localParticipant)) {
        return result;
    }

    // Get participant identifier with fallbacks
    let participantId;
    if (localParticipant.name) {
        participantId = localParticipant.name;
    } else if (localParticipant.email) {
        participantId = localParticipant.email.replace(/[@.]/g, '_');
    } else if (localParticipant.jwtId) {
        participantId = localParticipant.jwtId;
    } else {
        participantId = `participant_${localParticipant.id}`;
    }

    // Handle track events
    if ([TRACK_ADDED, TRACK_UPDATED, TRACK_REMOVED].includes(action.type)) {
        let track = action.track as IEngagementTrack;
        
        // For TRACK_UPDATED, we need to get the full track from state since the action only contains updated properties
        if (action.type === TRACK_UPDATED && track?.jitsiTrack) {
            const tracks = state['features/base/tracks'];
            const fullTrack = tracks.find(t => t.jitsiTrack === track.jitsiTrack);
            if (fullTrack) {
                track = { ...fullTrack, ...track };
            }
        }

        logger.info(`Processing track event ${action.type} for track:`, {
            hasJitsiTrack: !!track?.jitsiTrack,
            isLocal: track?.local,
            mediaType: track?.mediaType,
            disposed: track?.disposed
        });

        // Skip if track is not valid for capture
        if (!track?.jitsiTrack || track.mediaType !== 'video' || track.disposed) {
            logger.info(`Skipping track event ${action.type} - track not valid for capture`);
            return result;
        }

        // For local tracks, verify they are actually local
        if (track.local && !track.jitsiTrack.isLocal()) {
            logger.info(`Skipping track event ${action.type} - track marked local but not actually local`);
            return result;
        }

        logger.info(`Valid track event ${action.type} for participant ${participantId} in room ${room}`);

        if (action.type === TRACK_REMOVED) {
            logger.info(`Track removed for participant ${participantId}, cleanup will be handled by frameCaptureService`);
            activeCaptures.delete(participantId);
            return result;
        }

        // Start capture only if we haven't already started for this participant
        if (conference && !activeCaptures.has(participantId)) {
            // Ensure Firebase is initialized before starting capture
            if (await ensureFirebaseInitialized()) {
                logger.info(`Starting frame capture for participant ${participantId}`);
                activeCaptures.add(participantId);
                captureVideoFrame(track.jitsiTrack, participantId, room);
            } else {
                logger.error('Could not start frame capture - Firebase initialization failed');
            }
        }
    } else if (conference) {
        // If we get a conference and already have a valid track, start capture
        const tracks = state['features/base/tracks'];
        const localVideoTrack = tracks?.find(t => {
            const track = t as IEngagementTrack;
            return track.local && track.mediaType === 'video' && !track.disposed;
        });
        
        if (localVideoTrack?.jitsiTrack && !activeCaptures.has(participantId)) {
            // Ensure Firebase is initialized before starting capture
            if (await ensureFirebaseInitialized()) {
                logger.info(`Conference available, starting frame capture for participant ${participantId}`);
                activeCaptures.add(participantId);
                captureVideoFrame(localVideoTrack.jitsiTrack, participantId, room);
            } else {
                logger.error('Could not start frame capture - Firebase initialization failed');
            }
        }
    }

    return result;
}); 