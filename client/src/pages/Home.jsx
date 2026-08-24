import React from 'react';
import UploadForm from '../components/UploadForm';

const Home = () => {
    return (
        <div className="page-container home-page">
            <div className="hero-section">
                <div className="eyebrow"><span className="eyebrow-dot"></span> Your hiring co-pilot</div>
                <h2>Find the signal in<br /><em>every resume.</em></h2>
                <p>Turn a role brief and a stack of resumes into a thoughtful, explainable shortlist in minutes.</p>
            </div>
            <div className="workflow-note"><span>01</span> Define the role <b></b><span>02</span> Add resumes <b></b><span>03</span> Review your shortlist</div>
            <UploadForm />
        </div>
    );
};

export default Home;
