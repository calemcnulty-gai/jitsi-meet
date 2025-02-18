import { AnyAction } from 'redux';
import { IStore } from '../app/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { FRAME_CAPTURED } from '../engagement-capture/actionTypes';
import { processFrame } from './actions';
import logger from './logger';

/**
 * Middleware to process captured frames.
 */
MiddlewareRegistry.register(({ dispatch }: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
        case FRAME_CAPTURED: {
            const { participantId, meetingId, dataUrl, timestamp } = action;
            const frameId = `${participantId}-${timestamp}`;

            logger.debug(`Processing frame ${frameId} for participant ${participantId}`);
            
            dispatch(processFrame(
                frameId,
                participantId,
                meetingId,
                dataUrl
            ));
            break;
        }
    }

    return result;
}); 