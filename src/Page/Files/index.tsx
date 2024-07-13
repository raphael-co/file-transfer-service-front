import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './files.css';

const Files: React.FC = () => {
    const [uid, setUid] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');

    const [uploadStats, setUploadStats] = useState<null | {
        weeklyStats: { totalUploads: number, totalFiles: string },
        yearlyStats: { totalUploads: number, totalFiles: string },
        allTimeStats: { totalUploads: number, totalFiles: string }
    }>(null);

    const [downloadStats, setDownloadStats] = useState<null | {
        weeklyStats: { totalDownloads: number, totalFiles: string },
        yearlyStats: { totalDownloads: number, totalFiles: string },
        allTimeStats: { totalDownloads: number, totalFiles: string }
    }>(null);

    const [loadingUploads, setLoadingUploads] = useState(true);
    const [loadingDownloads, setLoadingDownloads] = useState(true);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const message = queryParams.get('message');
        const uid = queryParams.get('uid');
        if (message) {
            setMessage(message);
        }
        if (uid) {
            setUid(uid);
        }
    }, [location]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const uploadsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/stats/uploads`);
                setUploadStats(uploadsResponse.data);
            } catch (error) {
                console.error('Error fetching upload stats:', error);
                setUploadStats(null);
            } finally {
                setLoadingUploads(false);
            }

            try {
                const downloadsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/stats/downloads`);
                setDownloadStats(downloadsResponse.data);
            } catch (error) {
                console.error('Error fetching download stats:', error);
                setDownloadStats(null);
            } finally {
                setLoadingDownloads(false);
            }
        };

        fetchStats();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUid(e.target.value);
    };

    const handleTransfer = () => {
        if (uid) {
            navigate(`/file/${uid}`);
        }
    };

    return (
        <div className="App">
            <div className="app-files">
                <div className='container-wrapper-stats'>
                    <div className='stats'>
                        <h3>All Time Stats</h3>
                        <div>
                            <strong>Projects transferred:</strong><br />
                            {loadingUploads ? <span className="loading-counter"></span> : uploadStats ? uploadStats.allTimeStats.totalUploads : 'Null'}
                        </div>
                        <div>
                            <strong>Files transferred:</strong><br />
                            {loadingUploads ? <span className="loading-counter"></span> : uploadStats ? uploadStats.allTimeStats.totalFiles : 'Null'}
                        </div>
                    </div >
                    <div className='stats'>
                        <h3>Yearly Stats</h3>
                        <div>
                            <strong>Projects transferred:</strong><br />
                            {loadingUploads ? <span className="loading-counter"></span> : uploadStats ? uploadStats.yearlyStats.totalUploads : 'Null'}
                        </div>
                        <div>
                            <strong>Files transferred:</strong><br />
                            {loadingUploads ? <span className="loading-counter"></span> : uploadStats ? uploadStats.yearlyStats.totalFiles : 'Null'}
                        </div>
                    </div>
                    <div className='stats'>
                        <h3>Weekly Stats</h3>
                        <div>
                            <strong>Projects transferred:</strong><br />
                            {loadingUploads ? <span className="loading-counter"></span> : uploadStats ? uploadStats.weeklyStats.totalUploads : 'Null'}
                        </div>
                        <div>
                            <strong>Files transferred:</strong><br />
                            {loadingUploads ? <span className="loading-counter"></span> : uploadStats ? uploadStats.weeklyStats.totalFiles : 'Null'}
                        </div>
                    </div>
                </div>
                <div className='container-wrapper'>
                    <div className={`upload-container`}>
                        <div className="tab-container">
                            <div className='tab-buttons' style={{ margin: 0, justifyContent: 'center' }}>
                                Write the UID directory
                            </div>
                        </div>
                        <div className='tab-container'>
                            <input
                                type="text"
                                placeholder="Enter UID"
                                value={uid}
                                onChange={handleChange}
                                className="email-input"
                                style={{ margin: 0 }}
                            />
                        </div>
                        <button
                            className="upload-button"
                            onClick={handleTransfer}
                        >
                            Rechercher
                        </button>
                        {message && <div className="error-message">{message}</div>}
                    </div>
                </div>
                <div className='container-wrapper-stats'>
                    <div className='stats'>
                        <h3>All Time Stats</h3>
                        <div>
                            <strong>ZIP Downloads:</strong><br />
                            {loadingDownloads ? <span className="loading-counter"></span> : downloadStats ? downloadStats.allTimeStats.totalDownloads : 'Null'}
                        </div>
                        <div>
                            <strong>Files Downloads:</strong><br />
                            {loadingDownloads ? <span className="loading-counter"></span> : downloadStats ? downloadStats.allTimeStats.totalFiles : 'Null'}
                        </div>
                    </div>
                    <div className='stats'>
                        <h3>Yearly Stats</h3>
                        <div>
                            <strong>ZIP Downloads:</strong><br />
                            {loadingDownloads ? <span className="loading-counter"></span> : downloadStats ? downloadStats.yearlyStats.totalDownloads : 'Null'}
                        </div>
                        <div>
                            <strong>Files Downloads:</strong><br />
                            {loadingDownloads ? <span className="loading-counter"></span> : downloadStats ? downloadStats.yearlyStats.totalFiles : 'Null'}
                        </div>
                    </div>
                    <div className='stats'>
                        <h3>Weekly Stats</h3>
                        <div>
                            <strong>ZIP Downloads:</strong><br />
                            {loadingDownloads ? <span className="loading-counter"></span> : downloadStats ? downloadStats.weeklyStats.totalDownloads : 'Null'}
                        </div>
                        <div>
                            <strong>Files Downloads:</strong><br />
                            {loadingDownloads ? <span className="loading-counter"></span> : downloadStats ? downloadStats.weeklyStats.totalFiles : 'Null'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Files;
