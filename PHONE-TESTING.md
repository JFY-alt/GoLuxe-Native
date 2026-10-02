# iPhone testing and updates

This project targets Expo SDK 57. Install the current Expo Go from the iPhone App Store. Sign Expo CLI into the same account as Expo Go (`j_fett92` for this testing session), then start Metro:

```sh
npm ci
npx expo login --browser
npm run test:phone
```

Scan the terminal QR with the iPhone Camera and open it in Expo Go. Keep the computer and Metro running. A tunnel URL expires when Metro stops. If the Mac exhausts filesystem watchers, run `CI=1 npm run test:phone`; in this mode restart Metro after changes because watching/Fast Refresh is disabled.

## Installed app and update prompts

Expo Go is the immediate phone testing route with no paid Apple Developer membership. It loads the development project; it is not a separately signed GoLuxe application. No Expo account/project credentials have been added to the source.

A signed iPhone internal distribution build requires paid Apple Developer membership, even without publishing to the App Store. With that available:

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli device:create
npm run build:preview:ios
```

`eas init` supplies a real project ID. The dynamic app config then enables Expo Updates with a fingerprint runtime and the account's update URL. Preview builds use the preview channel. Publish compatible JavaScript/assets using `npm run update:preview`. The app checks on startup/foreground and offers Download & Restart. It keeps the installed version when offline or when the user postpones. Restarting clears the active in-memory game, so finish a match first. Native dependency/config changes require a new signed binary and installation link.

Pushing to GitHub alone does not publish an Expo update. EAS account linking, signing, actual device installation, OTA delivery, and automatic GitHub publishing are not configured or verified in this handoff. Vercel can continue hosting the reference web app independently.

Official references: [Expo Go](https://docs.expo.dev/get-started/set-up-your-environment/), [internal distribution](https://docs.expo.dev/build/internal-distribution/), [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/).
