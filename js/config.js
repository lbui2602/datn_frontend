const CONFIG = {
    API_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
        AUTH: {
            STAFF: '/auth/staff',
            PROFILE: '/auth/profile',
            UPDATE: '/auth/update',
            ACCEPT: '/auth/accept'
        },
        DEPARTMENTS: '/departments'
    },
    PAGINATION: {
        ITEMS_PER_PAGE: 10
    }
};

// Interceptor for handling API responses
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
} 