/**
 * Le plugin Facebook ajoute des identifiants SKAdNetwork même lorsque toute
 * collecte publicitaire est désactivée. DZnutri n'affiche pas de publicité :
 * on nettoie donc les déclarations d'attribution après l'exécution du plugin.
 */
module.exports = function withPrivacyManifest(config) {
  config.ios = config.ios || {};
  config.ios.infoPlist = config.ios.infoPlist || {};
  delete config.ios.infoPlist.NSUserTrackingUsageDescription;
  delete config.ios.infoPlist.SKAdNetworkItems;
  config.ios.infoPlist.FacebookAdvertiserIDCollectionEnabled = false;
  config.ios.infoPlist.FacebookAutoLogAppEventsEnabled = false;
  config.ios.infoPlist.FacebookAutoInitEnabled = false;
  return config;
};
