/* @flow */

import { i18next } from '../../base/i18n';
import {
    FlacAdapter,
    OggAdapter,
    WavAdapter
} from '../recording';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * XMPP command for signaling the start of local recording to all clients.
 * Should be sent by the moderator only.
 */
const COMMAND_START = 'localRecStart';

/**
 * XMPP command for signaling the stop of local recording to all clients.
 * Should be sent by the moderator only.
 */
const COMMAND_STOP = 'localRecStop';

/**
 * Participant property key for local recording stats.
 */
const PROPERTY_STATS = 'localRecStats';

/**
 * Default recording format.
 */
const DEFAULT_RECORDING_FORMAT = 'flac';

/**
 * States of the {@code RecordingController}.
 */
const ControllerState = Object.freeze({
    /**
     * Idle (not recording).
     */
    IDLE: Symbol('IDLE'),

    /**
     * Engaged (recording).
     */
    RECORDING: Symbol('RECORDING')
});

/**
 * Type of the stats reported by each participant (client).
 */
type RecordingStats = {

    /**
     * Current local recording session token used by the participant.
     */
    currentSessionToken: number,

    /**
     * Whether local recording is engaged on the participant's device.
     */
    isRecording: boolean,

    /**
     * Total recorded bytes. (Reserved for future use.)
     */
    recordedBytes: number,

    /**
     * Total recording duration. (Reserved for future use.)
     */
    recordedLength: number
}

/**
 * The component responsible for the coordination of local recording, across
 * multiple participants.
 * Current implementation requires that there is only one moderator in a room.
 */
class RecordingController {

    /**
     * For each recording session, there is a separate @{code RecordingAdapter}
     * instance so that encoded bits from the previous sessions can still be
     * retrieved after they ended.
     *
     * @private
     */
    _adapters = {};

    /**
     * The {@code JitsiConference} instance.
     *
     * @private
     */
    _conference: * = null;

    /**
     * Current recording session token.
     * Session token is a number generated by the moderator, to ensure every
     * client is in the same recording state.
     *
     * @private
     */
    _currentSessionToken: number = -1;

    /**
     * Current state of {@code RecordingController}.
     *
     * @private
     */
    _state = ControllerState.IDLE;

    /**
     * Current recording format. This will be in effect from the next
     * recording session, i.e., if this value is changed during an on-going
     * recording session, that on-going session will not use the new format.
     *
     * @private
     */
    _format = DEFAULT_RECORDING_FORMAT;

    /**
     * Whether or not the {@code RecordingController} has registered for
     * XMPP events. Prevents initialization from happening multiple times.
     *
     * @private
     */
    _registered = false;

    /**
     * FIXME: callback function for the {@code RecordingController} to notify
     * UI it wants to display a notice. Keeps {@code RecordingController}
     * decoupled from UI.
     */
    onNotify: ?(string) => void;

    /**
     * FIXME: callback function for the {@code RecordingController} to notify
     * UI it wants to display a warning. Keeps {@code RecordingController}
     * decoupled from UI.
     */
    onWarning: ?(string) => void;

    /**
     * FIXME: callback function for the {@code RecordingController} to notify
     * UI that the local recording state has changed.
     */
    onStateChanged: ?(boolean) => void;

    /**
     * Constructor.
     *
     * @returns {void}
     */
    constructor() {
        this._updateStats = this._updateStats.bind(this);
        this._onStartCommand = this._onStartCommand.bind(this);
        this._onStopCommand = this._onStopCommand.bind(this);
        this._doStartRecording = this._doStartRecording.bind(this);
        this._doStopRecording = this._doStopRecording.bind(this);
        this.registerEvents = this.registerEvents.bind(this);
        this.getParticipantsStats = this.getParticipantsStats.bind(this);
    }

    registerEvents: () => void;

    /**
     * Registers listeners for XMPP events.
     *
     * @param {JitsiConference} conference - {@code JitsiConference} instance.
     * @returns {void}
     */
    registerEvents(conference: Object) {
        if (!this._registered) {
            this._conference = conference;
            if (this._conference) {
                this._conference
                    .addCommandListener(COMMAND_STOP, this._onStopCommand);
                this._conference
                    .addCommandListener(COMMAND_START, this._onStartCommand);
                this._registered = true;
            }
        }
    }

    /**
     * Signals the participants to start local recording.
     *
     * @returns {void}
     */
    startRecording() {
        this.registerEvents();
        if (this._conference && this._conference.isModerator()) {
            this._conference.removeCommand(COMMAND_STOP);
            this._conference.sendCommand(COMMAND_START, {
                attributes: {
                    sessionToken: this._getRandomToken(),
                    format: this._format
                }
            });
        } else {
            const message = i18next.t('localRecording.messages.notModerator');

            if (this.onWarning) {
                this.onWarning(message);
            }
        }
    }

    /**
     * Signals the participants to stop local recording.
     *
     * @returns {void}
     */
    stopRecording() {
        if (this._conference) {
            if (this._conference.isModerator) {
                this._conference.removeCommand(COMMAND_START);
                this._conference.sendCommand(COMMAND_STOP, {
                    attributes: {
                        sessionToken: this._currentSessionToken
                    }
                });
            } else {
                const message
                    = i18next.t('localRecording.messages.notModerator');

                if (this.onWarning) {
                    this.onWarning(message);
                }
            }
        }
    }

    /**
     * Triggers the download of recorded data.
     * Browser only.
     *
     * @param {number} sessionToken - The token of the session to download.
     * @returns {void}
     */
    downloadRecordedData(sessionToken: number) {
        if (this._adapters[sessionToken]) {
            this._adapters[sessionToken].download();
        } else {
            logger.error(`Invalid session token for download ${sessionToken}`);
        }
    }

