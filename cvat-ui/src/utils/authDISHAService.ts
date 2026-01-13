// cvat-ui/src/services/authService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:8004/api';

export async function getCurrentUser() {
    try {
        const response = await axios.get(`${API_URL}/me`, { withCredentials: true });
        return response.data; // { username, email, ... }
    } catch (err) {
        return null;
    }
}
