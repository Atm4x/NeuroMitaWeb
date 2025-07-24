import React from 'react';
import { downloadableFiles } from '../api/filesData';
import DownloadIcon from '../components/icons/DownloadIcon';
import '../styles/DownloadsPage.css';

const DownloadsPage = () => {
  return (
    <div className="page-container downloads-page">
      <div className="container">
        <h1 className="page-title">Файлы для скачивания</h1>
        <p className="page-subtitle">Здесь вы можете найти полезные ресурсы и файлы для работы с Neuromita.</p>
        <div className="downloads-grid">
          {downloadableFiles.map((file, index) => (
            <div key={index} className="download-card">
              <div className="download-card-header">
                <h3 className="download-card-title">{file.name}</h3>
              </div>
              <p className="download-card-description">{file.description}</p>
              <div className="download-card-footer">
                <a href={file.path} download className="btn btn-primary">
                  <DownloadIcon />
                  <span>Скачать</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;