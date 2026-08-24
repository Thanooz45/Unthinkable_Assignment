import React, { useState, useCallback } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const UploadForm = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            file => ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        );
        setFiles(prev => [...prev, ...droppedFiles]);
    }, []);

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jobDescription) {
            setError("Job description is required.");
            return;
        }
        if (files.length === 0) {
            setError("At least one resume file is required.");
            return;
        }

        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('jobDescription', jobDescription);
        files.forEach(file => {
            formData.append('resumes', file);
        });

        try {
            const { data } = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            const failed = (data.results || []).filter(result => result.status === 'failed');
            if (failed.length === (data.results || []).length) {
                setError(failed.map(result => `${result.original_filename}: ${result.error}`).join(' '));
                return;
            }
            if (failed.length) {
                setError(`Some resumes could not be parsed: ${failed.map(result => `${result.original_filename}: ${result.error}`).join(' ')}`);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || err.message || "An error occurred during upload.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="upload-form" onSubmit={handleSubmit}>
            {error && <div className="error-alert">{error}</div>}
            
            <div className="form-intro"><div><span className="section-number">01</span><div><h3>Start with the role</h3><p>Give TalentLens the context it needs to spot a meaningful match.</p></div></div><span className="character-count">{jobDescription.length} / 5000</span></div>
            <div className="form-group">
                <label htmlFor="job-description">Role brief</label>
                <textarea 
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the responsibilities, must-have skills, and experience for this role..."
                    rows={6}
                    required
                />
            </div>

            <div className="form-group">
                <div className="form-intro upload-intro"><div><span className="section-number">02</span><div><h3>Add your candidates</h3><p>PDF, DOCX, or TXT files, up to 20 resumes at a time.</p></div></div></div>
                <div 
                    className="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div className="upload-icon">+</div><strong>Drop resumes here</strong><p>or click to browse your files</p>
                    <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                </div>
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    <h4>Ready to screen <span>{files.length}</span></h4>
                    <ul>
                        {files.map((file, i) => (
                            <li key={i}>
                                <span>{file.name}</span>
                                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(i)}>×</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Reading your resumes...' : `Analyze ${files.length || ''} resume${files.length === 1 ? '' : 's'}`}
            </button>
        </form>
    );
};

export default UploadForm;
