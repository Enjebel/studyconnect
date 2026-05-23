const USERS_KEY = 'studyconnectLocalUsers';

export const getLocalUsers = () => {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (error) {
        return [];
    }
};

export const registerLocalUser = ({ username, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getLocalUsers();
    const existing = users.find(user => user.email === normalizedEmail);

    if (existing) {
        throw new Error('User exists');
    }

    const user = {
        _id: `local-user-${Date.now()}`,
        username: username.trim(),
        email: normalizedEmail,
        password,
        bio: '',
        profilePic: '',
        token: `local-token-${Date.now()}`
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    const { password: _password, ...safeUser } = user;
    return safeUser;
};

export const loginLocalUser = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = getLocalUsers().find(item => item.email === normalizedEmail && item.password === password);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const { password: _password, ...safeUser } = user;
    return safeUser;
};

export const searchLocalUsers = ({ search = '', currentUserId }) => {
    const term = search.trim().toLowerCase();
    return getLocalUsers()
        .filter(user => user._id !== currentUserId)
        .filter(user => !term || user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
        .map(({ password: _password, ...safeUser }) => safeUser);
};
