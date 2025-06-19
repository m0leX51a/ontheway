// Helper function to get the authorization token from local storage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Fetch all users and populate the chat list
async function fetchUsers() {
    try {
        const token = getAuthToken();
        const response = await fetch('https://ontheway.runasp.net/GetAll', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error fetching users:', response.status, errorText);
            const chatList = document.getElementById('chatList');
            chatList.innerHTML = '<div class="error-message">Failed to load users. Please refresh and try again.</div>';
            return;
        }

        const users = await response.json();
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            chatList.innerHTML = '<div class="no-users">No users available</div>';
            return;
        }

        users.forEach(user => {
            // Skip the "admin2@admin.com" user
            if (user.email === 'admin2@admin.com') return;
            
            if (!user.id) return;
            
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.setAttribute('onclick', `openChat('${user.firstName} ${user.lastName || ''}', '${user.id}')`);

            const chatImage = document.createElement('img');
            chatImage.src = user.imageUrl || 'https://via.placeholder.com/40';
            chatImage.alt = `${user.firstName} ${user.lastName || ''} Photo`;
            chatImage.className = 'chat-image';
            chatImage.onerror = () => { chatImage.src = 'https://via.placeholder.com/40'; };

            const chatInfo = document.createElement('div');
            chatInfo.className = 'chat-info';
            const userName = document.createElement('h4');
            userName.textContent = user.firstName + ' ' + (user.lastName || '');
            chatInfo.appendChild(userName);

            chatItem.appendChild(chatImage);
            chatItem.appendChild(chatInfo);
            chatList.appendChild(chatItem);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '<div class="error-message">Failed to load users. Please refresh and try again.</div>';
    }
}

// Open chat for a selected user
async function openChat(name, userId) {
    const token = getAuthToken();
    const response = await fetch('https://ontheway.runasp.net/GetAll', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
        }
    });

    if (!response.ok) {
        console.error('Failed to fetch users for image:', response.status);
        return;
    }

    const users = await response.json();
    const user = users.find(u => u.id === userId);
    const userImageUrl = user?.imageUrl || 'https://via.placeholder.com/40';

    // Skip if the user is "admin2@admin.com"
    if (user?.email === 'admin2@admin.com') {
        document.getElementById('chatHeaderName').textContent = 'Select a User';
        document.getElementById('chatHeaderImage').style.display = 'none';
        document.getElementById('chatMessages').innerHTML = '';
        return;
    }

    // Update chat header
    const chatHeaderImage = document.getElementById('chatHeaderImage');
    chatHeaderImage.src = userImageUrl;
    chatHeaderImage.style.display = 'inline-block';
    document.getElementById('chatHeaderName').textContent = `${user.firstName} ${user.lastName || ''}`;

    // Clear current messages
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    // Store current userId as a data attribute for later use
    document.getElementById('chatMessages').setAttribute('data-userid', userId);
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refreshButton';
    refreshButton.textContent = 'Refresh Messages';
    refreshButton.className = 'refresh-button';
    refreshButton.style.cssText = 'padding: 5px 10px; margin-left: 10px; background: #007bff; color: white; border: none; border-radius: 4px;';
    refreshButton.onclick = () => fetchMessages(userId);
    
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        const existingButton = document.getElementById('refreshButton');
        if (existingButton) existingButton.remove();
        chatHeader.appendChild(refreshButton);
    }
    
    // Fetch and display messages for the selected user
    await fetchMessages(userId);
    
    // Enable send button and input
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    
    sendMessageBtn.disabled = false;
    const newSendBtn = sendMessageBtn.cloneNode(true);
    sendMessageBtn.parentNode.replaceChild(newSendBtn, sendMessageBtn);
    
    newSendBtn.onclick = () => sendMessage(userId, messageInput.value);
    
    messageInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(userId, messageInput.value);
        }
    };
}

// Fetch messages for the selected user
async function fetchMessages(userId) {
    try {
        console.log(`Fetching messages for user ID: ${userId}`);
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '<div class="loading">Loading messages...</div>';
        
        const token = getAuthToken();
        const response = await fetch('https://ontheway.runasp.net/api/Chat/messages', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });
        
        if (!response.ok) {
            chatMessages.innerHTML = '<div class="error-message">Failed to load messages. Please try again.</div>';
            return;
        }
        
        const allUsersData = await response.json();
        console.log('All users data:', allUsersData);
        
        const userData = allUsersData.find(user => user.userId === userId);
        console.log('Current user data:', userData);
        
        if (!userData) {
            chatMessages.innerHTML = '<div class="no-messages">No messages found for this user.</div>';
            return;
        }
        
        processUserMessages(userData, userId);
        
    } catch (error) {
        console.error('Error fetching messages:', error);
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '<div class="error-message">Error loading messages. Please try again.</div>';
    }
}

// Process and display user messages
function processUserMessages(userData, userId) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    const sentMessages = userData.sentMessages || [];
    const receivedMessages = userData.receivedMessages || [];
    
    if (sentMessages.length === 0 && receivedMessages.length === 0) {
        chatMessages.innerHTML = '<div class="no-messages">No messages yet. Start a conversation!</div>';
        return;
    }
    
    const allMessages = [
        ...sentMessages.map(msg => ({ ...msg, type: 'sent', sortTime: new Date(msg.timestamp).getTime() })),
        ...receivedMessages.map(msg => ({ ...msg, type: 'received', sortTime: new Date(msg.timestamp).getTime() }))
    ];
    
    allMessages.sort((a, b) => a.sortTime - b.sortTime);
    
    allMessages.forEach(message => {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${message.type}`;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        messageDiv.textContent = message.message || '';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date(message.timestamp).toLocaleTimeString();
        messageDiv.appendChild(timeSpan);
        
        messageContainer.appendChild(messageDiv);
        chatMessages.appendChild(messageContainer);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a new message
async function sendMessage(userId, message) {
    if (!message || message.trim() === '') {
        alert('Please enter a message');
        return;
    }

    try {
        console.log(`Sending message to user ${userId}: ${message}`);
        
        const chatMessages = document.getElementById('chatMessages');
        
        const noMessagesDiv = chatMessages.querySelector('.no-messages');
        if (noMessagesDiv) chatMessages.removeChild(noMessagesDiv);
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container sent';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        messageDiv.textContent = message;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timeSpan);
        
        messageContainer.appendChild(messageDiv);
        chatMessages.appendChild(messageContainer);
        
        document.getElementById('messageInput').value = '';
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        const token = getAuthToken();
        const response = await fetch('https://ontheway.runasp.net/api/Chat/send/admin-to-user', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                message: message
            })
        });
        
        if (response.ok) {
            console.log('Message sent successfully!');
        } else {
            console.warn('Failed to send message to server:', await response.text());
        }
        
        setTimeout(() => fetchMessages(userId), 1000);
        
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Search filter for chat list
function filterChats() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        const userName = item.querySelector('.chat-info h4').textContent.toLowerCase();
        if (userName.includes(searchInput)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Initialize chat application
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
    
    const style = document.createElement('style');
    style.textContent = `
        .loading, .no-messages, .error-message {
            padding: 20px;
            text-align: center;
            color: #666;
        }
        .message-time {
            font-size: 0.7em;
            color: #999;
            margin-left: 8px;
        }
        .refresh-button:hover {
            background: #0056b3 !important;
            cursor: pointer;
        }
        .chat-image {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .chat-header-image {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px;
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);
});