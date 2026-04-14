// Federated auth provider configuration.
// Set client IDs for each provider to enable sign-in.
// Leave empty to disable a provider.
export const authConfig = {
    google: {
        clientId: '98746316056-d581h0p6u6ts0544fcu28gtu5brblal5.apps.googleusercontent.com',  // Google OAuth 2.0 client ID
    },
    github: {
        clientId: '',  // GitHub OAuth App client ID — set after BKD-03 registration
    },
    apple: {
        clientId: '',  // Apple Services ID
        redirectURI: '', // Redirect URI for Apple Sign-In
    },
    microsoft: {
        clientId: '',  // Azure AD application (client) ID
        authority: 'https://login.microsoftonline.com/common',
    },
};
