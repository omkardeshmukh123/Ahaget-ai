const { version } = require('./package.json');
const { version: platformVersion } = require('zapier-platform-core');

const onboardingCompleted = require('./src/triggers/onboarding_completed');
const stepCompleted = require('./src/triggers/step_completed');
const userEscalated = require('./src/triggers/user_escalated');
const milestoneReached = require('./src/triggers/milestone_reached');

const App = {
  version,
  platformVersion,

  authentication: {
    type: 'custom',
    test: { url: 'https://api.ahaget.com/api/v1/auth/me', method: 'GET' },
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        required: true,
        type: 'string',
        helpText: 'Find your API key at https://app.ahaget.com/settings/general',
      },
    ],
    connectionLabel: '{{bundle.authData.api_key}}',
  },

  beforeRequest: [
    (request, z, bundle) => {
      request.headers['Authorization'] = `Bearer ${bundle.authData.api_key}`;
      return request;
    },
  ],

  triggers: {
    [onboardingCompleted.key]:  onboardingCompleted,
    [stepCompleted.key]:        stepCompleted,
    [userEscalated.key]:        userEscalated,
    [milestoneReached.key]:     milestoneReached,
  },
};

module.exports = App;
