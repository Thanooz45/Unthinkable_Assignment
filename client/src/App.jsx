import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadPage from './pages/UploadPage';
import ScreenPage from './pages/ScreenPage';
import ResultsPage from './pages/ResultsPage';

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>;
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('talentlens_user') || '{}');
  const logout = () => { localStorage.removeItem('talentlens_token'); localStorage.removeItem('talentlens_user'); navigate('/login'); };
  return <header className="header"><div className="header-content">
    <Link className="brand" to="/"><BrandMark /><span><strong>Smart Resume <em>Screener</em></strong><small>AI evaluation engine</small></span></Link>
    <nav aria-label="Primary navigation"><Link className={location.pathname === '/' ? 'active' : ''} to="/">▧ Upload Resumes</Link><Link className={location.pathname === '/screen' ? 'active' : ''} to="/screen">✦ AI Screening</Link><Link className={location.pathname === '/results' ? 'active' : ''} to="/results">♙ Results &amp; Ranks</Link></nav>
    <div className="profile-chip"><span className="status-dot"></span><span className="profile-name">{user.name || 'Hiring workspace'}</span><span className="profile-avatar">{(user.name || 'HW').split(' ').map(part => part[0]).join('').slice(0, 2)}</span><button onClick={logout}>Log out</button></div>
  </div></header>;
}

function AppContent() {
  const location = useLocation();
  const protectedPage = page => localStorage.getItem('talentlens_token') ? page : <Navigate to="/login" replace />;
  return (
    <div className="app-container">
        {location.pathname !== '/login' && location.pathname !== '/register' && <Header />}
        <main className={location.pathname === '/login' || location.pathname === '/register' ? '' : 'main-content'}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={protectedPage(<UploadPage />)} />
            <Route path="/screen" element={protectedPage(<ScreenPage />)} />
            <Route path="/results" element={protectedPage(<ResultsPage />)} />
            <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
    </div>
  );
}

function App() { return <Router><AppContent /></Router>; }

export default App;
