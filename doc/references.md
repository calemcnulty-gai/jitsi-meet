Querying Perplexity AI using sonar-pro for: Jitsi Meet documentation links, handbook, developer guide, and API references
Here are the key Jitsi Meet documentation resources:

- Jitsi Meet Handbook: https://jitsi.github.io/handbook/

- Developer Guide: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-web-jitsi-meet/

- lib-jitsi-meet API (low-level): https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-ljm-api

- IFrame API: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/

- Architecture overview: https://github.com/jitsi/handbook/blob/master/docs/architecture.md

- Quick installation guide: https://github.com/jitsi/handbook/blob/master/docs/devops-guide/quickstart.md

Key API examples:

Initialize Jitsi Meet:
```javascript
JitsiMeetJS.init();
```

Create connection:
```javascript
var connection = new JitsiMeetJS.JitsiConnection(null, null, options);
```

Create conference:
```javascript
room = connection.initJitsiConference("conference1", confOptions);
```

Join conference:
```javascript
room.join();
```

Embed Jitsi Meet:
```javascript
const domain = 'meet.jit.si';
const options = {
  roomName: 'MyMeeting',
  width: 700,
  height: 700,
  parentNode: document.querySelector('#meet')
};
const api = new JitsiMeetExternalAPI(domain, options);
```