import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { loginLocalUser } from '../authStorage';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let data;
            try {
                const response = await API.post('/users/login', { email, password });
                data = response.data;
            } catch (apiError) {
                console.warn('Backend login unavailable, using local login fallback.', apiError.message);
                data = loginLocalUser({ email, password });
            }
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">SC</div>
                <h2>Login to StudyConnect</h2>
                
                {error && <div className="error-msg">{error}</div>}
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                </form>

                <p className="auth-footer">
                    New student? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
