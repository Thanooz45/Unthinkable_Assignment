import React, { useState } from 'react';
import api from '../api/api';

const CandidateCard = ({ candidate, onDelete }) => {
    const [showContent, setShowContent] = useState(false);
    const [details, setDetails] = useState(candidate);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const handleDelete = async () => {
        try {
            await api.delete(`/candidates/${candidate.id}`);
            onDelete(candidate.id);
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const toggleContent = async () => {
        if (!showContent && !details.raw_text) {
            setLoadingDetails(true);
            try { setDetails((await api.get(`/candidates/${candidate.id}`)).data); } catch (err) { console.error('Failed to load parsed resume', err); } finally { setLoadingDetails(false); }
        }
        setShowContent(!showContent);
    };

    return (
        <div className="candidate-card">
            <div className="card-header">
                <div className="candidate-identity"><div className="candidate-avatar">{candidate.name?.split(' ').map(part => part[0]).join('').slice(0, 2)}</div><div><h3>{candidate.name}</h3><span>{candidate.original_filename}</span></div></div>
                <div className="score-badge">
                    <strong>{candidate.score}</strong><span>/10 fit</span>
                </div>
            </div>
            
            <div className="card-body">
                <div className="meta-info">
                    {candidate.email && <p><span>Email</span><strong>{candidate.email}</strong></p>}
                    {candidate.phone && <p><span>Phone</span><strong>{candidate.phone}</strong></p>}
                    <p><span>Experience</span><strong>{candidate.experience_years} years</strong></p>
                    <p><span>Education</span><strong>{candidate.education}</strong></p>
                </div>
                
                <div className="skills-section">
                    <strong>Key skills</strong>
                    <div className="skills-list">
                        {candidate.skills && candidate.skills.map((skill, i) => (
                            <span key={i} className="skill-tag">{skill}</span>
                        ))}
                    </div>
                </div>

                {candidate.summary && <div className="summary-section"><strong>Candidate summary</strong><p>{candidate.summary}</p></div>}

                <div className="justification-section">
                    <strong>Why this match</strong>
                    <p>{candidate.justification}</p>
                </div>
            </div>

            <div className="card-footer">
                <button className="view-resume-btn" onClick={toggleContent}>{loadingDetails ? 'Loading…' : showContent ? 'Hide parsed resume' : 'View parsed resume'}</button>
                <button className="delete-btn" onClick={handleDelete}>Remove profile</button>
            </div>
            {showContent && <div className="parsed-resume"><div className="parsed-resume-heading"><strong>Extracted resume content</strong><span>Source: {candidate.original_filename}</span></div><pre>{details.raw_text || 'No readable text was extracted from this file.'}</pre></div>}
        </div>
    );
};

export default CandidateCard;
