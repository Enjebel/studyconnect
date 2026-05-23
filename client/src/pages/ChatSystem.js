import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  Archive,
  BarChart3,
  BellOff,
  Check,
  CheckCheck,
  Download,
  FileText,
  Mic,
  MicOff,
  MoreVertical,
  Paperclip,
  Phone,
  PhoneOff,
  Pin,
  Reply,
  Search,
  Send,
  Smile,
  Star,
  Trash2,
  UserPlus,
  Video,
  VideoOff,
  X
} from 'lucide-react';
import API from '../api';
import { searchLocalUsers } from '../authStorage';
import './Chat.css';

const defaultContacts = [
  { id: 'nyami', name: 'nyami lewis', subject: 'Physics partner', online: true, pinned: true, muted: false, archived: false, unread: 0 },
  { id: 'math-group', name: 'Advanced Mathematics', subject: 'Study group', online: false, pinned: false, muted: false, archived: false, unread: 2 },
  { id: 'lab-team', name: 'Lab Team', subject: 'Chemistry practicals', online: true, pinned: false, muted: true, archived: false, unread: 0 }
];

const getCurrentUser = () => JSON.parse(localStorage.getItem('userInfo') || '{}');
const getUserScopedKey = (key) => `${key}:${getCurrentUser()._id || 'guest'}`;
const getDirectRoomId = (firstId, secondId) => `dm-${[firstId, secondId].sort().join('__')}`;

const loadStoredMessages = () => {
  try {
    return JSON.parse(localStorage.getItem(getUserScopedKey('studyconnectMessages'))) || {};
  } catch (error) {
    return {};
  }
};

const loadStoredContacts = () => {
  try {
    return JSON.parse(localStorage.getItem(getUserScopedKey('studyconnectContacts'))) || defaultContacts;
  } catch (error) {
    return defaultContacts;
  }
};

