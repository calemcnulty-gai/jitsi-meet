import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Dialog from '../../base/ui/components/web/Dialog';
import { IReduxState } from '../../app/types';
import { subscribeToEngagementMetrics, initializeFirebase } from '../firebaseService';
import { updateMetricsData } from '../actions';
import { getCurrentConference } from '../../base/conference/functions';
import logger from '../logger';

interface IProps {
    onClose?: () => void;
}

interface IAnalysis {
    facial: {
        landmarks: {
            leftEye: { x: number; y: number };
            rightEye: { x: number; y: number };
            nose: { x: number; y: number };
            leftMouth: { x: number; y: number };
            rightMouth: { x: number; y: number };
        };
        headPose: {
            roll: number;
            pitch: number;
            yaw: number;
        };
        eyesOpen: boolean;
    };
    emotion: {
        emotions: {
            happy: number;
            sad: number;
            angry: number;
            surprised: number;
            neutral: number;
        };
        confidence: number;
    };
    gaze: {
        isLookingAtScreen: boolean;
        confidence: number;
        gazeVector: {
            x: number;
            y: number;
            z: number;
        };
        headPose: {
            pitch: number;
            yaw: number;
            roll: number;
        };
    };
}

interface IEngagementScore {
    score: number;
    factors: {
        eyeContact: number;
        emotion: number;
        attention: number;
    };
    timestamp: number;
}

interface IMetricData {
    timestamp: number;
    processedAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    score: IEngagementScore;
    participantId: string;
    analysis: IAnalysis;
    storagePath: string;
}

const COLORS = {
    happy: '#4CAF50',
    sad: '#2196F3',
    angry: '#F44336',
    surprised: '#FFC107',
    neutral: '#9E9E9E'
};

const EMOTION_COLORS = Object.values(COLORS);

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

/**
 * Component for displaying real-time engagement metrics in a modal.
 *
 * @returns {JSX.Element} The rendered component.
 */
const EngagementMetricsModal: React.FC<IProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const conference = useSelector((state: IReduxState) => getCurrentConference(state));
    const [error, setError] = React.useState<string | null>(null);
    
    const metricsData = useSelector((state: IReduxState) => {
        try {
            const data = state['features/engagement-metrics'].metricsData;
            logger.info('Modal received metrics data:', data);
            return data as IMetricData[];
        } catch (err) {
            logger.error('Error accessing metrics data:', err);
            setError('Error accessing metrics data');
            return [];
        }
    });

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupFirebase = async () => {
            try {
                await initializeFirebase(firebaseConfig);

                if (conference?.room) {
                    const roomUrl = conference.room.toString();
                    const meetingId = roomUrl.split('/').pop();
                    if (meetingId) {
                        unsubscribe = subscribeToEngagementMetrics(meetingId, (data) => {
                            try {
                                logger.info('Subscription callback received data:', data);
                                dispatch(updateMetricsData(data));
                            } catch (err) {
                                logger.error('Error in subscription callback:', err);
                                setError('Error processing metrics update');
                            }
                        });
                    }
                }
            } catch (error) {
                logger.error('Failed to initialize Firebase:', error);
                setError('Failed to initialize Firebase connection');
            }
        };

        setupFirebase();

        return () => {
            try {
                if (unsubscribe) {
                    unsubscribe();
                }
            } catch (err) {
                logger.error('Error unsubscribing:', err);
            }
        };
    }, [conference, dispatch]);

    // Group data by participant
    const participantData = React.useMemo(() => {
        try {
            logger.info('Grouping metrics data:', metricsData);
            const dataMap = new Map<string, IMetricData[]>();
            metricsData.forEach(data => {
                logger.debug('Processing metric:', data);
                const existing = dataMap.get(data.participantId) || [];
                dataMap.set(data.participantId, [...existing, data]);
            });
            const result = Array.from(dataMap.entries()).map(([participantId, data]) => ({
                participantId,
                data: data.sort((a, b) => a.timestamp - b.timestamp)
            }));
            logger.info('Grouped participant data:', result);
            return result;
        } catch (err) {
            logger.error('Error grouping participant data:', err);
            setError('Error processing participant data');
            return [];
        }
    }, [metricsData]);

    // Function to get aggregated emotion data for pie chart
    const getAggregatedEmotionData = (data: IMetricData[]) => {
        try {
            logger.debug('Getting aggregated emotion data from metrics:', data);
            
            // Initialize emotion totals
            const emotionTotals = {
                happy: 0,
                sad: 0,
                angry: 0,
                surprised: 0,
                neutral: 0
            };
            let totalConfidence = 0;
            let validEmotionCount = 0;

            // Sum up all emotions, weighted by confidence
            data.forEach(metric => {
                if (metric.analysis?.emotion?.emotions) {
                    const emotions = metric.analysis.emotion.emotions;
                    const confidence = metric.analysis.emotion.confidence || 1;
                    
                    Object.entries(emotions).forEach(([emotion, value]) => {
                        emotionTotals[emotion as keyof typeof emotionTotals] += value * confidence;
                    });
                    
                    totalConfidence += confidence;
                    validEmotionCount++;
                }
            });

            // If no valid emotions found, return empty array
            if (validEmotionCount === 0) {
                logger.warn('No valid emotion data found');
                return [];
            }

            // Convert totals to averages and create pie chart data
            const result = Object.entries(emotionTotals).map(([emotion, total]) => ({
                name: emotion,
                value: total / validEmotionCount
            }));

            logger.debug('Processed aggregated emotion data:', result);
            return result;
        } catch (err) {
            logger.error('Error processing aggregated emotion data:', err);
            return [];
        }
    };

    const renderParticipantSection = (participantId: string, data: IMetricData[]) => {
        try {
            return (
                <div key={participantId} className='metrics-section'>
                    <h3>Participant: {participantId}</h3>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Engagement Score Line Chart */}
                        <div style={{ flex: '2', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="timestamp"
                                        tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                                    />
                                    <YAxis domain={[0, 1]} />
                                    <Tooltip
                                        labelFormatter={(timestamp) => new Date(Number(timestamp)).toLocaleString()}
                                        formatter={(value: number) => [value.toFixed(2), 'Score']}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="score.score"
                                        stroke="#8884d8"
                                        name="Engagement Score"
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Aggregated Emotion Pie Chart */}
                        <div style={{ flex: '1', minWidth: '300px' }}>
                            <h4 style={{ textAlign: 'center', margin: '10px 0' }}>
                                Emotional Distribution
                            </h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={getAggregatedEmotionData(data)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        isAnimationActive={false}>
                                        {
                                            getAggregatedEmotionData(data).map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[entry.name as keyof typeof COLORS]}
                                                />
                                            ))
                                        }
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number, name: string) => [`${Math.round(value * 100)}%`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            );
        } catch (err) {
            logger.error('Error rendering participant section:', err);
            return (
                <div key={participantId} className='metrics-section'>
                    <h3>Error displaying metrics for participant: {participantId}</h3>
                </div>
            );
        }
    };

    return (
        <Dialog
            ok = {{ translationKey: 'dialog.close' }}
            onSubmit = { onClose }
            size = 'large'
            titleKey = 'dialog.engagementMetrics'>
            <div className = 'engagement-metrics-content' style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {error && (
                    <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
                        {error}
                    </div>
                )}
                {participantData.map(({ participantId, data }) => 
                    renderParticipantSection(participantId, data)
                )}
            </div>
        </Dialog>
    );
};

export default EngagementMetricsModal; 