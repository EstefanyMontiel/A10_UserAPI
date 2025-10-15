    import axios from 'axios';
    import { API_URL } from '../utils/constants';

    const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    });

    export const userService = {
    getUsers: async () => {
        try {
        const response = await api.get('/users');
        return response.data;
        } catch (error) {
        throw new Error('Error al obtener los usuarios: ' + error.message);
        }
    },
    };

    export default api;