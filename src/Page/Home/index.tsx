import React, { useState, useEffect, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import axios from 'axios';
import './Home.css';

const MAX_FILES_PER_BATCH = 1500;  // Ajustez ce nombre en fonction de vos besoins

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
  const [deisabled, setDeisabled] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDeisabled(true);
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
      setDeisabled(false);
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
    formData.append('emailAddresses', emailAddresses.join(','));

    if (uploadDir) {
      formData.append('uploadDir', uploadDir);
    }

    try {
      setDeisabled(true);
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
    formData.append('emailAddresses', emailAddresses.join(','));

    try {
      setDeisabled(true);
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
      setDeisabled(false);
    } catch (error) {
      setDeisabled(false);
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
    } else {
      await uploadFilesOnly();
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
          setDeisabled(false);
          return;
        }
      } else if (currentBatch > totalBatches) {
        setMessage('Files uploaded successfully');
        setDeisabled(false);
        setUploadProgress(0);
      }
    };

    handleUpload();
  }, [currentBatch, totalBatches, files, activeTab]);

  useEffect(() => {
    if (totalBatches > 0 && currentBatch === 0 && activeTab === 'directory') {
      setCurrentBatch(1);
    }
  }, [totalBatches, activeTab]);

  const removeEmail = (index: number) => {
    setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <div className="upload-container">
        <div className="tab-container">
          <div className='tab-buttons'>
            <button
              disabled={deisabled}
              className={`tab ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              Directory
            </button>
            <button
              disabled={deisabled}
              className={`tab ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              Files
            </button>
          </div>

          <div className="settings-icon">&#9881;</div>
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

        {files.length > 0 && (
          <div>{`Selected ${files.length} file${files.length > 1 ? 's' : ''}`}</div>
        )}
        <button
          disabled={deisabled}
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
      </div>
    </div>
  );
}

export default Home;
