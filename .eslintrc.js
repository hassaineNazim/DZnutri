// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  // admin-frontend (CRA) et backend (Python) ne relèvent pas de ce lint Expo ;
  // sans ces exclusions, ESLint analysait le JS minifié de admin-frontend/build.
  ignorePatterns: ['/dist/*', 'admin-frontend/', 'backend/'],
};
