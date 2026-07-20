import { authFetch } from './apiClient';

export function fetchAiSummary() {
  return authFetch('/ai/summary');
}

export function postAiChat(question) {
  return authFetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}