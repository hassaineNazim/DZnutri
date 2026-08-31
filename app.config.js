// Config dynamique (remplace app.json) : le seul besoin de logique JS est
// d'autoriser le trafic HTTP en clair (cleartext) UNIQUEMENT pour les builds
// EAS qui ne sont PAS le profil "production" (ex: "preview", pour tester
// contre un backend local en LAN sans HTTPS). Le profil "production" garde
// la posture par défaut d'Android (HTTPS obligatoire).
const easBuildProfile = process.env.EAS_BUILD_PROFILE || "";
const isProductionProfile = easBuildProfile.startsWith("production");

// Identifiants OAuth publics. Le même client iOS est injecté dans la
// configuration native ET exposé au runtime afin d'éviter toute divergence
// entre le schéma URL généré par le plugin et GoogleSignin.configure().
const googleIosClientId =
  process.env.GOOGLE_IOS_CLIENT_ID ||
  "899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com";
const googleWebClientId =
  process.env.GOOGLE_WEB_CLIENT_ID ||
  "899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com";
const googleIosUrlScheme = `com.googleusercontent.apps.${googleIosClientId.replace(
  ".apps.googleusercontent.com",
  "",
)}`;

module.exports = {
  expo: {
    name: "Remo Scan",
    slug: "DZnutri",
    host: "lan",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logoRemo.png",
    scheme: "dznutri",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    // Pendant le splash, la barre doit reprendre son fond blanc. Chaque écran
    // pose ensuite explicitement sa propre couleur (bordeaux ou feuille).
    androidStatusBar: {
      backgroundColor: "#ffffff",
      barStyle: "dark-content",
      translucent: false,
    },
    ios: {
      // L'interface est actuellement conçue et testée pour téléphone. Ne pas
      // déclarer l'iPad évite une fiche App Store trompeuse et des captures
      // iPad obligatoires tant qu'un vrai layout tablette n'est pas prêt.
      supportsTablet: false,
      bundleIdentifier: "com.nazim.dznutri",
      // Couleur de la fenêtre UIKit derrière React Native, notamment visible
      // sous l'indicateur d'accueil sur les iPhone sans bouton principal.
      backgroundColor: "#4D1521",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo-remo-adaptive-foreground.png",
        backgroundColor: "#3b0010",
      },
      package: "com.Nazim.dznutri",
      permissions: ["android.permission.CAMERA"],
      // Le SDK Facebook ajoute AD_ID transitivement. Remo Scan n'utilise ni
      // publicité ciblée ni mesure publicitaire : on retire donc explicitement
      // cette permission du manifeste final.
      blockedPermissions: ["com.google.android.gms.permission.AD_ID"],
      googleServicesFile: "./google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logoRemo.png",
      history: {
        origin: false,
      },
    },
    plugins: [
      "expo-router",
      "expo-system-ui",
      "expo-localization",
      "expo-apple-authentication",
      [
        "expo-camera",
        {
          cameraPermission: "Autoriser Remo Scan à utiliser l’appareil photo pour scanner les codes-barres des produits.",
          microphonePermission: false,
          recordAudioAndroid: false,
          barcodeScannerEnabled: true,
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Autoriser Remo Scan à accéder à vos photos pour envoyer les images d’un produit.",
          cameraPermission: "Autoriser Remo Scan à prendre des photos des produits que vous souhaitez ajouter.",
          microphonePermission: false,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logoRemo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#3b0010",
        },
      ],
      [
        "react-native-fbsdk-next",
        {
          appID: "1118044030243255",
          clientToken: "e8766f6f802ae274065ea2c5eb642b9d",
          displayName: "log in with facebook",
          scheme: "fb1118044030243255",
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: false,
        },
      ],
      "expo-font",
      [
        "expo-notifications",
        {
          icon: "./assets/images/logo-remo-notification.png",
          color: "#ffffff",
          iosDisplayInForeground: true,
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          androidClientId:
            "632935078884-ftovu7icqv86p0p3il3s3kk3332ffob2.apps.googleusercontent.com",
          iosClientId: googleIosClientId,
          iosUrlScheme: googleIosUrlScheme,
        },
      ],
      "expo-secure-store",
      "./plugins/withExcludeFacebookIOS",
      "./plugins/withPrivacyManifest",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: !isProductionProfile,
          },
          // Google Sign-In embarque des pods Swift (AppCheckCore, dépendance
          // de GoogleUtilities/RecaptchaInterop) qui ne peuvent pas être liés
          // en bibliothèques statiques sans modules — échec CocoaPods
          // ("cannot yet be integrated as static libraries"). useFrameworks
          // "static" est le contournement officiellement documenté par Expo.
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "388f92c2-6ce6-43bd-bc1d-430a055da834",
      },
      facebookAppId: "1118044030243255",
      googleIosClientId,
      googleWebClientId,
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        "https://dznutri-backend-production.up.railway.app",
    },
  },
};
