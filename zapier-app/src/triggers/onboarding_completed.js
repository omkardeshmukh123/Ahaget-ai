const BASE = 'https://api.ahaget.com/api/v1';

module.exports = {
  key: 'onboarding_completed',
  noun: 'Onboarding Completion',

  display: {
    label: 'Onboarding Completed',
    description: 'Triggers when a user finishes all steps in an onboarding flow.',
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: `${BASE}/webhooks`,
      method: 'POST',
      body: { eventType: 'onboarding_completed', url: '{{bundle.targetUrl}}' },
    },

    performUnsubscribe: {
      url: `${BASE}/webhooks/{{bundle.subscribeData.id}}`,
      method: 'DELETE',
    },

    perform: (z, bundle) => [bundle.cleanedRequest],

    performList: {
      url: `${BASE}/sessions?status=completed&limit=3`,
      method: 'GET',
    },

    sample: {
      sessionId: 'ses_sample123',
      endUserId: 'usr_sample456',
      flowId: 'flw_sample789',
      completedAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'data__sessionId',   label: 'Session ID' },
      { key: 'data__endUserId',   label: 'End User ID' },
      { key: 'data__flowId',      label: 'Flow ID' },
      { key: 'data__completedAt', label: 'Completed At' },
    ],
  },
};
