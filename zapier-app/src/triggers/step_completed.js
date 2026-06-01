const BASE = 'https://api.ahaget.com/api/v1';

module.exports = {
  key: 'step_completed',
  noun: 'Step Completion',

  display: {
    label: 'Step Completed',
    description: 'Triggers each time a user completes an individual step in a flow.',
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: `${BASE}/webhooks`,
      method: 'POST',
      body: { eventType: 'step_completed', url: '{{bundle.targetUrl}}' },
    },

    performUnsubscribe: {
      url: `${BASE}/webhooks/{{bundle.subscribeData.id}}`,
      method: 'DELETE',
    },

    perform: (z, bundle) => [bundle.cleanedRequest],

    sample: {
      sessionId: 'ses_sample123',
      endUserId: 'usr_sample456',
      stepId: 'stp_sample789',
      stepName: 'Connect Your CRM',
      completedAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'data__sessionId',   label: 'Session ID' },
      { key: 'data__endUserId',   label: 'End User ID' },
      { key: 'data__stepId',      label: 'Step ID' },
      { key: 'data__stepName',    label: 'Step Name' },
      { key: 'data__completedAt', label: 'Completed At' },
    ],
  },
};
