module.exports = ({ env }) => ({
  // ... outras configurações de plugin

  email: {
    provider: 'sendgrid',
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY'),
    },
    settings: {
      defaultFrom: 'youremail@gmail.com',
      defaultReplyTo: 'youremail@gmail.com',
    },
  },
});
