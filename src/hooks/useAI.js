import { useState } from 'react';
import { api } from '../api/client';

export async function callClaude(prompt) {
  const data = await api.ai.ask(prompt);
  return data.response ?? data.message ?? JSON.stringify(data);
}

export function useAI() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function ask(prompt) {
    setLoading(true);
    setError(null);
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    try {
      const reply = await callClaude(prompt);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
  }

  return { messages, loading, error, ask, clear };
}
