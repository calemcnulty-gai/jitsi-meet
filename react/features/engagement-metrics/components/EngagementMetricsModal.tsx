import React, { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { List, AutoSizer } from 'react-virtualized';
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

// Extracted constants
const CHART_HEIGHT = 300;
const CHART_MARGIN = 20;
const PARTICIPANT_SECTION_HEIGHT = 400;
const DATA_WINDOW_MINUTES = 5;
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

// Memoized chart components
const MemoizedLineChart: React.FC<{ data: IMetricData[] }> = React.memo(({ data }) => (
    <ResponsiveContainer height={CHART_HEIGHT}>
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis domain={[0, 1]} />
            <Tooltip
                labelFormatter={(timestamp) => new Date(Number(timestamp)).toLocaleString()}
                contentStyle={{ background: '#fff', border: '1px solid #ccc' }}
            />
            <Legend />
            <Line 
                type="monotone" 
                dataKey="score.score" 
                stroke="#8884d8" 
                name="Engagement Score"
                dot={false}
                isAnimationActive={false}
            />
        </LineChart>
    </ResponsiveContainer>
));

const MemoizedPieChart: React.FC<{ data: Array<{ name: string; value: number }> }> = React.memo(({ data }) => (
    <ResponsiveContainer height={CHART_HEIGHT}>
        <PieChart>
            <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                isAnimationActive={false}
            >
                {data.map((entry, index) => (
                    <Cell key={entry.name} fill={EMOTION_COLORS[index % EMOTION_COLORS.length]} />
                ))}
            </Pie>
            <Tooltip />
            <Legend />
        </PieChart>
    </ResponsiveContainer>
));

// Extracted participant section component
const ParticipantSection: React.FC<{
    participantId: string;
    data: IMetricData[];
}> = React.memo(({ participantId, data }) => {
    const emotionData = useMemo(() => getAggregatedEmotionData(data), [data]);
    
    return (
        <div className='metrics-section'>
            <h3>Participant: {participantId}</h3>
            <div style={{ display: 'flex', gap: CHART_MARGIN }}>
                <div style={{ flex: '2' }}>
                    <MemoizedLineChart data={data} />
                </div>
                <div style={{ flex: '1' }}>
                    <MemoizedPieChart data={emotionData} />
                </div>
            </div>
        </div>
    );
});

// Optimized data processing functions
const processMetricsData = (data: IMetricData[]): Map<string, IMetricData[]> => {
    const dataMap = new Map<string, IMetricData[]>();
    const cutoffTime = Date.now() - (DATA_WINDOW_MINUTES * 60 * 1000);
    
    data.forEach(metric => {
        if (metric.timestamp < cutoffTime) return;
        
        const existing = dataMap.get(metric.participantId) || [];
        dataMap.set(metric.participantId, [...existing, metric]);
    });
    
    // Sort data for each participant
    dataMap.forEach((metrics, participantId) => {
        dataMap.set(participantId, metrics.sort((a, b) => a.timestamp - b.timestamp));
    });
    
    return dataMap;
};

const getAggregatedEmotionData = (data: IMetricData[]) => {
    const emotionTotals = {
        happy: 0,
        sad: 0,
        angry: 0,
        surprised: 0,
        neutral: 0
    };
    let totalConfidence = 0;
    let validEmotionCount = 0;

    // Process only the last 100 data points for performance
    const recentData = data.slice(-100);
    
    recentData.forEach(metric => {
        const emotions = metric.analysis?.emotion?.emotions;
        const confidence = metric.analysis?.emotion?.confidence || 0;
        
        if (emotions && confidence > 0.5) {
            Object.entries(emotions).forEach(([emotion, value]) => {
                emotionTotals[emotion as keyof typeof emotionTotals] += value * confidence;
            });
            totalConfidence += confidence;
            validEmotionCount++;
        }
    });

    if (validEmotionCount === 0) return [];

    return Object.entries(emotionTotals).map(([emotion, total]) => ({
        name: emotion,
        value: total / (validEmotionCount || 1)
    }));
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
            return state['features/engagement-metrics'].metricsData as IMetricData[];
        } catch (err) {
            logger.error('Error accessing metrics data:', err);
            setError('Error accessing metrics data');
            return [];
        }
    });

    const processedData = useMemo(() => {
        try {
            return Array.from(processMetricsData(metricsData).entries())
                .map(([participantId, data]) => ({
                    participantId,
                    data
                }));
        } catch (err) {
            logger.error('Error processing metrics data:', err);
            setError('Error processing metrics data');
            return [];
        }
    }, [metricsData]);

    const handleMetricsUpdate = useCallback((data: IMetricData[]) => {
        try {
            dispatch(updateMetricsData(data));
        } catch (err) {
            logger.error('Error in metrics update:', err);
            setError('Error processing metrics update');
        }
    }, [dispatch]);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupFirebase = async () => {
            try {
                if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                    throw new Error('Missing required Firebase configuration');
                }
                
                await initializeFirebase({
                    ...firebaseConfig,
                    apiKey: firebaseConfig.apiKey as string,
                    projectId: firebaseConfig.projectId as string
                });

                if (conference?.room) {
                    const meetingId = conference.room.toString().split('/').pop();
                    if (meetingId) {
                        unsubscribe = subscribeToEngagementMetrics(meetingId, handleMetricsUpdate);
                    }
                }
            } catch (error) {
                logger.error('Failed to initialize Firebase:', error);
                setError('Failed to initialize Firebase connection');
            }
        };

        setupFirebase();
        return () => unsubscribe?.();
    }, [conference, handleMetricsUpdate]);

    const renderRow = useCallback(({ index, style }) => (
        <div style={style}>
            <ParticipantSection
                participantId={processedData[index].participantId}
                data={processedData[index].data}
            />
        </div>
    ), [processedData]);

    return (
        <Dialog
            onClose={onClose}
            size="large"
            className="engagement-metrics-modal"
        >
            <div className="modal-header">
                <h2>{t('engagementMetrics.title')}</h2>
                {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="modal-content" style={{ height: '80vh' }}>
                <AutoSizer>
                    {({ width, height }) => (
                        <List
                            width={width}
                            height={height}
                            rowCount={processedData.length}
                            rowHeight={PARTICIPANT_SECTION_HEIGHT}
                            rowRenderer={renderRow}
                            overscanRowCount={2}
                        />
                    )}
                </AutoSizer>
            </div>
        </Dialog>
    );
};

export default React.memo(EngagementMetricsModal); 