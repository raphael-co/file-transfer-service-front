import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Files: React.FC = () => {
    const [uid, setUid] = useState('');
    const navigate = useNavigate();

    const location = useLocation();
    const [message, setMessage] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const message = queryParams.get('message');
        const uid = queryParams.get('uid');
        if (message) {
            setMessage(message);
        } if (uid) {
            setUid(uid);
        }
    }, [location]);

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
            <div className="app">
                <div className='container-wrapper'>
                    <div className={`upload-container`}>
                        <div className="tab-container">
                            <div className='tab-buttons' style={{ margin: 0, justifyContent: 'center' }}>
                                Write the uid directory
                            </div>
                        </div>

                        <div className='tab-container'>
                            <input
                                type="text"
                                placeholder="Enter UUID"
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
                            rechercher
                        </button>
                        {message && <div className="error-message">{message}</div>}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Files;
