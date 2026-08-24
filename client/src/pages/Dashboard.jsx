import React, { useEffect, useState } from 'react';
import api from '../api/api';
import CandidateCard from '../components/CandidateCard';

const Dashboard = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/candidates');
            setCandidates(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to fetch candidates.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const handleDelete = (id) => {
        setCandidates(candidates.filter(c => c.id !== id));
    };

    if (loading && candidates.length === 0) return <div className="loading-state">Loading results...</div>;
    if (error) return <div className="error-alert">{error}</div>;

    return (
        <div className="page-container dashboard-page">
            <div className="dashboard-header">
                <div><div className="eyebrow"><span className="eyebrow-dot"></span> Screening overview</div><h2>Your shortlist</h2><p>Ranked by experience, skills, and role fit.</p></div>
                <button className="refresh-btn" onClick={fetchCandidates}><span>↻</span> Refresh results</button>
            </div>
            <div className="stats-row"><div className="stat-card"><span className="stat-label">Candidates screened</span><strong>{candidates.length}</strong><small>Across this workspace</small></div><div className="stat-card stat-green"><span className="stat-label">Strong matches</span><strong>{candidates.filter(c => Number(c.score) >= 8).length}</strong><small>Score of 8 or higher</small></div><div className="stat-card stat-amber"><span className="stat-label">Average fit score</span><strong>{candidates.length ? (candidates.reduce((total, c) => total + Number(c.score || 0), 0) / candidates.length).toFixed(1) : '0.0'}<small>/10</small></strong><small>Based on parsed profiles</small></div></div>
            
            {candidates.length === 0 ? (
                <div className="empty-state">
                    <p>No candidates yet. Add resumes to build your first shortlist.</p>
                </div>
            ) : (
                <div className="candidates-grid">
                    {candidates.map(candidate => (
                        <CandidateCard 
                            key={candidate.id} 
                            candidate={candidate} 
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
