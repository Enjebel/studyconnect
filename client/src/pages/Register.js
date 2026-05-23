import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { registerLocalUser } from '../authStorage';
import './Auth.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let data;
            try {
                const response = await API.post('/users/register', { username, email, password });
                data = response.data;
            } catch (apiError) {
                const status = apiError.response?.status;
                if (status === 400) {
                    throw new Error(apiError.response?.data?.message || 'User exists');
                }
                console.warn('Backend registration unavailable, using local registration fallback.', apiError.message);
                data = registerLocalUser({ username, email, password });
            }
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                {error && <div className="error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
