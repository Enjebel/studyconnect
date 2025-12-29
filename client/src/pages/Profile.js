import React, { useState } from 'react';
import API from '../api';
import './Profile.css';
import { User, Mail, Camera, Save, Edit2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(user?.bio || "");
    const [message, setMessage] = useState("");

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.put(`/users/profile`, { 
                userId: user._id, 
                bio 
            });
            
            // Sync the updated info to LocalStorage
            const updatedUser = { ...user, bio: data.bio };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            setMessage("Profile updated successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error(err);
            setMessage("Error updating profile.");
        }
    };

    if (!user) {
        return <div className="profile-page">Please log in to view profile.</div>;
    }

    return (
        <div className="profile-page">
            <button className="back-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={20} /> Back to Chat
            </button>
            
            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar-large">
                        {user.username.charAt(0).toUpperCase()}
                        <div className="camera-badge"><Camera size={16} /></div>
                    </div>
                    <h2>{user.username}</h2>
                    <p>StudyConnect Member</p>
                </div>

                <div className="profile-body">
                    {message && <div className="status-msg">{message}</div>}
                    
                    <div className="info-group">
                        <label><Mail size={18} /> Email Address</label>
                        <div className="read-only-box">{user.email}</div>
                    </div>

                    <div className="info-group">
                        <label><User size={18} /> Bio / Study Interests</label>
                        {isEditing ? (
                            <textarea 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                placeholder="What are you currently studying?"
                            />
                        ) : (
                            <div className="bio-box">{user.bio || "No bio added yet..."}</div>
                        )}
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <button className="save-btn" onClick={handleUpdate}>
                                <Save size={18} /> Save Changes
                            </button>
                        ) : (
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                <Edit2 size={18} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;