    /**
     * Switches the recording format.
     *
     * @param {string} newFormat - The new format.
     * @returns {void}
     */
    switchFormat(newFormat: string) {
        this._format = newFormat;
        logger.log(`Recording format switched to ${newFormat}`);

        // the new format will be used in the next recording session
    }

    /**
     * Returns the local recording stats.
     *
     * @returns {RecordingStats}
     */
    getLocalStats(): RecordingStats {
        return {
            currentSessionToken: this._currentSessionToken,
            isRecording: this._state === ControllerState.RECORDING,
            recordedBytes: 0,
            recordedLength: 0
        };
    }

    getParticipantsStats: () => *;

    /**
     * Returns the remote participants' local recording stats.
     *
     * @returns {*}
     */
    getParticipantsStats() {
        const members
            = this._conference.getParticipants()
            .map(member => {
                return {
                    id: member.getId(),
                    displayName: member.getDisplayName(),
                    recordingStats:
                        JSON.parse(member.getProperty(PROPERTY_STATS) || '{}'),
                    isSelf: false
                };
            });

        // transform into a dictionary,
        // for consistent ordering
        const result = {};

        for (let i = 0; i < members.length; ++i) {
            result[members[i].id] = members[i];
        }
        const localId = this._conference.myUserId();

        result[localId] = {
            id: localId,
            displayName: i18next.t('localRecording.localUser'),
            recordingStats: this.getLocalStats(),
            isSelf: true
        };

        return result;
    }

    _updateStats: () => void;

    /**
     * Sends out updates about the local recording stats via XMPP.
     *
     * @private
     * @returns {void}
     */
    _updateStats() {
        if (this._conference) {
            this._conference.setLocalParticipantProperty(PROPERTY_STATS,
                JSON.stringify(this.getLocalStats()));
        }
    }

    _onStartCommand: (*) => void;

    /**
     * Callback function for XMPP event.
     *
     * @private
     * @param {*} value - The event args.
     * @returns {void}
     */
    _onStartCommand(value) {
        const { sessionToken, format } = value.attributes;

        if (this._state === ControllerState.IDLE) {
            this._format = format;
            this._currentSessionToken = sessionToken;
            this._adapters[sessionToken]
                 = this._createRecordingAdapter();
            this._doStartRecording();
        } else if (this._currentSessionToken !== sessionToken) {
            // we need to restart the recording
            this._doStopRecording().then(() => {
                this._format = format;
                this._currentSessionToken = sessionToken;
                this._adapters[sessionToken]
                    = this._createRecordingAdapter();
                this._doStartRecording();
            });
        }
    }

    _onStopCommand: (*) => void;

    /**
     * Callback function for XMPP event.
     *
     * @private
     * @param {*} value - The event args.
     * @returns {void}
     */
    _onStopCommand(value) {
        if (this._state === ControllerState.RECORDING
            && this._currentSessionToken === value.attributes.sessionToken) {
            this._doStopRecording();
        }
    }

    /**
     * Generates a token that can be used to distinguish each
     * recording session.
     *
     * @returns {number}
     */
    _getRandomToken() {
        return Math.floor(Math.random() * 10000) + 1;
    }

    _doStartRecording: () => void;

    /**
     * Starts the recording locally.
     *
     * @private
     * @returns {void}
     */
    _doStartRecording() {
        if (this._state === ControllerState.IDLE) {
            this._state = ControllerState.RECORDING;
            const delegate = this._adapters[this._currentSessionToken];

            delegate.start()
            .then(() => {
                logger.log('Local recording engaged.');
                const message = i18next.t('localRecording.messages.engaged');

                if (this.onNotify) {
                    this.onNotify(message);
                }
                if (this.onStateChanged) {
                    this.onStateChanged(true);
                }
                this._updateStats();
            })
            .catch(err => {
                logger.error('Failed to start local recording.', err);
            });
        }

    }

    _doStopRecording: () => Promise<void>;

    /**
     * Stops the recording locally.
     *
     * @private
     * @returns {Promise<void>}
     */
    _doStopRecording() {
        if (this._state === ControllerState.RECORDING) {
            const token = this._currentSessionToken;

            return this._adapters[this._currentSessionToken]
                .stop()
                .then(() => {
                    this._state = ControllerState.IDLE;
                    logger.log('Local recording unengaged.');
                    this.downloadRecordedData(token);

                    const message
                        = i18next.t('localRecording.messages.finished',
                            {
                                token
                            });

                    if (this.onNotify) {
                        this.onNotify(message);
                    }
                    if (this.onStateChanged) {
                        this.onStateChanged(false);
                    }
                    this._updateStats();
                })
                .catch(err => {
                    logger.error('Failed to stop local recording.', err);
                });
        }

        /* eslint-disable */
        return (Promise.resolve(): Promise<void>); 
        // FIXME: better ways to satisfy flow and ESLint at the same time?
        /* eslint-enable */

    }

    /**
     * Creates a recording adapter according to the current recording format.
     *
     * @private
     * @returns {RecordingAdapter}
     */
    _createRecordingAdapter() {
        logger.debug('[RecordingController] creating recording'
            + ` adapter for ${this._format} format.`);

        switch (this._format) {
        case 'ogg':
            return new OggAdapter();
        case 'flac':
            return new FlacAdapter();
        case 'wav':
            return new WavAdapter();
        default:
            throw new Error(`Unknown format: ${this._format}`);
        }
    }
}

/**
 * Global singleton of {@code RecordingController}.
 */
export const recordingController = new RecordingController();
