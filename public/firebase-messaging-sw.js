importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDY7EfIaHDJU19yfNTC1KwyhMhL0z5dlJc",
    authDomain: "olx-app111.firebaseapp.com",
    databaseURL: "https://olx-app111.firebaseio.com",
    projectId: "olx-app111",
    storageBucket: "olx-app111.appspot.com",
    messagingSenderId: "286691312002"
  };
  firebase.initializeApp(config);

  const messaging = firebase.messaging();
 
 
 
  // messaging.setBackgroundMessageHandler(function(payload) {
  //   console.log('[firebase-messaging-sw.js] Received background message ', payload);
  //   // Customize notification here
  //   var notificationTitle = 'Background Message Title';
  //   var notificationOptions = {
  //     body: 'Background Message body.',
  //     icon: '/firebase-logo.png'
  //   };
  
  //   return self.registration.showNotification(notificationTitle,
  //     notificationOptions);
  // });
