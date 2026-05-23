import axios from 'axios';

const getBaseURL = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocalhost ? 'http://localhost:5000/api' : '/api';
};

const API = axios.create({
    baseURL: getBaseURL(),
});

API.interceptors.request.use((req) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        try {
            const parsed = JSON.parse(userInfo);
            if (parsed.token) {
                req.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch (error) {
            localStorage.removeItem('userInfo');
        }
    }
    return req;
});

export default API;
