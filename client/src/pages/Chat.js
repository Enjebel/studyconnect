import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import API from '../api';
import './Chat.css';
import { Send, Paperclip, MoreVertical, Search } from 'lucide-react'; 


const Chat = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('userInfo')));
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const navigate = useNavigate();
    const scrollRef = useRef();

    // 1. Initialize Socket and Fetch Initial Conversations
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

        return () => {
            if (socket) socket.disconnect();
        };
    }, [user, navigate]);

    // 2. Handle Real-Time Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (incomingMsg) => {
            // Logic: If current chat is open, add message to screen
            if (selectedChat && selectedChat._id === incomingMsg.conversationId) {
                setChatMessages((prev) => [...prev, incomingMsg]);
            }

            // Logic: Update Sidebar (Move chat to top and update last message)
            setConversations((prev) => {
                const otherChats = prev.filter(c => c._id !== incomingMsg.conversationId);
                const chatToUpdate = prev.find(c => c._id === incomingMsg.conversationId);
                
                if (chatToUpdate) {
                    const updated = { ...chatToUpdate, lastMessage: incomingMsg };
                    return [updated, ...otherChats];
                }
                return prev;
            });
        });

        return () => socket.off('new_message');
    }, [selectedChat]);

    // 3. Scroll to bottom when messages change
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // 4. Live Search for Users
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.length > 1) {
                try {
                    const { data } = await API.get(`/search?query=${searchQuery}`);
                    setSearchResults(data.users);
                } catch (err) { console.error(err); }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    // 5. Action: Start or Open a Chat
    const startChat = async (recipientId) => {
        try {
            const { data } = await API.post('/messages/conversation', { recipientId });
            setSelectedChat(data);
            setSearchQuery("");
            setSearchResults([]);
            
            // Refresh conversations list to include this new one if it's new
            const res = await API.get('/messages/conversations');
            setConversations(res.data);

            // Fetch messages for this specific chat
            const msgRes = await API.get(`/messages/${data._id}`);
            setChatMessages(msgRes.data);
        } catch (err) { console.error(err); }
    };

    // 6. Action: Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message || !selectedChat) return;

        const msgData = { conversationId: selectedChat._id, text: message };
        
        try {
            const { data } = await API.post('/messages/send', msgData);
            socket.emit('send_message', data);
            setChatMessages((prev) => [...prev, data]);
            setMessage("");

            // Update sidebar locally so it jumps to top
            setConversations((prev) => {
                const otherChats = prev.filter(c => c._id !== selectedChat._id);
                return [{ ...selectedChat, lastMessage: data }, ...otherChats];
            });
        } catch (err) { console.error(err); }
    };

    // Helper: Determine Chat Name
    const getChatName = (chat) => {
        if (chat.isGroup) return chat.name;
        const otherParticipant = chat.participants?.find(p => p._id !== user._id);
        return otherParticipant ? otherParticipant.username : "Study Mate";
    };

    return (
        <div className="chat-container">
            {/* Sidebar Section */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar-small">{user?.username.charAt(0).toUpperCase()}</div>
                        <span>{user?.username}</span>
                    </div>
                    <MoreVertical size={20} className="icon-btn" />
                </div>

                <div className="search-container">
                    <div className="search-bar">
                        <Search size={18} color="#888" />
                        <input 
                            type="text" 
                            placeholder="Search students or groups..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
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
                             onClick={async () => {
                                 setSelectedChat(chat);
                                 const { data } = await API.get(`/messages/${chat._id}`);
                                 setChatMessages(data);
                             }}>
                            <div className="avatar-medium">{getChatName(chat).charAt(0)}</div>
                            <div className="chat-info">
                                <strong>{getChatName(chat)}</strong>
                                <p>{chat.lastMessage?.text || "No messages yet"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Section */}
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
                                    <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                        <form className="input-area" onSubmit={handleSendMessage}>
                            <Paperclip size={22} className="icon-btn" />
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
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
                        <div className="welcome-content">
                            <h1>StudyConnect</h1>
                            <p>Select a classmate to start collaborating in real-time.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;