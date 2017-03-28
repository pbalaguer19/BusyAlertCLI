var functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// })
exports.checkNewUserFriends = functions.auth.user().onCreate(event =>{
  const user = event.data;
  const uid = user.uid;

  admin.database().ref('users-contacts/' + uid).on('value', contacts =>{
    contacts.forEach(contact =>{

    });
  });
  admin.database().ref('users-phone/').on('value', phones =>{
    phones.forEach(phone =>{
      
    });
  });
});
