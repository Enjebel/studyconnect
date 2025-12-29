import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import API from '../api';
import './Chat.css';
import { Send, Paperclip, MoreVertical, Search, User as UserIcon } from 'lucide-react';

let socket;

const Chat = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            socket = io('http://localhost:5000');
            socket.emit('user_online', user._id);

            const fetchChats = async () => {
                try {
                    const { data } = await API.get('/messages/conversations');
                    setConversations(data);
                } catch (err) { console.error(err); }
            };
            fetchChats();
        }
    }, [user, navigate]);

    // Live Search Function
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.length > 1) {
                const { data } = await API.get(`/search?query=${searchQuery}`);
                setSearchResults(data.users);
            } else {
                setSearchResults([]);
            }
        }, 300); // Wait for user to stop typing

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const startChat = async (recipientId) => {
        try {
            const { data } = await API.post('/messages/conversation', { recipientId });
            setSelectedChat(data);
            setSearchQuery(""); // Clear search
            setSearchResults([]);
            // Refresh conversation list
            const res = await API.get('/messages/conversations');
            setConversations(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message || !selectedChat) return;

        const msgData = { conversationId: selectedChat._id, text: message };
        const { data } = await API.post('/messages/send', msgData);
        socket.emit('send_message', data);
        setChatMessages(prev => [...prev, data]);
        setMessage("");
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar-small">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{user?.username}</span>
                    </div>
                    <MoreVertical size={20} className="icon-btn" />
                </div>

                <div className="search-container">
                    <div className="search-bar">
                        <Search size={18} color="#888" />
                        <input 
                            type="text" 
                            placeholder="Search or start new chat" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="search-results-dropdown">
                            {searchResults.map(u => (
                                <div key={u._id} className="search-result-item" onClick={() => startChat(u._id)}>
                                    <div className="avatar-small">{u.username.charAt(0)}</div>
                                    <span>{u.username}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chat-list">
                    {conversations.map((chat) => (
                        <div key={chat._id} 
                             className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`} 
                             onClick={() => setSelectedChat(chat)}>
                            <div className="avatar-medium">
                                {chat.isGroup ? "G" : "U"}
                            </div>
                            <div className="chat-info">
                                <strong>{chat.name || chat.participants.find(p => p._id !== user._id)?.username}</strong>
                                <p>{chat.lastMessage?.text || "Click to start chatting"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="main-chat">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <h3>{selectedChat.name || "Conversation"}</h3>
                        </div>
                        <div className="messages-area">
                            {chatMessages.map((m, i) => (
                                <div key={i} className={`message ${m.sender === user._id || m.sender._id === user._id ? 'sent' : 'received'}`}>
                                    {m.text}
                                    <span className="msg-time">12:00</span>
                                </div>
                            ))}
                        </div>
                        <form className="input-area" onSubmit={handleSendMessage}>
                            <Paperclip size={22} className="icon-btn" />
                            <input 
                                type="text" 
                                placeholder="Type a message" 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button type="submit" className="send-btn">
                                <Send size={22} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="welcome-screen">
                        <h1>StudyConnect</h1>
                        <p>Select a student to start studying together.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;