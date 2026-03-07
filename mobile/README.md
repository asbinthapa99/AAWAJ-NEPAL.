# GuffGaff Mobile App 📱

Native mobile app for **GuffGaff (गफगाफ)** — Nepal's Civic Voice platform.

Built with **Expo + React Native** and connects to the same Supabase backend as the web app.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for development)

### Install & Run

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or **Camera** (iOS) to open on your phone.

### Build APK (Android)

```bash
npx expo build:android
# or with EAS:
npx eas build --platform android
```

### Build IPA (iOS)

```bash
npx eas build --platform ios
```

## 📁 Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (providers)
│   ├── index.tsx           # Entry redirect
│   ├── auth/               # Auth screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/             # Bottom tab navigation
│   │   ├── _layout.tsx     # Tab bar config
│   │   ├── home.tsx        # Feed screen
│   │   ├── explore.tsx     # Search & categories
│   │   ├── create.tsx      # Create post
│   │   ├── activity.tsx    # Notifications
│   │   └── profile.tsx     # User profile
│   └── post/
│       └── [id].tsx        # Post detail + comments
├── src/
│   ├── components/
│   │   └── PostCard.tsx    # Instagram-style post card
│   ├── lib/
│   │   ├── config.ts       # Supabase credentials
│   │   ├── supabase.ts     # Supabase client + SecureStore
│   │   ├── theme.ts        # Colors, constants, helpers
│   │   └── types.ts        # TypeScript types
│   └── providers/
│       ├── AuthProvider.tsx # Auth context
│       └── ThemeProvider.tsx # Dark/light theme
└── assets/                 # App icons, splash screen
```

## ✨ Features

- 🔐 **Auth**: Email login, register, forgot password (Supabase)
- 📰 **Feed**: Pull-to-refresh, infinite scroll, For You/Trending/Latest tabs
- ❤️ **Love Reaction**: Floating hearts animation
- 📝 **Create Post**: Image picker, category selector
- 🔍 **Explore**: Search + category filter chips
- 🔔 **Activity**: Real-time notifications
- 👤 **Profile**: Instagram-style grid, stats, edit profile
- 🌙 **Dark/Light**: Auto system theme + manual toggle
- 🔒 **Secure**: Tokens stored in device SecureStore

## 🔗 Shared Backend

Uses the same **Supabase** project as the web app:
- `https://qcngfiwliorztaafhhwo.supabase.co`
- Same database, same auth, same storage

## 📦 Key Dependencies

- `expo` ~52.0.0
- `expo-router` ~4.0.0
- `@supabase/supabase-js` ^2.45.0
- `expo-secure-store` ~14.0.0
- `expo-image-picker` ~16.0.0
- `react-native-reanimated` ~3.16.0
