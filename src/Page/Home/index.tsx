import React, { useState, useEffect, ChangeEvent, KeyboardEvent, FocusEvent, useCallback, useRef } from 'react';
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
  const [uploadStart, setUploadStart] = useState(false);
  const [successfulUpload, setSuccessfulUpload] = useState(false);
  const [loading, setLoading] = useState(false);

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


  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage('');
    setSuccessfulUpload(false);
    setEmailInput(e.target.value);
  };

  const addEmail = () => {
    if (validateEmail(emailInput)) {
      setEmailAddresses([...emailAddresses, emailInput]);
      setEmailInput('');
    } else {
      setSuccessfulUpload(false);
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

  const uploadBatch = useCallback(async (batch: { file: File; relativePath: string }[], batchIndex: number, totalBatches: number) => {
    const formData = new FormData();
    const paths = batch.map(({ relativePath }) => relativePath).join(',');

    batch.forEach(({ file }) => {
      formData.append('files', file);
    });
    formData.append('paths', paths);
    formData.append('emailAddresses', deliveryMethod === 'link' ? '' : emailAddresses.join(','));

    if (uploadDir) {
      formData.append('uploadDir', uploadDir);
    }

    try {
      setDisabled(true);
      setLoading(true); // Enable loading
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(((batchIndex - 1 + (percentCompleted / 100)) / totalBatches) * 100);
          }
        },
      });

      setUploadDirUrlMessage(response.data.uploadDirUrl);
      setLoading(false); // Disable loading after processing
      return response.data.uploadDirUrl;
    } catch (error) {
      console.error('Error uploading files:', error);
      setLoading(false); // Disable loading after processing
      throw error;
    }
  }, [deliveryMethod, emailAddresses, uploadDir]);


  const uploadFilesOnly = async () => {
    const formData = new FormData();

    if (MAX_FILES_PER_BATCH < files.length) {
      setSuccessfulUpload(false);
      setMessage('Files uploaded max is 1500');
      return;
    }
    files.forEach(({ file }) => {
      formData.append('files', file);
    });
    formData.append('emailAddresses', deliveryMethod === 'link' ? '' : emailAddresses.join(','));

    try {
      setDisabled(true);
      setLoading(true); // Enable loading
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });


      setSuccessfulUpload(true);
      setMessage('Files uploaded successfully');
      setUploadDirUrlMessage(response.data.uploadDirUrl);

      const parts = response.data.uploadDirUrl.split('/');
      if (deliveryMethod === 'email') {
        console.log(uploadDir);
        await axios.post(`${process.env.REACT_APP_API_URL}/api/upload/complete-upload`, {
          uploadDir: parts[parts.length - 1],
          emailAddresses: emailAddresses.join(','),
        });
      }

      setDisabled(false);
      setLoading(false);
    } catch (error) {
      setDisabled(false);
      setLoading(false);
      console.error('Error uploading files:', error);
      setSuccessfulUpload(false);
      setMessage('Error uploading files');
    }
  };

  const onFileUpload = async () => {
    setMessage('');
    setUploadStart(true);
    setSuccessfulUpload(true);
    setUploadProgress(0);
    setUploadDir(null);
    setCurrentBatch(0);

    if (files.length === 0) {
      setMessage('Please add at least one file or directory');
      setSuccessfulUpload(false);
      return;
    }

    if (deliveryMethod === 'email' && emailAddresses.length === 0) {
      setMessage('Please add at least one email address');
      setSuccessfulUpload(false);
      return;
    }
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
      if (activeTab === 'directory' && currentBatch > 0 && currentBatch <= totalBatches && uploadStart) {
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
          console.error(error);
          setSuccessfulUpload(false);
          setMessage('Error uploading files');
          setUploadProgress(0);
          setDisabled(false);
          return;
        }
      } else if (currentBatch > totalBatches) {
        setSuccessfulUpload(true);
        setMessage(`${activeTab} uploaded successfully & message success`);
        setDisabled(false);

        if (deliveryMethod === 'email') {
          console.log(uploadDir);

          await axios.post(`${process.env.REACT_APP_API_URL}/api/upload/complete-upload`, {
            uploadDir,
            emailAddresses: emailAddresses.join(','),
          });
        }

        resetUploadState(); // Reset state after successful upload
      }
    };

    handleUpload();
  }, [currentBatch, totalBatches, files, activeTab, uploadStart, emailAddresses, deliveryMethod, uploadDir, uploadBatch]);


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
    setUploadStart(false);
  };

  const handleChangeDirectoryOrFiles = (type: 'directory' | 'files') => {
    setActiveTab(type)
    if (!uploadStart) {
      setFiles([]);
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFocusBack = () => {
    setTimeout(() => {
      console.log('focus-back');
      console.log(fileInputRef.current?.files?.length);

      if (fileInputRef.current?.files?.length === 0) {
        setLoading(false);
      }
      window.removeEventListener('focus', handleFocusBack);
    }, 5000);
  };

  const clickedFileInput = () => {
    setLoading(true);
    window.addEventListener('focus', handleFocusBack);
  };

  const fileInputClicked = (event: ChangeEvent<HTMLInputElement>) => {
    console.log('file-input-clicked');
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileList = Array.from(selectedFiles).map((file: File) => ({
        file,
        relativePath: (file as any).webkitRelativePath,
      }));
      setFiles(fileList);
      setDisabled(false);
      setLoading(false);  // Set loading to false after files are set
      console.log("File is Selected", selectedFiles[0]);
    } else {
      setLoading(false);  // Set loading to false if no files are selected
    }
    window.removeEventListener('focus', handleFocusBack);
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
                onClick={() => handleChangeDirectoryOrFiles('directory')}
              >
                Directory
              </button>
              <button
                disabled={disabled}
                className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => handleChangeDirectoryOrFiles('files')}
              >
                Files
              </button>
            </div>

            <div onClick={() => setActiveSettings(!activeSettings)} className="settings-icon">&#9881;</div>
          </div>
          <div className="upload-area" onClick={() => document.getElementById('file-input')?.click()}>
            {/* <input
              id="file-input"
              key={activeTab}
              type="file"
              multiple
              // @ts-ignore
              webkitdirectory={activeTab === 'directory' ? 'true' : undefined}
              onChange={onFileChange}

              onClick={onFileInputClick}
              disabled={disabled}
              className="file-input"
            /> */}
            <input
              id="file-input"
              key={activeTab}
              type="file"
              multiple
              ref={fileInputRef}
              // @ts-ignore
              webkitdirectory={activeTab === 'directory' ? 'true' : undefined}
              onChange={fileInputClicked}
              onClick={clickedFileInput}
              disabled={disabled}
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
              {emailAddresses.length > 0 && (
                <div className='email-container'>
                  {emailAddresses.map((email, index) => (
                    <div className='email' key={index}>
                      <span>{email}</span> &nbsp;
                      <span className='remove-email' onClick={() => removeEmail(index)}>x</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {loading && (
            <div className="loading-spinner">
              {/* Your spinner component or HTML here */}
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}
          {files.length > 0 && (
            <div style={{ width: '100%' }}>{`Selected ${files.length} file${files.length > 1 ? 's' : ''}`}</div>
          )}
          <button
            disabled={disabled}
            onClick={onFileUpload} className="upload-button"
          >
            Transférer
          </button>
          {uploadProgress > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}
          {message && <p className={successfulUpload ? `message-success` : `message-error`}>{message}</p>}
          {deliveryMethod === 'link' && uploadDirUrlMessage && successfulUpload && message !== '' && (
            <div className="upload-result" onClick={handleCopyLink}>
              <span>Copy the link:</span>
              <span>{uploadDirUrlMessage}</span>
              <span className="tooltip">{tooltipMessage}</span>
            </div>
          )}
        </div>
        <div className={`setting-container ${activeSettings ? 'active' : ''}`}>
          <div className="settings-panel">
            <div style={{minWidth : '250px'}}>
              <label style={{ width: '150px' }}>
                <input type="radio" name="setting" value="email" checked={deliveryMethod === 'email'} onChange={handleDeliveryMethodChange} />
                Par email
              </label>
            </div>
            <div style={{minWidth : '250px'}}>
              <label style={{ width: '150px' }}>
                <input type="radio" name="setting" value="link" checked={deliveryMethod === 'link'} onChange={handleDeliveryMethodChange} />
                Par lien à copier
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
