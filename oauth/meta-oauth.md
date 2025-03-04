# Meta Oauth (facebook oauth)

## Step 1: Create a Meta App

1. Go to the Meta for Developers portal.<b1/>
2. Click My Apps → Create App.<b1/>
3. Select Business as the app type (to access Ads APIs).<b1/>
4. Enter your App Name, Contact Email, and Business Account (if applicable).<b1/>
5. Click Create App.<b1/>

## Step 2: Configure OAuth Settings

1. Inside the app dashboard, go to Settings → Basic.
2. Note down the App ID and App Secret.
3. Under App Domains, enter your backend’s domain.
4. Set Privacy Policy URL and other required fields.
5. Enable Facebook Login under "Add a Product."
6. In Facebook Login Settings, set the Valid OAuth Redirect URIs (e.g., https://your-backend.com/auth/meta/callback).

## Step 3: Generate OAuth Authorization URL

```js
https://www.facebook.com/v18.0/dialog/oauth?
client_id={APP_ID}
&redirect_uri={REDIRECT_URI}
&scope={SCOPES} // choose your scopes which information you want from user(e.g, i want ads access ,scope=ads_read,ads_management,business_management)
&response_type=code
&state={STATE_PARAM}

```

## Step 5: Handle OAuth Callback & Exchange Code for Access Token

After the user logs in, Meta redirects to:

```js
//your-backend.com/auth/meta/callback?code={AUTH_CODE}&state={STATE}

if (!code || !userId) {
  return responHnadler(false, "Missing code or user ID", 4000);
}

const tokenResponse = await fetch(
  "https://graph.facebook.com/v18.0/oauth/access_token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: meta_app_facebook_id,
      client_secret: meta_facebook_id_secret,
      redirect_uri: FB_REDIRECT_URI,
      code: code,
    }),
  }
);

const tokenData = await tokenResponse.json();
```
