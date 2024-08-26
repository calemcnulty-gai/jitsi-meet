import { IStateful } from '../base/app/types';
import { getFakeParticipants } from '../base/participants/functions';
import { toState } from '../base/redux/functions';

import {
    ALLOW_ALL_URL_DOMAINS,
    VIDEO_PLAYER_PARTICIPANT_NAME,
    YOUTUBE_PLAYER_PARTICIPANT_NAME,
    YOUTUBE_URL_DOMAIN
} from './constants';

/**
 * Validates the entered video url.
 *
 * It returns a boolean to reflect whether the url matches the youtube regex.
 *
 * @param {string} url - The entered video link.
 * @returns {string} The youtube video id if matched.
 */
function getYoutubeId(url: string) {
    if (!url) {
        return null;
    }

    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|(?:m\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;// eslint-disable-line max-len
    const result = url.match(p);

    return result ? result[1] : null;
}

/**
 * Checks if the status is one that is actually sharing the video - playing, pause or start.
 *
 * @param {string} status - The shared video status.
 * @returns {boolean}
 */
export function isSharingStatus(status: string) {
    return [ 'playing', 'pause', 'start' ].includes(status);
}


/**
 * Returns true if there is a video being shared in the meeting.
 *
 * @param {Object | Function} stateful - The Redux state or a function that gets resolved to the Redux state.
 * @returns {boolean}
 */
export function isVideoPlaying(stateful: IStateful): boolean {
    let videoPlaying = false;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [ id, p ] of getFakeParticipants(stateful)) {
        if (p.name === VIDEO_PLAYER_PARTICIPANT_NAME || p.name === YOUTUBE_PLAYER_PARTICIPANT_NAME) {
            videoPlaying = true;
            break;
        }
    }

    return videoPlaying;
}

/**
 * Extracts a Youtube id or URL from the user input.
 *
 * @param {string} input - The user input.
 * @param {Array<string>} allowedUrlDomains - The allowed URL domains for shared video.
 * @returns {string|undefined}
 */
export function extractYoutubeIdOrURL(input: string, allowedUrlDomains?: Array<string>) {
    if (!input) {
        return;
    }

    const trimmedLink = input.trim();

    if (!trimmedLink) {
        return;
    }

    if (areYoutubeURLsAllowedForSharedVideo(allowedUrlDomains)) {
        const youtubeId = getYoutubeId(trimmedLink);

        if (youtubeId) {
            return youtubeId;
        }
    }

    if (!isURLAllowedForSharedVideo(trimmedLink, allowedUrlDomains)) {
        return;
    }

    return trimmedLink;
}

/**
 * Returns true if shared video functionality is enabled and false otherwise.
 *
 * @param {IStateful} stateful - - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isSharedVideoEnabled(stateful: IStateful) {
    const state = toState(stateful);

    const { allowedUrlDomains = [] } = toState(stateful)['features/shared-video'];
    const { disableThirdPartyRequests = false } = state['features/base/config'];

    return !disableThirdPartyRequests && allowedUrlDomains.length > 0;
}

/**
 * Checks if you youtube URLs should be allowed for shared videos.
 *
 * @param {Array<string>} allowedUrlDomains - The allowed URL domains for shared video.
 * @returns {boolean}
 */
export function areYoutubeURLsAllowedForSharedVideo(allowedUrlDomains?: Array<string>) {
    return Boolean(allowedUrlDomains?.includes(YOUTUBE_URL_DOMAIN));
}

/**
 * Returns true if the passed url is allowed to be used for shared video or not.
 *
 * @param {string} url - The URL.
 * @param {Array<string>} allowedUrlDomains - The allowed url domains.
 * @param {boolean} considerNonURLsAllowedForYoututbe - If true, the invalid URLs will be considered youtube IDs
 * and if youtube is allowed the function will return true.
 * @returns {boolean}
 */
export function isURLAllowedForSharedVideo(url: string,
        allowedUrlDomains: Array<string> = [], considerNonURLsAllowedForYoututbe = false) {
    if (!url) {
        return false;
    }

    try {
        const urlObject = new URL(url);

        if ([ 'http:', 'https:' ].includes(urlObject?.protocol?.toLowerCase())) {
            return allowedUrlDomains.includes(ALLOW_ALL_URL_DOMAINS) || allowedUrlDomains.includes(urlObject?.hostname);
        }
    } catch (_e) { // it should be YouTube id.
        return considerNonURLsAllowedForYoututbe && allowedUrlDomains.includes(YOUTUBE_URL_DOMAIN);
    }

    return false;
}
