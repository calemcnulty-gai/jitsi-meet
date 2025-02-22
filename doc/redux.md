Querying Perplexity AI using sonar-pro for: What are the most important Redux actions and events in Jitsi Meet that plugins should handle? Include conference events, participant events, and media events with code examples.
The most important Redux actions and events in Jitsi Meet that plugins should handle include:

Conference events:
- CONFERENCE_JOINED: Fired when the local user joins the conference
- CONFERENCE_LEFT: Fired when the local user leaves the conference

```javascript
api.addListener('videoConferenceJoined', (data) => {
  console.log('Joined conference', data.roomName);
});

api.addListener('videoConferenceLeft', (data) => {
  console.log('Left conference', data.roomName);  
});
```

Participant events:
- PARTICIPANT_JOINED: Fired when a new participant joins
- PARTICIPANT_LEFT: Fired when a participant leaves

```javascript
api.addListener('participantJoined', (data) => {
  console.log('Participant joined', data.id);
});

api.addListener('participantLeft', (data) => {
  console.log('Participant left', data.id);
});
```

Media events:
- TRACK_ADDED: Fired when a new media track is added
- TRACK_REMOVED: Fired when a media track is removed
- TRACK_MUTE_CHANGED: Fired when a track is muted/unmuted

```javascript
api.addListener('trackAdded', (track) => {
  console.log('Track added', track.getType());
});

api.addListener('trackRemoved', (track) => {
  console.log('Track removed', track.getType());
});

api.addListener('trackMuteChanged', (track) => {
  console.log('Track mute changed', track.getType(), track.isMuted());
});
```

Chat events:
- CHAT_MESSAGE_RECEIVED: Fired when a chat message is received

```javascript
api.addListener('incomingMessage', (data) => {
  console.log('Received message', data.message);
});
```

Redux actions:
- createConference: Creates a new conference
- joinConference: Joins an existing conference
- leaveConference: Leaves the current conference

```javascript
dispatch(createConference(roomName));
dispatch(joinConference(roomName));
dispatch(leaveConference());
```

These events and actions cover the core functionality of joining/leaving conferences, tracking participants, handling media tracks, and receiving chat messages[3][6][9].