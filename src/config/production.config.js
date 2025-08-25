export const API_BASE_URL = process.env.REACT_APP_API_URL || '';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || '';

const config = {
    API_BASE_URL,
    WS_BASE_URL,
    API_ENDPOINTS: {
        AUTH: `${API_BASE_URL}/auth/`,
        USERS: `${API_BASE_URL}/users/`,
        STARTUPS: `${API_BASE_URL}/startups/`,
        JOBS: `${API_BASE_URL}/jobs/`,
        POSTS: `${API_BASE_URL}/posts/`,
        MESSAGES: `${API_BASE_URL}/messages/`,
        NOTIFICATIONS: `${API_BASE_URL}/notifications/`,
        ANALYSIS: `${API_BASE_URL}/analysis/`,
    }
};

export default config;
