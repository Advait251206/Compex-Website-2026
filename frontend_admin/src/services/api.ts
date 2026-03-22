import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Only add token if header is not already set AND token is valid
    if (token && token !== 'undefined' && token !== 'null' && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  googleLogin: (token: string) => api.post('/auth/google', { token }),
  verifyOTP: (data: any) => api.post('/auth/verify-otp', data),
  resendOTP: (data: any) => api.post('/auth/resend-otp', data),
  // Forgot Password Flow
  requestPasswordResetOTP: (data: { email: string }) => api.post('/auth/forgot-password-request', data),
  verifyResetOTP: (data: { email: string; otp: string }) => api.post('/auth/forgot-password-verify', data),
  resetPassword: (data: { email: string; newPassword: string; otp: string }) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data)
};

export const ticketAPI = {
  bookTicket: (data: any, token: string) => api.post('/tickets/book', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getMyTickets: (token: string) => api.get('/tickets/my-tickets', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  cancelTicket: (id: string, token: string) => api.patch(`/tickets/${id}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteTicket: (id: string, token: string) => api.delete(`/tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  downloadTicket: (id: string, token: string) => api.get(`/tickets/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  }),
  emailTicket: (id: string, token: string) => api.post(`/tickets/${id}/email`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  scanTicket: (qrData: string, token: string) => api.post('/admin/checkin', { qrData }, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getProfile: (token: string) => api.get('/tickets/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
};

export const otpAPI = {
  sendOTP: (email: string, firstName: string, token: string) => api.post('/otp/send', 
    { email, firstName },
    { headers: { Authorization: `Bearer ${token}` } }
  ),
  verifyOTP: (email: string, otp: string, token: string) => api.post('/otp/verify', 
    { email, otp },
    { headers: { Authorization: `Bearer ${token}` } }
  )
};

export const adminAPI = {
  getAllTickets: (token: string) => api.get('/admin/tickets', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  toggleCheckIn: (id: string, status: boolean, token: string) => api.patch(`/admin/toggle-checkin/${id}`, 
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  ),
  pickWinner: (prize: string, token: string) => api.post('/admin/pick-winner', 
    { prize },
    { headers: { Authorization: `Bearer ${token}` } }
  ),
  getWinners: (token: string) => api.get('/admin/winners', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getStats: (token: string) => api.get('/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  })
};

export default api;
