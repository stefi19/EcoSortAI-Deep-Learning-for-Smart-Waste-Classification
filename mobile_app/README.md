# EcoSortAI Expo Frontend

This is the React Native + Expo frontend for the EcoSortAI recycling assistant. It works in Expo Go for mobile testing and can be exported as a web app for Vercel.

## API URL

The app reads the backend URL from:

```text
EXPO_PUBLIC_API_URL
```

For local phone testing, use your laptop's local network IP because `localhost` on a phone points to the phone itself:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

For Vercel, set the environment variable to the deployed Hugging Face Spaces backend URL:

```text
EXPO_PUBLIC_API_URL=https://YOUR_HUGGINGFACE_BACKEND_URL
```

Example:

```text
EXPO_PUBLIC_API_URL=https://YOUR_USERNAME-ecosortai-backend.hf.space
```

## Run Locally

```bash
npm install
npx expo start
```

## Build For Vercel

```bash
npm run build:web
```

Vercel should use `mobile_app/` as the project root.
