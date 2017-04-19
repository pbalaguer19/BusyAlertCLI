var functions = require('firebase-functions');
var admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);


exports.checkUserStatus = functions.database.ref('/users/{userID}/status')
    .onWrite(event => {
      const snapshot = event.data;
      const userID = event.params.userID;
      if (snapshot.previous.val()) {
        return;
      }

      const getUserProfilePromise = admin.auth().getUser(userID);

      return Promise.all([getUserProfilePromise]).then(results => {
        const user = results[0];
        const tokens = loadFavourites(userID);

        if(tokens.length > 0){
          // Notification details.
          const payload = {
            notification: {
              title: 'Busy Notification!',
              body: `${user.username} is busy now.`,
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

function loadFavourites(uid) {
    return functions.database.child('users-favourites').child(uid).once('value').then(function(snapshot) {
        var reads = [];
        snapshot.forEach(function(childSnapshot) {
            var telf = childSnapshot.key();

            var id = functions.database.child('users-phone').child(telf).once('value').then(function(snap) {
                // The Promise was fulfilled.
            }, function(error) {
                // The Promise was rejected.
                console.error(error);
            });

            var promise = functions.database.child('users').child(id).child("token").once('value').then(function(snap) {
                // The Promise was fulfilled.
            }, function(error) {
                // The Promise was rejected.
                console.error(error);
            });
            reads.push(promise);
        });
        return Promise.all(reads);
    }, function(error) {
        // The Promise was rejected.
        console.error(error);
    }).then(function(values) {
        console.log(values); // [snap, snap, snap]
    });
}
