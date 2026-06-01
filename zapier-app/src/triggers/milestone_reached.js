const BASE = 'https://api.ahaget.com/api/v1';

module.exports = {
  key: 'milestone_reached',
  noun: 'Milestone',

  display: {
    label: 'Milestone Reached',
    description: "Triggers when a user hits a milestone step (the \"first value\" moment in your flow).",
  },

  operation: {
    type: 'hook',

    performSubscribe: {
      url: `${BASE}/webhooks`,
      method: 'POST',
      body: { eventType: 'milestone_reached', url: '{{bundle.targetUrl}}' },
    },

    performUnsubscribe: {
      url: `${BASE}/webhooks/{{bundle.subscribeData.id}}`,
      method: 'DELETE',
    },

    perform: (z, bundle) => [bundle.cleanedRequest],

    sample: {
      sessionId: 'ses_sample123',
      endUserId: 'usr_sample456',
      milestoneStepId: 'stp_sample789',
      reachedAt: new Date().toISOString(),
    },

    outputFields: [
      { key: 'data__sessionId',      label: 'Session ID' },
      { key: 'data__endUserId',      label: 'End User ID' },
      { key: 'data__milestoneStepId', label: 'Milestone Step ID' },
      { key: 'data__reachedAt',      label: 'Reached At' },
    ],
  },
};
