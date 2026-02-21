import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const converse = async ({ userMessage, conversationHistory, imageContext }) => {
  const response = await axios.post(`${API_BASE}/api/converse`, {
    userMessage,
    conversationHistory,
    imageContext
  });
  return response.data;
};