const getInitials = (name) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
const emojiOptions = ['😀', '😂', '😊', '😍', '🙏', '👏', '🔥', '📚', '✅', '❤️', '👍', '🎧', '🧠', '💡', '✍️', '🎉'];
const reactionOptions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const ChatSystem = () => {
  const [contacts, setContacts] = useState(loadStoredContacts);
  const [messagesByContact, setMessagesByContact] = useState(loadStoredMessages);
  const [activeContactId, setActiveContactId] = useState(defaultContacts[0].id);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [chatFilter, setChatFilter] = useState('all');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [pollDraft, setPollDraft] = useState(null);
  const [recording, setRecording] = useState(false);
  const [callState, setCallState] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callError, setCallError] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const callStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const activeContactIdRef = useRef(activeContactId);
  const contactsRef = useRef(contacts);
  const currentUser = getCurrentUser();

  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  const activeContact = contacts.find(contact => contact.id === activeContactId) || contacts[0];
  const isDirectUserChat = activeContact?.id?.startsWith('dm-');
  const visibleMessages = (messagesByContact[activeContact.id] || []).filter(message => !message.deleted);
  const activeMessages = visibleMessages.filter(message => {
    const term = messageSearch.trim().toLowerCase();
    if (!term) return true;
    return [message.text, message.senderName, message.file?.name]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(term));
  });

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const scopedContacts = contacts.filter(contact => {
      if (chatFilter === 'unread') return contact.unread > 0 && !contact.archived;
      if (chatFilter === 'groups') return (contact.id.includes('group') || contact.name.toLowerCase().includes('team')) && !contact.archived;
      if (chatFilter === 'archived') return contact.archived;
      return !contact.archived;
    });
    const searched = term ? scopedContacts.filter(contact =>
      contact.name.toLowerCase().includes(term) ||
      contact.subject.toLowerCase().includes(term)
    ) : scopedContacts;
    return [...searched].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [chatFilter, contacts, searchTerm]);

  useEffect(() => {
    localStorage.setItem(getUserScopedKey('studyconnectMessages'), JSON.stringify(messagesByContact));
  }, [messagesByContact]);

  useEffect(() => {
    localStorage.setItem(getUserScopedKey('studyconnectContacts'), JSON.stringify(contacts));
    socketRef.current?.emit('chat:join', { roomIds: contacts.map(contact => contact.id) });
  }, [contacts]);

  useEffect(() => {
    socketRef.current = io((process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', ''), {
      transports: ['websocket', 'polling']
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    socketRef.current.on('connect', () => {
      socketRef.current.emit('chat:join', {
        roomIds: contactsRef.current.map(contact => contact.id),
        user: {
          id: userInfo._id || 'guest',
          username: userInfo.username || 'Guest'
        }
      });
    });

    socketRef.current.on('message:receive', ({ roomId, message }) => {
      setMessagesByContact(prev => {
        const exists = (prev[roomId] || []).some(item => (item.id || item._id) === (message.id || message._id));
        if (exists) return prev;
        return {
          ...prev,
          [roomId]: [...(prev[roomId] || []), { ...message, status: 'delivered' }]
        };
      });

      if (activeContactIdRef.current !== roomId) {
        const knownContact = contactsRef.current.find(contact => contact.id === roomId);
        if (!knownContact && message.senderId) {
          const newContact = {
            id: roomId,
            userId: message.senderId,
            name: message.senderName || 'New chat',
            subject: 'Direct message',
            online: false,
            pinned: false,
            muted: false,
            archived: false,
            unread: 0
          };
          contactsRef.current = [newContact, ...contactsRef.current];
          setContacts(prev => [newContact, ...prev]);
        }
        setContacts(prev => prev.map(contact =>
          contact.id === roomId ? { ...contact, unread: (contact.unread || 0) + 1 } : contact
        ));
      } else {
        socketRef.current.emit('message:read', { roomId });
      }
    });

    socketRef.current.on('message:read', ({ roomId }) => {
      setMessagesByContact(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).map(message =>
          message.sender === 'me' ? { ...message, status: 'read' } : message
        )
      }));
    });

    socketRef.current.on('call:incoming', ({ roomId, mode, caller }) => {
      setIncomingCall({ roomId, mode, caller });
      setShowChatOnMobile(true);
      const contactExists = contactsRef.current.some(contact => contact.id === roomId);
      if (contactExists) setActiveContactId(roomId);
    });

    socketRef.current.on('call:declined', () => {
      setCallError('Call declined.');
      peerRef.current?.close();
      peerRef.current = null;
      callStreamRef.current?.getTracks().forEach(track => track.stop());
      callStreamRef.current = null;
      remoteStreamRef.current?.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
      setCallState(null);
    });

    socketRef.current.on('call:user-joined', async () => {
      if (!peerRef.current || !callStreamRef.current) return;
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit('call:offer', { roomId: activeContactId, offer });
    });

    socketRef.current.on('call:offer', async ({ offer }) => {
      if (!callStreamRef.current) return;
      const peer = createPeer(activeContactId);
      peerRef.current = peer;
      callStreamRef.current.getTracks().forEach(track => peer.addTrack(track, callStreamRef.current));
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current.emit('call:answer', { roomId: activeContactId, answer });
    });

    socketRef.current.on('call:answer', async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState(prev => prev ? { ...prev, connected: true } : prev);
      }
    });

    socketRef.current.on('call:ice-candidate', async ({ candidate }) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on('call:end', () => {
      peerRef.current?.close();
      peerRef.current = null;
      callStreamRef.current?.getTracks().forEach(track => track.stop());
      callStreamRef.current = null;
      remoteStreamRef.current?.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
      setCallState(null);
    });

    return () => {
      peerRef.current?.close();
      peerRef.current = null;
      callStreamRef.current?.getTracks().forEach(track => track.stop());
      callStreamRef.current = null;
      remoteStreamRef.current?.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
      socketRef.current?.disconnect();
    };
  }, [activeContactId]);

  useEffect(() => {
    const syncMessages = async () => {
      setIsSyncing(true);
      try {
        const { data } = await API.get('/messages');
        if (!isDirectUserChat && Array.isArray(data) && data.length > 0) {
          setMessagesByContact(prev => ({
            ...prev,
            nyami: data.map(message => ({
              ...message,
              id: message._id || message.id,
              contactId: 'nyami',
              sender: message.senderName === 'You' ? 'me' : message.sender,
              time: message.time || new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: message.status || 'delivered'
            }))
          }));
        }
      } catch (error) {
        console.warn('Using local chat history because the API is unavailable.');
      } finally {
        setIsSyncing(false);
      }
    };

    syncMessages();
  }, [isDirectUserChat]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setUserResults([]);
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data } = await API.get('/users/search', {
          params: { search: term, currentUserId: userInfo._id }
        });
        const users = Array.isArray(data) ? data : [];
        const merged = [
          ...users,
          ...searchLocalUsers({ search: term, currentUserId: userInfo._id })
        ];
        const unique = Array.from(new Map(merged.map(user => [user._id || user.email, user])).values());
        setUserResults(unique.filter(user => String(user._id || user.email) !== String(userInfo._id || userInfo.email)));
      } catch (error) {
        setUserResults(searchLocalUsers({ search: term, currentUserId: userInfo._id }));
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeContactId, messagesByContact]);

  const selectContact = (contactId) => {
    setActiveContactId(contactId);
    setContacts(prev => prev.map(contact => contact.id === contactId ? { ...contact, unread: 0 } : contact));
    socketRef.current?.emit('message:read', { roomId: contactId });
    setMessageSearch('');
    setReplyTo(null);
    setShowChatOnMobile(true);
  };

  const appendMessage = (contactId, message) => {
    setMessagesByContact(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), message]
    }));
  };

  const updateContact = (contactId, patch) => {
    setContacts(prev => prev.map(contact => contact.id === contactId ? { ...contact, ...patch } : contact));
  };

  const updateMessage = (messageId, updater) => {
    setMessagesByContact(prev => ({
      ...prev,
      [activeContact.id]: (prev[activeContact.id] || []).map(message =>
        (message.id || message._id) === messageId ? updater(message) : message
      )
    }));
  };

  const reactToMessage = (messageId, emoji) => {
    updateMessage(messageId, message => ({ ...message, reaction: message.reaction === emoji ? '' : emoji }));
  };

  const toggleStarMessage = (messageId) => {
    updateMessage(messageId, message => ({ ...message, starred: !message.starred }));
  };

  const deleteMessage = (messageId) => {
    updateMessage(messageId, message => ({ ...message, deleted: true }));
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const optimisticMessage = {
      id: `local-${Date.now()}`,
      contactId: activeContact.id,
      sender: 'me',
      senderId: currentUser._id || currentUser.email || 'guest',
      senderName: 'You',
      text,
      replyTo,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    appendMessage(activeContact.id, optimisticMessage);
    socketRef.current?.emit('message:send', { roomId: activeContact.id, message: optimisticMessage });
    setInput('');
    setShowEmojiPicker(false);
    setReplyTo(null);

    try {
      const { data } = await API.post('/messages', {
        text,
        sender: userInfo._id || 'local-user',
        senderName: userInfo.username || 'You',
        contactId: activeContact.id,
        time: optimisticMessage.time
      });

      setMessagesByContact(prev => ({
        ...prev,
        [activeContact.id]: (prev[activeContact.id] || []).map(message =>
          message.id === optimisticMessage.id
            ? { ...optimisticMessage, id: data._id || data.id || optimisticMessage.id, status: data.status || 'delivered' }
            : message
        )
      }));
    } catch (error) {
      setMessagesByContact(prev => ({
        ...prev,
        [activeContact.id]: (prev[activeContact.id] || []).map(message =>
          message.id === optimisticMessage.id ? { ...message, status: 'delivered' } : message
        )
      }));
    }
  };

  const createPeer = (roomId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }

    peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remoteStreamRef.current.addTrack(track));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      setCallState(prev => prev ? { ...prev, connected: true } : prev);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('call:ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    return peer;
  };

  const sendMediaMessage = async ({ type, text, file }) => {
    const message = {
      id: `local-${Date.now()}`,
      contactId: activeContact.id,
      sender: 'me',
      senderId: currentUser._id || currentUser.email || 'guest',
      senderName: 'You',
      type,
      text,
      file,
      replyTo,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    };
    appendMessage(activeContact.id, message);
    socketRef.current?.emit('message:send', { roomId: activeContact.id, message });
    setReplyTo(null);

    try {
      await API.post('/messages', {
        text,
        sender: 'local-user',
        senderName: 'You',
        contactId: activeContact.id,
        time: message.time,
        messageType: type,
        fileName: file?.name
      });
    } catch (error) {
      // Local-first media messages remain usable even without the API.
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    await sendMediaMessage({
      type: file.type.startsWith('image/') ? 'image' : 'file',
      text: file.name,
      file: {
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        url: dataUrl
      }
    });
  };

  const createPoll = () => {
    const question = pollDraft?.question?.trim();
    const options = (pollDraft?.options || []).map(option => option.trim()).filter(Boolean);
    if (!question || options.length < 2) return;

    const pollMessage = {
      id: `poll-${Date.now()}`,
      contactId: activeContact.id,
      sender: 'me',
      senderId: currentUser._id || currentUser.email || 'guest',
      senderName: 'You',
      type: 'poll',
      text: question,
      options: options.map(option => ({ label: option, votes: 0, voted: false })),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    };
    appendMessage(activeContact.id, pollMessage);
    socketRef.current?.emit('message:send', { roomId: activeContact.id, message: pollMessage });
    setPollDraft(null);
    setShowAttachMenu(false);
  };

  const votePoll = (messageId, optionIndex) => {
    updateMessage(messageId, message => ({
      ...message,
      options: message.options.map((option, index) => (
        index === optionIndex
          ? { ...option, votes: option.voted ? Math.max(0, option.votes - 1) : option.votes + 1, voted: !option.voted }
          : option
      ))
    }));
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const url = await fileToDataUrl(blob);
        await sendMediaMessage({
          type: 'voice',
          text: 'Voice note',
          file: {
            name: `voice-note-${Date.now()}.webm`,
            size: blob.size,
            mimeType: 'audio/webm',
            url
          }
        });
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      setCallError('Microphone permission is required to record a voice note.');
    }
  };

  const startCall = async (mode) => {
    setCallError('');
    const roomId = activeContact.id;
    setCallState({ mode, muted: false, cameraOff: false, connected: false, startedAt: Date.now() });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
      callStreamRef.current = stream;
      const peer = createPeer(roomId);
      peerRef.current = peer;
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      socketRef.current?.emit('call:ring', {
        roomId,
        mode,
        caller: { id: userInfo._id || 'guest', username: userInfo.username || 'StudyConnect user' }
      });
      socketRef.current?.emit('call:join', { roomId, mode });
      if (mode === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      setCallError(mode === 'video' ? 'Camera and microphone permission are required for video calls.' : 'Microphone permission is required for calls.');
      setCallState(null);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    const { roomId, mode } = incomingCall;
    setActiveContactId(roomId);
    setIncomingCall(null);
    setCallError('');
    setCallState({ mode, muted: false, cameraOff: false, connected: false, startedAt: Date.now() });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
      callStreamRef.current = stream;
      const peer = createPeer(roomId);
      peerRef.current = peer;
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      socketRef.current?.emit('call:join', { roomId, mode });
      if (mode === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      setCallError(mode === 'video' ? 'Camera and microphone permission are required for video calls.' : 'Microphone permission is required for calls.');
      setCallState(null);
    }
  };

  const declineIncomingCall = () => {
    if (incomingCall) {
      socketRef.current?.emit('call:decline', { roomId: incomingCall.roomId });
    }
    setIncomingCall(null);
  };

  useEffect(() => {
    if (callState?.mode === 'video' && videoPreviewRef.current && callStreamRef.current) {
      videoPreviewRef.current.srcObject = callStreamRef.current;
    }
  }, [callState]);

  const endCall = (notify = true) => {
    if (notify && callState) {
      socketRef.current?.emit('call:end', { roomId: activeContact.id });
    }
    peerRef.current?.close();
    peerRef.current = null;
    callStreamRef.current?.getTracks().forEach(track => track.stop());
    callStreamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current = null;
    setCallState(null);
  };

  const toggleCallMute = () => {
    callStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setCallState(prev => prev ? { ...prev, muted: !prev.muted } : prev);
  };

  const toggleCamera = () => {
    callStreamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setCallState(prev => prev ? { ...prev, cameraOff: !prev.cameraOff } : prev);
  };

  const addContact = () => {
    const nextId = `study-buddy-${Date.now()}`;
    const newContact = {
      id: nextId,
      name: `Study Buddy ${contacts.length + 1}`,
      subject: 'New conversation',
      online: false
    };
    setContacts(prev => [newContact, ...prev]);
    setMessagesByContact(prev => ({ ...prev, [nextId]: [] }));
    selectContact(nextId);
  };

  const startChatWithUser = (user) => {
    const userId = user._id || user.email;
    const meId = currentUser._id || currentUser.email || 'guest';
    const contactId = getDirectRoomId(meId, userId);
    const existing = contacts.find(contact => contact.id === contactId || contact.userId === user._id);

    if (existing) {
      selectContact(existing.id);
      return;
    }

    const newContact = {
      id: contactId,
      userId,
      name: user.username || user.email,
      subject: user.email,
      online: false,
      pinned: false,
      muted: false,
      archived: false,
      unread: 0
    };

    setContacts(prev => [newContact, ...prev]);
    setMessagesByContact(prev => ({ ...prev, [contactId]: [] }));
    setSearchTerm('');
    setUserResults([]);
    selectContact(contactId);
  };

  const renderStatus = (message) => {
    if (message.sender !== 'me') return null;
    if (message.status === 'read') return <CheckCheck size={14} className="msg-read" />;
    if (message.status === 'delivered') return <CheckCheck size={14} />;
    return <Check size={14} />;
  };

  const renderMessageContent = (message) => {
    if (message.type === 'image') {
      return (
        <a className="image-message" href={message.file.url} download={message.file.name}>
          <img src={message.file.url} alt={message.file.name} />
          <span>{message.file.name}</span>
        </a>
      );
    }

    if (message.type === 'file') {
      return (
        <a className="file-message" href={message.file.url} download={message.file.name}>
          <FileText size={22} />
          <span>{message.file.name}</span>
          <Download size={18} />
        </a>
      );
    }

    if (message.type === 'voice') {
      return (
        <div className="voice-message">
          <Mic size={18} />
          <audio controls src={message.file.url} />
        </div>
      );
    }

    if (message.type === 'poll') {
      const totalVotes = message.options.reduce((sum, option) => sum + option.votes, 0);
      return (
        <div className="poll-message">
          <strong>{message.text}</strong>
          {message.options.map((option, index) => {
            const percent = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <button key={option.label} type="button" onClick={() => votePoll(message.id || message._id, index)}>
                <span>{option.label}</span>
                <small>{option.votes} votes</small>
                <i style={{ width: `${percent}%` }} />
              </button>
            );
          })}
        </div>
      );
    }

    return <span>{message.text}</span>;
  };

  return (
    <section className={`chat-layout ${showChatOnMobile ? 'mobile-chat-open' : ''}`}>
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div>
            <h2>Chats</h2>
            <span>{isSyncing ? 'syncing messages' : `${contacts.length} conversations`}</span>
          </div>
          <div className="chat-icon-group">
            <button className="icon-button" type="button" onClick={addContact} aria-label="Start chat">
              <UserPlus size={19} />
            </button>
            <button className="icon-button" type="button" aria-label="Chat menu">
              <MoreVertical size={19} />
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search chats or users" />
        </div>

        {searchTerm.trim().length >= 2 && (
          <div className="user-search-results">
            <div className="search-section-title">{searchingUsers ? 'Searching users...' : 'Users'}</div>
            {userResults.length === 0 && !searchingUsers && <p>No users found</p>}
            {userResults.map(user => (
              <button key={user._id || user.email} type="button" onClick={() => startChatWithUser(user)}>
                <div className="avatar">{getInitials(user.username || user.email)}</div>
                <div>
                  <strong>{user.username || user.email}</strong>
                  <span>{contacts.some(contact => contact.userId === (user._id || user.email)) ? 'Open existing chat' : user.email}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="chat-filters">
          {['all', 'unread', 'groups', 'archived'].map(filter => (
            <button key={filter} className={chatFilter === filter ? 'active' : ''} type="button" onClick={() => setChatFilter(filter)}>
              {filter}
            </button>
          ))}
        </div>

        <div className="contact-list">
          {filteredContacts.map(contact => {
            const lastMessage = (messagesByContact[contact.id] || []).slice(-1)[0];
            return (
              <div
                className={`contact-item ${activeContact.id === contact.id ? 'active' : ''}`}
                key={contact.id}
              >
                <button className="contact-main" type="button" onClick={() => selectContact(contact.id)}>
                  <div className="avatar">{getInitials(contact.name)}</div>
                  <div className="contact-copy">
                    <div className="contact-topline">
                      <strong>{contact.name}</strong>
                      <span>{lastMessage?.time || ''}</span>
                    </div>
                    <p>{lastMessage?.type === 'voice' ? 'Voice note' : lastMessage?.type === 'poll' ? 'Poll' : lastMessage?.text || contact.subject}</p>
                  </div>
                  <div className="contact-badges">
                    {contact.pinned && <Pin size={13} />}
                    {contact.muted && <BellOff size={13} />}
                    {contact.unread > 0 && <span>{contact.unread}</span>}
                  </div>
                </button>
                <div className="contact-actions">
                  <button type="button" onClick={() => updateContact(contact.id, { pinned: !contact.pinned })} aria-label="Pin chat"><Pin size={14} /></button>
                  <button type="button" onClick={() => updateContact(contact.id, { muted: !contact.muted })} aria-label="Mute chat"><BellOff size={14} /></button>
                  <button type="button" onClick={() => updateContact(contact.id, { archived: !contact.archived })} aria-label="Archive chat"><Archive size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="chat-window">
        <header className="chat-window-header">
          <button className="icon-button mobile-back" type="button" onClick={() => setShowChatOnMobile(false)} aria-label="Back to chats">
            <ArrowLeft size={20} />
          </button>
          <div className="avatar small">{getInitials(activeContact.name)}</div>
          <div className="chat-title">
            <h3>{activeContact.name}</h3>
            <span>{activeContact.muted ? 'muted - ' : ''}{activeContact.online ? 'online' : activeContact.subject}</span>
          </div>
          <div className="chat-actions">
            <label className="message-search">
              <Search size={16} />
              <input value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search" />
            </label>
            <button className="icon-button" type="button" onClick={() => startCall('video')} aria-label="Video call"><Video size={19} /></button>
            <button className="icon-button" type="button" onClick={() => startCall('audio')} aria-label="Voice call"><Phone size={19} /></button>
            <button className="icon-button" type="button" aria-label="Conversation menu"><MoreVertical size={19} /></button>
          </div>
        </header>

        <div className="message-area" ref={scrollRef}>
          <div className="system-bubble">Messages are saved locally and synced when the API is available.</div>
          {activeMessages.map(message => (
            <div className={`message-row ${message.sender === 'me' || message.senderName === 'You' ? 'sent' : 'received'}`} key={message.id || message._id}>
              <div className="message-bubble">
                {activeContact.id !== 'nyami' && message.sender !== 'me' && <span className="sender-name">{message.senderName}</span>}
                {message.replyTo && (
                  <button className="reply-preview" type="button">
                    <strong>{message.replyTo.senderName}</strong>
                    <span>{message.replyTo.text}</span>
                  </button>
                )}
                {renderMessageContent(message)}
                {message.reaction && <span className="message-reaction">{message.reaction}</span>}
                <span className="msg-time">{message.time} {renderStatus(message)}</span>
                <div className="message-tools">
                  <button type="button" onClick={() => setReplyTo({ id: message.id || message._id, senderName: message.senderName || 'Unknown', text: message.text || message.file?.name || message.type })} aria-label="Reply"><Reply size={14} /></button>
                  <button type="button" onClick={() => toggleStarMessage(message.id || message._id)} aria-label="Star"><Star size={14} fill={message.starred ? 'currentColor' : 'none'} /></button>
                  <button type="button" onClick={() => deleteMessage(message.id || message._id)} aria-label="Delete"><Trash2 size={14} /></button>
                  <div className="reaction-strip">
                    {reactionOptions.map(emoji => (
                      <button key={emoji} type="button" onClick={() => reactToMessage(message.id || message._id, emoji)}>{emoji}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="chat-footer">
          {replyTo && (
            <div className="composer-reply">
              <div>
                <strong>Replying to {replyTo.senderName}</strong>
                <span>{replyTo.text}</span>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={16} /></button>
            </div>
          )}
          {showEmojiPicker && (
            <div className="emoji-picker">
              {emojiOptions.map(emoji => (
                <button key={emoji} type="button" onClick={() => setInput(prev => `${prev}${emoji}`)}>{emoji}</button>
              ))}
            </div>
          )}
          <button className="icon-button" type="button" onClick={() => setShowEmojiPicker(prev => !prev)} aria-label="Emoji"><Smile size={21} /></button>
          {showAttachMenu && (
            <div className="attach-menu">
              <button type="button" onClick={() => fileInputRef.current?.click()}><FileText size={18} /> File or image</button>
              <button type="button" onClick={() => setPollDraft({ question: '', options: ['', ''] })}><BarChart3 size={18} /> Poll</button>
            </div>
          )}
          {pollDraft && (
            <div className="poll-composer">
              <div className="poll-composer-head">
                <strong>Create poll</strong>
                <button type="button" onClick={() => setPollDraft(null)} aria-label="Close poll"><X size={16} /></button>
              </div>
              <input value={pollDraft.question} onChange={(event) => setPollDraft({ ...pollDraft, question: event.target.value })} placeholder="Question" />
              {pollDraft.options.map((option, index) => (
                <input key={index} value={option} onChange={(event) => {
                  const options = [...pollDraft.options];
                  options[index] = event.target.value;
                  setPollDraft({ ...pollDraft, options });
                }} placeholder={`Option ${index + 1}`} />
              ))}
              <div className="poll-composer-actions">
                <button type="button" onClick={() => setPollDraft({ ...pollDraft, options: [...pollDraft.options, ''] })}>Add option</button>
                <button type="button" onClick={createPoll}>Send poll</button>
              </div>
            </div>
          )}
          <button className="icon-button" type="button" onClick={() => setShowAttachMenu(prev => !prev)} aria-label="Attach"><Paperclip size={21} /></button>
          <input ref={fileInputRef} className="hidden-file-input" type="file" onChange={handleFileSelected} />
          <form className="input-container" onSubmit={sendMessage}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a message" />
          </form>
          <button className={`icon-button record-button ${recording ? 'is-recording' : ''}`} type="button" onClick={toggleRecording} aria-label={recording ? 'Stop voice note' : 'Record voice note'}>
            {recording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button className="send-button" type="button" onClick={sendMessage} aria-label="Send message">
            <Send size={20} />
          </button>
        </footer>
      </main>

      {callError && (
        <div className="call-error">
          <span>{callError}</span>
          <button type="button" onClick={() => setCallError('')} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {incomingCall && (
        <div className="incoming-call">
          <div className="avatar">{getInitials(incomingCall.caller?.username || activeContact.name)}</div>
          <div>
            <strong>{incomingCall.caller?.username || activeContact.name}</strong>
            <span>Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} call</span>
          </div>
          <button className="accept-call" type="button" onClick={acceptIncomingCall} aria-label="Accept call"><Phone size={18} /></button>
          <button className="decline-call" type="button" onClick={declineIncomingCall} aria-label="Decline call"><PhoneOff size={18} /></button>
        </div>
      )}

      {callState && (
        <div className="call-overlay">
          <div className="call-card">
            <div className="call-main">
              <video className="remote-video" ref={remoteVideoRef} autoPlay playsInline />
              {!callState.connected && <div className="call-avatar">{getInitials(activeContact.name)}</div>}
              {callState.mode === 'video' && !callState.cameraOff && <video className="local-video" ref={videoPreviewRef} autoPlay muted playsInline />}
            </div>
            <div className="call-copy">
              <h2>{activeContact.name}</h2>
              <p>{callState.connected ? 'Connected' : 'Waiting for the other user to join this chat call'}</p>
              <span>StudyConnect calls use browser data/WebRTC. Carrier calls without data need a native mobile integration.</span>
            </div>
            <div className="call-controls">
              <button type="button" className={callState.muted ? 'active' : ''} onClick={toggleCallMute} aria-label="Toggle mute">
                {callState.muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              {callState.mode === 'video' && (
                <button type="button" className={callState.cameraOff ? 'active' : ''} onClick={toggleCamera} aria-label="Toggle camera">
                  {callState.cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}
              <button type="button" className="end-call" onClick={endCall} aria-label="End call">
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ChatSystem;
