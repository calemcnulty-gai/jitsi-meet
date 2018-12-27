/* global JitsiMeetJS */

import DeviceSelectionPopup from './DeviceSelectionPopup';

let deviceSelectionPopup;

window.init = i18next => {
    JitsiMeetJS.init();
    deviceSelectionPopup = new DeviceSelectionPopup(i18next);
};

window.addEventListener('beforeunload', () => deviceSelectionPopup.close());
