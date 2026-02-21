import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://ai-child-conversation.onrender.com';

export const converse = async ({ userMessage, conversationHistory, imageContext }) => {
  const response = await axios.post(`${API_BASE}/api/converse`, {
    userMessage,
    conversationHistory,
    imageContext
  });
  return response.data;
};
