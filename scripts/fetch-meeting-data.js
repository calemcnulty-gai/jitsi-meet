const admin = require('firebase-admin');
const serviceAccount = require('../jitsi-engagement-firebase-adminsdk-fbsvc-fe3eba0adf.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fetchMeetingData(meetingId) {
    try {
        if (!meetingId) {
            console.error('Please provide a meeting ID as an argument');
            console.error('Usage: node fetch-meeting-data.js <meetingId>');
            process.exit(1);
        }

        // Get all participant collections under the meeting
        // Data structure: /meetings/{meetingId}/{participantId}/{timestamp}.json
        const meetingRef = db.collection('meetings').doc(meetingId);
        const participantCollections = await meetingRef.listCollections();
        
        // Initialize result object
        const result = {};

        // Process each participant
        for (const participantCollection of participantCollections) {
            const participantId = participantCollection.id;
            
            // Get all analysis documents for this participant
            const analysisDocs = await participantCollection
                .orderBy('timestamp')
                .get();
            
            // Convert to array of analysis data
            result[participantId] = analysisDocs.docs.map(doc => doc.data());
        }

        // Output the result
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        throw error;
    } finally {
        admin.app().delete();
    }
}

// Get meeting ID from command line arguments
const meetingId = process.argv[2];
fetchMeetingData(meetingId); 