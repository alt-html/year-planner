// Federated auth provider configuration.
// Set client IDs for each provider to enable sign-in.
// Leave empty to disable a provider.
export const authConfig = {
    google: {
        clientId: '',  // Google OAuth 2.0 client ID
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
