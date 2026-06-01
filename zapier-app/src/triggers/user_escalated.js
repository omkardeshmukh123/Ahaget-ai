const BASE = 'https://api.ahaget.com/api/v1';

module.exports = {
  key: 'user_escalated',
  noun: 'Escalation',

  display: {
    label: 'User Escalated',
    description: 'Triggers when a session is escalated to a human agent, either by the AI or the user.',
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: `${BASE}/webhooks`,
      method: 'POST',
      body: { eventType: 'user_escalated', url: '{{bundle.targetUrl}}' },
    },

    performUnsubscribe: {
      url: `${BASE}/webhooks/{{bundle.subscribeData.id}}`,
      method: 'DELETE',
    },

    perform: (z, bundle) => [bundle.cleanedRequest],

    sample: {
      ticketId: 'esc_sample123',
      sessionId: 'ses_sample456',
      endUserId: 'usr_sample789',
      trigger: 'user_requested',
      reason: 'User asked to speak to a human',
    },

    outputFields: [
      { key: 'data__ticketId',  label: 'Ticket ID' },
      { key: 'data__sessionId', label: 'Session ID' },
      { key: 'data__endUserId', label: 'End User ID' },
      { key: 'data__trigger',   label: 'Trigger (agent_detected | user_requested | manual)' },
      { key: 'data__reason',    label: 'Reason' },
    ],
  },
};
