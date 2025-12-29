import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import API from '../api';
import './Chat.css';
import { Send, Paperclip, MoreVertical, Search } from 'lucide-react';

let socket;

const Chat = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('userInfo')));
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const navigate = useNavigate();
    const scrollRef = useRef();

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
                } catch (err) {
                    console.error("Error fetching conversations", err);
                }
            };
            fetchChats();
        }
        return () => { if (socket) socket.disconnect(); };
    }, [user, navigate]);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_message', (incomingMsg) => {
            if (selectedChat && selectedChat._id === incomingMsg.conversationId) {
                setChatMessages((prev) => [...prev, incomingMsg]);
            }
            setConversations((prev) => {
                const otherChats = prev.filter(c => c._id !== incomingMsg.conversationId);
                const chatToUpdate = prev.find(c => c._id === incomingMsg.conversationId);
                if (chatToUpdate) {
                    return [{ ...chatToUpdate, lastMessage: incomingMsg }, ...otherChats];
                }
                return prev;
            });
        });
        return () => socket.off('new_message');
    }, [selectedChat]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.length > 1) {
                try {
                    const { data } = await API.get(`/search?query=${searchQuery}`);
                    setSearchResults(data.users);
                } catch (err) { console.error(err); }
            } else { setSearchResults([]); }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const startChat = async (recipientId) => {
        try {
            const { data } = await API.post('/messages/conversation', { recipientId });
            setSelectedChat(data);
            setSearchQuery("");
            setSearchResults([]);
            const res = await API.get('/messages/conversations');
            setConversations(res.data);
            const msgRes = await API.get(`/messages/${data._id}`);
            setChatMessages(msgRes.data);
        } catch (err) { console.error(err); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message || !selectedChat) return;
        try {
            const { data } = await API.post('/messages/send', { conversationId: selectedChat._id, text: message });
            socket.emit('send_message', data);
            setChatMessages((prev) => [...prev, data]);
            setMessage("");
        } catch (err) { console.error(err); }
    };

    const getChatName = (chat) => {
        if (chat.isGroup) return chat.name;
        const otherParticipant = chat.participants?.find(p => p._id !== user._id);
        return otherParticipant ? otherParticipant.username : "User";
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">SC</div>
                        <span className="logo-text">StudyConnect</span>
                    </div>
                    <MoreVertical size={20} className="icon-btn" />
                </div>

                <div className="user-bar">
                    <div className="avatar-small">{user?.username?.charAt(0).toUpperCase()}</div>
                    <span>{user?.username}</span>
                </div>

                <div className="search-container">
                    <div className="search-bar">
                        <Search size={18} color="#888" />
                        <input 
                            type="text" 
                            placeholder="Search students..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="search-results-dropdown">
                            {searchResults.map(u => (
                                <div key={u._id} className="search-result-item" onClick={() => startChat(u._id)}>
                                    <span>{u.username}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chat-list">
                    {conversations.map((chat) => (
                        <div key={chat._id} className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`} onClick={() => setSelectedChat(chat)}>
                            <div className="avatar-medium">{getChatName(chat).charAt(0)}</div>
                            <div className="chat-info">
                                <strong>{getChatName(chat)}</strong>
                                <p>{chat.lastMessage?.text || "New conversation"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="main-chat">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <div className="avatar-small">{getChatName(selectedChat).charAt(0)}</div>
                            <h3>{getChatName(selectedChat)}</h3>
                        </div>
                        <div className="messages-area">
                            {chatMessages.map((m, i) => (
                                <div key={i} className={`message ${m.sender === user._id || m.sender._id === user._id ? 'sent' : 'received'}`}>
                                    {m.text}
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                        <form className="input-area" onSubmit={handleSendMessage}>
                            <input type="text" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            <button type="submit" className="send-btn"><Send size={22} /></button>
                        </form>
                    </>
                ) : (
                    <div className="welcome-screen">
                        <div className="welcome-content">
                            <div className="welcome-logo">SC</div>
                            <h1>Welcome to StudyConnect</h1>
                            <p>Select a classmate from the left to start collaborating.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;