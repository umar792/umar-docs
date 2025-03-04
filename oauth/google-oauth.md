# Google OAuth

The following explanation tell you that how you can implement the Google OAuth in to your nodejs application

## 1. Set Up Your Project & Enable the API

### Create a Project:

Create your Google Console account and create your project

### Enable the API:

Enable the ads API from the services so that you can access the endpoint(eg. Google Ads API , Google People Api)

### Create OAuth Credentials:

Navigate to the “Credentials” section and create an OAuth 2.0 Client ID. You’ll need to specify the application type (e.g., Web application) and provide authorized redirect URIs (where users will be sent after authentication).

# 2. Configure the OAuth Consent Screen

### Define Scopes:

Decide which scopes your app needs. For read access, you might only need a “read-only” scope (for example, https://www.googleapis.com/auth/adwords.readonly for Google Ads).
Consent Details:
Fill in the required fields (app name, logo, privacy policy URL, etc.) so that users know what access they are granting.

# 3. Redirect user to url

```js
https://accounts.google.com/o/oauth2/auth? client_id=YOUR_CLIENT_ID&
redirect_uri=YOUR_REDIRECT_URI& response_type=code&
scope=openid%20email%20profile& access_type=offline
```

This url authorized the user and redirect user with code and state on redirect url

# 4. Handling the redirect url

When google oauth redirects user to your defined redirect url with code and state<br/>
Get the code and state and send the following request

```js
const { code, userId } = req.body;

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: "authorization_code",
  }),
});

const tokenData = await tokenResponse.json();
console.log("Google Token Response:", tokenData);
```
The tokenData have the access token , refresh token , and other information 
