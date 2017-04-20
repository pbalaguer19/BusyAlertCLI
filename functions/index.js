var functions = require('firebase-functions');
var admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);
var db = admin.database();

exports.checkUserStatus = functions.database.ref('/users/{userID}/status')
    .onWrite(event => {
      const snapshot = event.data;
      if(snapshot.val() != "Busy") return;

      const userID = event.params.userID;

      const getUserProfilePromise = admin.auth().getUser(userID);
      const getFriendsTokenPromise = db.ref('/users-favourites').child(userID).once('value');

      return Promise.all([getUserProfilePromise, getFriendsTokenPromise]).then(results => {
        const user = results[0];
        const phonesSnap = results[1];

        if (!phonesSnap.exists()) return;

        const tokens = [];
        phonesSnap.forEach(function(data) {
            tokens.push(Object.keys(phonesSnap.child(data.key).val())[0]);
        });

        console.log("Sending Notification to " + tokens);
        if(tokens.length > 0){
          // Notification details.
          const payload = {
            notification: {
              title: 'Busy Notification!',
              body: `${user.email} is busy now.`,
            }
          };

          // Send notifications to all tokens.
          return admin.messaging().sendToDevice(tokens, payload).then(response => {
            // For each message check if there was an error.
            response.results.forEach((result, index) => {
              const error = result.error;
              if (error) {
                console.error('Failure sending notification to', tokens[index], error);
                // Cleanup the tokens who are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                }
              }
            });
          });
        }
      });
});
