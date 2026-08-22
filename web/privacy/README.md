# Privacy policy / account deletion page

Static page satisfying Google Play's Account & Data Deletion requirement: a public URL, outside
the app, where users can request their synced data be deleted.

## Before publishing

1. Replace `REPLACE_WITH_GOOGLE_FORM_URL` in `index.html` with a real Google Form link (collect at
   minimum: the Google account email used to sign in, and an optional reason).
2. Replace `REPLACE_WITH_SUPPORT_EMAIL` with a real contact address.

## Deploying

This repo's Firebase project already hosts Firestore for cloud sync (see `firestore.rules`), so
Firebase Hosting is the path of least resistance - `firebase.json`'s `hosting.public` already
points at this folder:

```
firebase deploy --only hosting
```

Any other static host (GitHub Pages, Netlify, ...) works too - it's a single self-contained HTML
file with no build step.

## Play Store listing

Once deployed, add the resulting URL to the Play Console listing's **Data safety -> Data deletion**
section (and as the app's Privacy Policy URL, if it doesn't already have one).
