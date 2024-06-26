import React, { useState, useEffect, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import axios from 'axios';
import './Home.css';

const MAX_FILES_PER_BATCH = 1500;

const Home: React.FC = () => {
  const [files, setFiles] = useState<{ file: File; relativePath: string }[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDir, setUploadDir] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [activeTab, setActiveTab] = useState<'directory' | 'files'>('directory');
  const [disabled, setDisabled] = useState(false);
  const [activeSettings, setActiveSettings] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'link'>('email');
  const [uploadDirUrlMessage, setUploadDirUrlMessage] = useState<string | null>(null);
  const [tooltipMessage, setTooltipMessage] = useState('Copier ?');

  const handleCopyLink = () => {
    if (uploadDirUrlMessage) {
      navigator.clipboard.writeText(uploadDirUrlMessage);
      setTooltipMessage('Copié');
      setTimeout(() => setTooltipMessage('Copier ?'), 2000);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisabled(true);
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileList = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        fileList.push({
          file: selectedFiles[i],
          relativePath: (selectedFiles[i] as any).webkitRelativePath,
        });
      }
      setFiles(fileList);
      setDisabled(false);
    }
  };

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage('');
    setEmailInput(e.target.value);
  };

  const addEmail = () => {
    if (validateEmail(emailInput)) {
      setEmailAddresses([...emailAddresses, emailInput]);
      setEmailInput('');
    } else {
      setMessage('Invalid email address');
    }
  };

  const handleEmailKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addEmail();
    }
  };

  const handleEmailBlur = (e: FocusEvent<HTMLInputElement>) => {
    addEmail();
  };

  const uploadBatch = async (batch: { file: File; relativePath: string }[], batchIndex: number, totalBatches: number) => {
    const formData = new FormData();
    const paths = batch.map(({ relativePath }) => relativePath).join(',');

    batch.forEach(({ file }) => {
      formData.append('files', file);
    });
    formData.append('paths', paths);
    formData.append("emailAddresses", deliveryMethod === 'link' ? '' : emailAddresses.join(','));

    if (uploadDir) {
      formData.append('uploadDir', uploadDir);
    }

    try {
      setDisabled(true);
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(((batchIndex - 1 + (percentCompleted / 100)) / totalBatches) * 100);
          }
        }
      });

      setUploadDirUrlMessage(response.data.uploadDirUrl);
      return response.data.uploadDirUrl;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const uploadFilesOnly = async () => {
    const formData = new FormData();

    if (MAX_FILES_PER_BATCH < files.length) {
      setMessage('Files uploaded max is 1500');
      return;
    }
    files.forEach(({ file }) => {
      formData.append('files', file);
    });
    formData.append("emailAddresses", deliveryMethod === 'link' ? '' : emailAddresses.join(','));

    try {
      setDisabled(true);
      const response = await axios.post('http://localhost:3000/api/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      setMessage('Files uploaded successfully');
      setUploadDirUrlMessage(response.data.uploadDirUrl);

      setDisabled(false);
    } catch (error) {
      setDisabled(false);
      console.error('Error uploading files:', error);
      setMessage('Error uploading files');
    }
  };

  const onFileUpload = async () => {
    setMessage('');
    setUploadProgress(0);
    setUploadDir(null);
    setCurrentBatch(0);
    if (activeTab === 'directory') {
      const totalBatches = Math.ceil(files.length / MAX_FILES_PER_BATCH);
      setTotalBatches(totalBatches);
      setCurrentBatch(1); // Initialize batch processing
    } else {
      await uploadFilesOnly();
      resetUploadState(); // Reset state after successful upload
    }
  };

  useEffect(() => {
    const handleUpload = async () => {
      if (activeTab === 'directory' && currentBatch > 0 && currentBatch <= totalBatches) {
        const start = (currentBatch - 1) * MAX_FILES_PER_BATCH;
        const end = start + MAX_FILES_PER_BATCH;
        const batch = files.slice(start, end);

        try {
          const uploadDirUrl = await uploadBatch(batch, currentBatch, totalBatches);
          if (currentBatch === 1) {
            const parts = uploadDirUrl.split('/');
            setUploadDir(parts[parts.length - 1]);
          }
          setCurrentBatch(currentBatch + 1);
        } catch (error) {
          console.log(error);
          setMessage('Error uploading files');
          setUploadProgress(0);
          setDisabled(false);
          return;
        }
      } else if (currentBatch > totalBatches && emailAddresses.length > 0) {
        setMessage('Files uploaded successfully');
        setDisabled(false);
        setUploadProgress(0);
        resetUploadState(); // Reset state after successful upload

        // Call complete-upload to send email
        await axios.post('http://localhost:3000/api/upload/complete-upload', {
          uploadDir,
          emailAddresses: deliveryMethod === 'email' ? emailAddresses.join(',') : null
        });
      }
    };

    handleUpload();
  }, [currentBatch, totalBatches, files, activeTab]);

  const removeEmail = (index: number) => {
    setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
  };

  const handleDeliveryMethodChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDeliveryMethod(e.target.value as 'email' | 'link');
  };

  const resetUploadState = () => {
    setFiles([]);
    setEmailAddresses([]);
    setUploadDir(null);
    setUploadProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);
  };

  return (
    <div className="app">
      <div className='container-wrapper'>

        <div className={`upload-container ${activeSettings ? 'active' : ''}`}>
          <div className="tab-container">
            <div className='tab-buttons'>
              <button
                disabled={disabled}
                className={`tab ${activeTab === 'directory' ? 'active' : ''}`}
                onClick={() => setActiveTab('directory')}
              >
                Directory
              </button>
              <button
                disabled={disabled}
                className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
            </div>

            <div onClick={() => setActiveSettings(!activeSettings)} className="settings-icon">&#9881;</div>
          </div>
          <div className="upload-area" onClick={() => document.getElementById('file-input')?.click()}>
            <input
              id="file-input"
              key={activeTab}
              type="file"
              multiple
              // @ts-ignore
              webkitdirectory={activeTab === 'directory' ? 'true' : undefined}
              onChange={onFileChange}
              className="file-input"
            />
            <div className="upload-placeholder">
              Click to browse or drag and drop your files
            </div>
          </div>
          {deliveryMethod === 'email' && (
            <>
              <div className='tab-container'>
                <input
                  type="text"
                  placeholder="Enter email addresses"
                  value={emailInput}
                  onChange={onEmailChange}
                  onKeyPress={handleEmailKeyPress}
                  onBlur={handleEmailBlur}
                  className="email-input"
                  style={{ margin: 0 }}
                />
              </div>
              {
                emailAddresses.length > 0 && (
                  <div className='email-container'>
                    {emailAddresses.map((email, index) => (
                      <div className='email' key={index}>
                        <span>{email}</span> &nbsp;
                        <span className='remove-email' onClick={() => removeEmail(index)}>x</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {files.length > 0 && (
            <div>{`Selected ${files.length} file${files.length > 1 ? 's' : ''}`}</div>
          )}
          <button
            disabled={disabled}
            onClick={onFileUpload} className="upload-button">
            Transférer
          </button>
          {uploadProgress > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}
          <p className="message">{message}</p>
          {deliveryMethod === 'link' && uploadDirUrlMessage && (
            <div className="upload-result" onClick={handleCopyLink}>
              <span>Copy the link:</span>
              <span>
                {uploadDirUrlMessage}
              </span>
              <span className="tooltip">{tooltipMessage}</span>
            </div>
          )}
        </div>
        <div className={`setting-container ${activeSettings ? 'active' : ''}`}>
          <div className="settings-panel">
            <div>
              <label style={{ width: "150px" }}>
                <input type="radio" name="setting" value="email" checked={deliveryMethod === 'email'} onChange={handleDeliveryMethodChange} />
                Par email
              </label>
            </div>
            <div>
              <label style={{ width: "150px" }}>
                <input type="radio" name="setting" value="link" checked={deliveryMethod === 'link'} onChange={handleDeliveryMethodChange} />
                Par lien à copier
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
