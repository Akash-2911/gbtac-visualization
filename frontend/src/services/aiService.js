import { authFetch } from './apiClient';

export function fetchAiSummary(domain) {
  return authFetch(`/ai/summary?domain=${encodeURIComponent(domain)}`);
}

export function postAiChat(question) {
  return authFetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

export function fetchAiForecast() {
  return authFetch('/ai/predict');
}