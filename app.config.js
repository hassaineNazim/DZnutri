// Config dynamique (remplace app.json) : le seul besoin de logique JS est
// d'autoriser le trafic HTTP en clair (cleartext) UNIQUEMENT pour les builds
// EAS qui ne sont PAS le profil "production" (ex: "preview", pour tester
// contre un backend local en LAN sans HTTPS). Le profil "production" garde
// la posture par défaut d'Android (HTTPS obligatoire).
const isProductionProfile = process.env.EAS_BUILD_PROFILE === "production";

module.exports = {
  expo: {
    name: "DZnutri",
    slug: "DZnutri",
    host: "lan",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/bet_holding_phone_V2.png",
    scheme: "dznutri",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    // Sans ce bloc, Android affiche la barre de statut par défaut (blanche)
    // au démarrage et tant qu'aucun écran n'a encore posé son <StatusBar> —
    // moche sur nos écrans à entête bordeaux/sombre. Bordeaux = couleur de
    // la grande majorité des écrans (accueil, scan, fiches produit...).
    androidStatusBar: {
      backgroundColor: "#59121F",
      barStyle: "light-content",
      translucent: false,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nazim.dznutri",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/bet_default_logo.png",
        backgroundColor: "#ffffff",
      },
      package: "com.Nazim.dznutri",
      permissions: ["android.permission.CAMERA"],
      googleServicesFile: "./google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/bet_holding_phone_V2.png",
      history: {
        origin: false,
      },
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/bet_holding_phone_V2.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-barcode-scanner",
      [
        "react-native-fbsdk-next",
        {
          appID: "1118044030243255",
          clientToken: "e8766f6f802ae274065ea2c5eb642b9d",
          displayName: "log in with facebook",
          scheme: "fb1118044030243255",
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: true,
          iosUserTrackingPermission:
            "This identifier will be used to deliver personalized ads to you.",
        },
      ],
      "expo-tracking-transparency",
      "expo-font",
      [
        "expo-notifications",
        {
          icon: "./assets/images/bet_default_logo.png",
          color: "#ffffff",
          iosDisplayInForeground: true,
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          androidClientId:
            "632935078884-ftovu7icqv86p0p3il3s3kk3332ffob2.apps.googleusercontent.com",
          iosClientId: "REMPLACER_PAR_VOTRE_IOS_CLIENT_ID.apps.googleusercontent.com",
          iosUrlScheme: "com.googleusercontent.apps.REMPLACER_PAR_VOTRE_IOS_CLIENT_ID",
        },
      ],
      "expo-secure-store",
      "./plugins/withFacebookPodfileFix",
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
      apiUrl: "https://api.votre-domaine.com",
    },
  },
};
