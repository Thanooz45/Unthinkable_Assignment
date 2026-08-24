import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

export default function ResultsPage() {
    const [candidates, setCandidates] = useState([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [active, setActive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const refresh = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/candidates');
            const screened = data.filter(candidate => candidate.job_description);
            setCandidates(screened);
            setActive(current => screened.find(candidate => candidate.id === current?.id) || screened[0] || null);
            setError('');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not load screening results.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    const removeCandidate = async candidate => {
        if (!window.confirm(`Delete ${candidate.name}'s screening result?`)) return;
        try {
            await api.delete(`/candidates/${candidate.id}`);
            setCandidates(current => current.filter(item => item.id !== candidate.id));
            setActive(current => current?.id === candidate.id ? null : current);
            setError('');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not delete this candidate.');
        }
    };

    const list = useMemo(() => candidates.filter(candidate => {
        const matchesFilter = filter === 'all'
            || (filter === 'strong' && candidate.score >= 8)
            || (filter === 'moderate' && candidate.score >= 5 && candidate.score < 8)
            || (filter === 'low' && candidate.score < 5);
        return matchesFilter && candidate.name.toLowerCase().includes(query.toLowerCase());
    }), [candidates, query, filter]);

    const exportCsv = () => {
        const rows = ['Name,Score,Skills,Summary', ...candidates.map(candidate =>
            `"${candidate.name}",${candidate.score},"${(candidate.skills || []).join('; ')}","${(candidate.summary || '').replaceAll('"', '""')}"`
        )];
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
        link.download = 'talentlens-results.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const count = predicate => candidates.filter(predicate).length;

    return <div className="workspace-page">
        <div className="results-head">
            <div><h1>Shortlisted Candidates &amp; Rankings</h1><p>Review semantic fit rankings, LLM match explanations, and export finalized hiring shortlists.</p></div>
            <div><button onClick={exportCsv} disabled={!candidates.length}>Export CSV</button><Link className="primary-link" to="/screen">New Screen</Link></div>
        </div>
        {error && <div className="error-alert">{error}</div>}
        <div className="stats-row">
            <div className="stat-card"><span>Total Screened</span><strong>{candidates.length}</strong></div>
            <div className="stat-card stat-green"><span>Strong Fits (8-10)</span><strong>{count(candidate => candidate.score >= 8)}</strong></div>
            <div className="stat-card stat-amber"><span>Moderate Fits (5-7)</span><strong>{count(candidate => candidate.score >= 5 && candidate.score < 8)}</strong></div>
            <div className="stat-card stat-low"><span>Low Match (&lt;5)</span><strong>{count(candidate => candidate.score < 5)}</strong></div>
        </div>
        <div className="results-grid">
            <section>
                <div className="result-controls"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search candidates by name..." />{['all', 'strong', 'moderate', 'low'].map(value => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'selected' : ''}>{value}</button>)}</div>
                {loading ? <p className="empty-state">Loading screening results...</p> : list.map((candidate, index) => <div className={`rank-row ${active?.id === candidate.id ? 'active' : ''}`} key={candidate.id} onClick={() => setActive(candidate)} role="button" tabIndex="0" onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setActive(candidate); }}>
                    <b>#{index + 1}</b><span><strong>{candidate.name}</strong><small>{candidate.justification || candidate.summary}</small></span><em>{candidate.score}/10</em><button className="rank-delete" onClick={event => { event.stopPropagation(); removeCandidate(candidate); }} aria-label={`Delete ${candidate.name}`}>Delete</button>
                </div>)}
            </section>
            <aside className="result-detail">{active ? <><span>AI EVALUATION DETAILS</span><h2>{active.name}</h2><div className="score-large">{active.score}<small>/10</small></div><hr /><h3>GEMINI LLM JUSTIFICATION</h3><p>{active.justification || 'This profile has not been screened yet.'}</p><h3>Candidate summary</h3><p>{active.summary || 'No summary available.'}</p><button className="detail-delete" onClick={() => removeCandidate(active)}>Delete candidate</button></> : <p>Select a candidate from the ranking list to view full AI justification details.</p>}</aside>
        </div>
    </div>;
}
