// @flow

// XXX: AlwaysOnTop imports the button directly in order to avoid bringing in
// other components that use lib-jitsi-meet, which always on top does not
// import.
import AbstractVideoMuteButton
    from '../toolbox/components/buttons/AbstractVideoMuteButton';
import type { Props } from '../toolbox/components/buttons/AbstractButton';

const { api } = window.alwaysOnTop;

type State = {

    /**
     * Whether video is available is not.
     */
    videoAvailable: boolean,

    /**
     * Whether video is muted or not.
     */
    videoMuted: boolean
};

/**
 * Stateless hangup button for the Always-on-Top windows.
 */
export default class VideoMuteButton
    extends AbstractVideoMuteButton<Props, State> {

    /**
     * Initializes a new {@code VideoMuteButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code VideoMuteButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            videoAvailable: false,
            videoMuted: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._videoAvailabilityListener
            = this._videoAvailabilityListener.bind(this);
        this._videoMutedListener = this._videoMutedListener.bind(this);
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('videoAvailabilityChanged', this._videoAvailabilityListener);
        api.on('videoMuteStatusChanged', this._videoMutedListener);

        Promise.all([
            api.isVideoAvailable(),
            api.isVideoMuted()
        ])
            .then(values => {
                const [ videoAvailable, videoMuted ] = values;

                this.setState({
                    videoAvailable,
                    videoMuted
                });
            })
            .catch(console.error);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener('videoAvailabilityChanged',
            this._videoAvailabilityListener);
        api.removeListener('videoMuteStatusChanged',
            this._videoMutedListener);
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.state.videoAvailable;
    }

    /**
     * Indicates if video is currently muted ot nor.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.state.videoMuted;
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @private
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) { // eslint-disable-line no-unused-vars
        this.state.videoAvailable && api.executeCommand('toggleVideo');
    }

    _videoAvailabilityListener: ({ available: boolean }) => void;

    /**
     * Handles video available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _videoAvailabilityListener({ available }) {
        this.setState({ videoAvailable: available });
    }

    _videoMutedListener: ({ muted: boolean }) => void;

    /**
     * Handles video muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _videoMutedListener({ muted }) {
        this.setState({ videoMuted: muted });
    }
}
