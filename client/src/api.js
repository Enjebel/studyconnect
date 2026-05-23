import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
