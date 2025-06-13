const admin = require('firebase-admin');
const serviceAccount = require('../../mini-trell-firebase-adminsdk-fbsvc-e67bbe4e87.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db; 