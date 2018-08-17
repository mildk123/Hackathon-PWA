var database = firebase.database();
const databaseRefre = firebase.database().ref();
var storage = firebase.storage();
const messaging = firebase.messaging();

// A loading image URL.
var LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

let error;
let myUid;
let imgFiles;
let AD_ID;
let viewingCategory;
let adPlace;

let chatKey;

let searchResponse;
let getCategory;

let users_City;

// checking is Browser supports the Service Worker..
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ev => {
    navigator.serviceWorker.register('sw.js')
      .then(res => console.log('registered!!!'))
      .catch(err => console.log(err));
  })
}

// *************/////////////******** GEOLOCATION ******************//////////////*********/

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(getPostionInAd);
}
function getPostionInAd(position) {
  apiLink = `http://maps.googleapis.com/maps/api/geocode/json?latlng=${
    position.coords.latitude
  },${position.coords.longitude}&sensor=true`;
  fetch(apiLink)
    .then(resp => resp.json())
    .then(function(userLocation) {
      users_City = userLocation.results[8].formatted_address;
    });
}

//////////////////////////////////////////////////////////////////////////////////////////

// Event Listeners
$("#signUpBtn").on("click", function() {
  signup();
});
$("#loginBtn").on("click", function() {
  login();
});
$("#signOutBtn").on("click", function() {
  signout();
});
$("#signoutButton").on("click", function() {
  signout();
});
$("#submiAdBtn").on("click", function() {
  postAd();
});
$("figure").on("click", function() {
  adToDatabase(this);
});
$("#searchBtn").on("click", function() {
  onSearch();
});

$("#myAds").on("click", function() {
  $("#responseArea").css("display", "block");
  $("#savedAds").css("display", "none");
  $("#responseAreaChats").css("display", "none");
  gettingAdsToAdmin();
});

$("#myChats").on("click", function() {
  $("#responseArea").css("display", "none");
  $("#savedAds").css("display", "none");
  $("#responseAreaChats").css("display", "block");
  getMyChats();
});

$("#mySavedAds").on("click", function() {
  $("#responseArea").css("display", "none");
  $("#responseAreaChats").css("display", "none");
  $("#savedAds").css("display", "block");
  getSavedAds();
});

$("#saveAdBtn").on("click", function() {
  SavingAdToDb();
});

document.addEventListener("DOMContentLoaded", function() {
  checkUserState();

  autofillAd();
  gettingAds();
  dbToSingle();
});

if (location.pathname == "/pages/search.html") {
  searchComplete();
}

// **************************** Getting Token From Logged In User *******************//
var token = localStorage.getItem("notificationToken");
var loginCheck = localStorage.getItem("user");
var loggedInUID = localStorage.getItem("myUid");

if (loginCheck) {
  if (token != true) {
    messaging
      .requestPermission()
      .then(() => handleTokenRefresh())
      .catch(err => console.log("TokenCheck: ", err));
  }

  function handleTokenRefresh() {
    return messaging.getToken().then(token => {
      databaseRefre
        .child(`/Tokens`)
        .child(loggedInUID)
        .set({
          token: token,
          userID: loggedInUID
        });
      localStorage.setItem("notificationToken", JSON.stringify(true));
    });
  }
} else {
}

messaging.onMessage(function(payload) {
  console.log("onMessage", payload);
});

function currentUser() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      let userAccPlace = $("#MyAccPlace");
      let email = user.email;

      userAccPlace.text(email);
    }
  });
}

function checkUserState() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser();
      $("#signOutBtn").css("display", "block");
      $("#signoutButton").css("display", "block");
      $("#MyAdsDash").css("display", "block");
      $("#dashBoardButton").css("display", "block");
      $("#dropDown_div").css("display", "block");

      $("#loginNav_Btn").css("display", "none");
      $("#SignupNav_Btn").css("display", "none");
      $("#loginButton").css("display", "none");
      $("#signUpbutton").css("display", "none");
    } else {
      $("#signOutBtn").css("display", "none");
      $("#MyAdsDash").css("display", "none");
      $("#dashBoardButton").css("display", "none");
      $("#dropDown_div").css("display", "none");
      $("#signoutButton").css("display", "none");

      $("#loginNav_Btn").css("display", "block");
      $("#SignupNav_Btn").css("display", "block");
      $("#loginButton").css("display", "block");
      $("#signUpbutton").css("display", "block");
    }
  });
}

// *************************Authentication***************************** \\

// Creating User's Account
function signup() {
  this.user = {};
  this.fName = $("#fname").val();
  this.lName = $("#lname").val();
  this.userName = $("#username").val();
  this.email = $("#email").val();
  this.password = $("#password").val();
  this.cPassword = $("#cPassword").val();

  // From Validation

  if (
    fName == "" ||
    lName == "" ||
    email == "" ||
    userName == "" ||
    password == ""
  ) {
    swal({
      title: "Error",
      text: "Please Fill out all fields!",
      icon: "error"
    });
  } else if (
    fName == " " ||
    lName == " " ||
    email == " " ||
    userName == " " ||
    password == " "
  ) {
    swal({
      title: "Error",
      text: "Please fill a empty space with meaningful data",
      icon: "error"
    });
    location.reload(false);
  } else if (cPassword != password) {
    swal({
      title: "Error",
      text: "Password do not match!",
      icon: "error"
    });
  } else {
    // To Firebase Authentication
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(function(resp) {
        myUid = resp.user.uid;
        localStorage.setItem("user", "true");
        localStorage.setItem("myUid", `${myUid}`);

        // Updates USER PROFILE
        var user = firebase.auth().currentUser;
        // return user.updateProfile({
        //   displayName: userName
        // })
        // .then(updated => console.log(`profile updated`))
        // .catch(function(error) {
        // })

        // Send User's Details to DB
        var siteUsers = database.ref("Users/").push();
        siteUsers.set({
          firstName: fName,
          lastName: lName,
          userName: userName,
          userEmail: email,
          userPassword: password,
          uniqueID: myUid
        });

        location.pathname = "/index.html";
      })
      .catch(function(err) {
        swal({
          title: "Error",
          text: err.message,
          icon: "error"
        });
      });
  }
}

// Logging In User
function login() {
  this.email = $("#loginUsername").val();
  this.password = $("#loginPassword").val();

  if (loginUsername != "" || loginPassword != "") {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(function(userLogin) {
        myUid = userLogin.user.uid;
        myEmail = userLogin.user.displayName;
        localStorage.setItem("user", "true");
        localStorage.setItem("myUid", `${myUid}`);

        location.pathname = "/index.html";
      })
      .catch(function(error) {
        swal({
          title: "Error",
          text: error.message,
          icon: "error"
        });
      });
  } else {
  }
}

function signout() {
  firebase
    .auth()
    .signOut()
    .then(function() {
      // Sign-out successful.
      myUid = "";
      localStorage.removeItem("user");
      localStorage.removeItem("myUid");
      $("#signOutBtn").css("display", "none");

      location.reload(true);
    })
    .catch(function(error) {
      // An error happened.
      $("#signOutBtn").css("display", "block");
      location.reload(true);
    });
}

// ***************************Submit An Advertisment********************** \\

// AutoFills Submit Ad Data
function autofillAd() {
  firebase.auth().onAuthStateChanged(function(user) {
    // If User is logged in fill the place holder data;
    if (user) {
      var userEmail = user.email;
      var userDisplayName = user.displayName;

      $("#adSellerEmail").val(userEmail);
      $("#adSellerName").val(userDisplayName);
    }
  });
}

// SHOWING IMG IN FILES READER
function previewAdImage(input) {
  if (input.files && input.files[0]) {
    $("#ImgViewer").attr("hidden", false);
    var reader = new FileReader();
    reader.onload = function(e) {
      $("#ImgViewer")
        .attr("src", e.target.result)
        .width(100)
        .height(100);
    };
    reader.readAsDataURL(input.files[0]);
  }
  imgFiles = input.files[0];
}
function postAd() {
  this.adCategory = $("#AdCategory option:selected").text();
  this.adName = $("#adName").val();
  this.adDesc = $("#adDesc").val();
  this.adCondition = $("#condition option:selected").text();
  this.adPic = imgFiles;
  this.adprice = $("#adPrice").val();
  this.adSellerName = $("#adSellerName").val();
  this.adSellerNo = $("#adSellerNo").val();
  this.adSellerEmail = $("#adSellerEmail").val();

  if (
    adName == "" ||
    adDesc == "" ||
    adprice == "" ||
    adSellerName == "" ||
    adSellerNo == ""
  ) {
    $("#errorBox").text(
      `Please Fill out all the necessary details (marked with *)`
    );
    $("#errorBox").css("display", "block");
  } else {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // // Sending DATA TO DATABASE
        var myEmail = firebase.auth().currentUser.email;
        var myUid = firebase.auth().currentUser.uid;
        var UserAds = databaseRefre.child(`UserAds/`).child(adCategory).push({
            AD_ID: `${adName}${adSellerName}`,
            adCategory: adCategory,
            adName: adName.toUpperCase(),
            adDesc: adDesc,
            adImg: LOADING_IMAGE_URL,
            adCondition: adCondition,
            adprice: adprice,
            Added: new Date().toLocaleDateString(),
            location: users_City,
            seller: {
              adSellerUid: myUid || "NAU",
              adSellerName: adSellerName,
              adSellerNo: adSellerNo,
              adSellerEmail: myEmail
            }
          })
          .then(function(ad_refrence) {
            //******************* Sending IMG TO DB THEN GETTING LINK ********************\\
            var filePath = myUid + "/" + ad_refrence.key + "/";
            firebase.storage().ref(filePath).put(adPic)
              .then(function(fileSnapshot) {
                // 3 - Generate a public URL for the file.
                return fileSnapshot.ref.getDownloadURL().then(url => {
                  // 4 - Update the chat message placeholder with the image's URL.
                  return ad_refrence.update({
                    adImg: url,
                    storageUri: fileSnapshot.metadata.fullPath
                  });
                });
                // document.getElementById("adSubmissionForm").reset();
              });
            });

        var UserAds = databaseRefre.child(`UserAds/`).child("All Categories").push({
            AD_ID: `${adName}${adSellerName}`,
            adCategory: adCategory,
            adName: adName.toUpperCase(),
            adDesc: adDesc,
            adImg: LOADING_IMAGE_URL,
            adCondition: adCondition,
            adprice: adprice,
            Added: new Date().toLocaleDateString(),
            location: users_City,
            seller: {
              adSellerUid: myUid || "NAU",
              adSellerName: adSellerName,
              adSellerNo: adSellerNo,
              adSellerEmail: myEmail
            }
          })
          .then(function(ad_refrence) {
            //******************* Sending IMG TO DB THEN GETTING LINK ********************\\
            var filePath = myUid + "/" + ad_refrence.key + "/";
            firebase
              .storage()
              .ref(filePath)
              .put(adPic)
              .then(function(fileSnapshot) {
                // 3 - Generate a public URL for the file.
                return fileSnapshot.ref.getDownloadURL().then(url => {
                  // 4 - Update the chat message placeholder with the image's URL.
                  return ad_refrence.update({
                    adImg: url,
                    storageUri: fileSnapshot.metadata.fullPath
                  });
                });
              });
          });

        document.getElementById("adSubmissionForm").reset();
        // ************For NON USERS ******************//
      } else {
        // // Sending DATA TO DATABASE
        var myEmail = adSellerEmail;
        var myUid = `NoneUser`;
        var UserAds = databaseRefre
          .child(`UserAds/`)
          .child(adCategory)
          .push({
            AD_ID: `${adName}${adSellerName}`,
            adCategory: adCategory,
            adName: adName.toUpperCase(),
            adDesc: adDesc,
            adImg: LOADING_IMAGE_URL,
            adCondition: adCondition,
            adprice: adprice,
            Added: new Date().toLocaleDateString(),
            location: users_City,
            seller: {
              adSellerUid: myUid || "NAU",
              adSellerName: adSellerName,
              adSellerNo: adSellerNo,
              adSellerEmail: myEmail
            }
          })
          .then(function(ad_refrence) {
            var filePath = `NoneUser/` + ad_refrence.key + `/`;
            firebase
              .storage()
              .ref(filePath)
              .put(adPic)
              .then(function(fileSnapshot) {
                return fileSnapshot.ref.getDownloadURL().then(url => {
                  return ad_refrence.update({
                    adImg: url,
                    storageUri: fileSnapshot.metadata.fullPath
                  });
                });
              });
          });

        // For ALL categories
        var UserAllAds = databaseRefre
          .child(`UserAds/`)
          .child(`All Categories`)
          .push({
            AD_ID: `${adName}${adSellerName}`,
            adCategory: adCategory,
            adName: adName.toUpperCase(),
            adDesc: adDesc,
            adImg: LOADING_IMAGE_URL,
            adCondition: adCondition,
            adprice: adprice,
            Added: new Date().toLocaleDateString(),
            location: users_City,
            seller: {
              adSellerUid: myUid || "NAU",
              adSellerName: adSellerName,
              adSellerNo: adSellerNo,
              adSellerEmail: myEmail
            }
          })
          .then(function(ad_refrence) {
            var filePath = `NoneUser/` + ad_refrence.key + `/`;
            firebase
              .storage()
              .ref(filePath)
              .put(adPic)
              .then(function(fileSnapshot) {
                return fileSnapshot.ref.getDownloadURL().then(url => {
                  return ad_refrence.update({
                    adImg: url,
                    storageUri: fileSnapshot.metadata.fullPath
                  });
                  document.getElementById("adSubmissionForm").reset();
                });
              });
          });
      }
    });
  }
}

// *************************** Getting Advertisments*************************\\

// Getting Ads From Database
function gettingAds() {
  if (
    location.pathname == "/pages/single.html" ||
    location.pathname == "/pages/chat.html" ||
    location.pathname == "/pages/dashboard.html"
  ) {
  } else {
    if (location.pathname == "/pages/mobiles.html") {
      viewingCategory = `Mobiles`;
      adPlace = document.getElementById("mobileAdsList");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      // let adsList = response.val();

      // });
    } else if (location.pathname == "/pages/elctrnicApplince.html") {
      viewingCategory = `Electronics and Appliances`;
      adPlace = document.getElementById("electronisAdsList");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/cars.html") {
      viewingCategory = `Cars`;
      adPlace = document.getElementById("carsAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/bikes.html") {
      viewingCategory = `Bikes`;
      adPlace = document.getElementById("bikesAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/furniture.html") {
      viewingCategory = `Furniture`;
      adPlace = document.getElementById("FurnitureAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/pets.html") {
      viewingCategory = `Pets`;
      adPlace = document.getElementById("petsAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/sportsTravel.html") {
      viewingCategory = `Books, Sports and hobbies`;
      adPlace = document.getElementById("booksAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/Fashion.html") {
      viewingCategory = `Men's Fashion`;
      adPlace = document.getElementById("fashionAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/baby&toys.html") {
      viewingCategory = `Kids`;
      adPlace = document.getElementById("kidsAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************// // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/services.html") {
      viewingCategory = `Services`;
      adPlace = document.getElementById("servicesAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/jobs.html") {
      viewingCategory = `Jobs`;
      adPlace = document.getElementById("jobsAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    } else if (location.pathname == "/pages/estate.html") {
      viewingCategory = `Real-Estate`;
      adPlace = document.getElementById("estateAdslist");

      // *************REST API***********//
      fetch(`https://olx-app111.firebaseio.com/UserAds/${viewingCategory}.json`)
        .then(resp => resp.json())
        .then(function(AdsResp) {
          for (ads in AdsResp) {
            var row = genratingAdsStructure(AdsResp[ads]);
            adPlace.innerHTML += row;
          }
        });

      // ************* DB REF *************//
      // var adsResponse = databaseRefre.child(`UserAds/${viewingCategory}`);
      // adsResponse.on("child_added", function(response) {
      //   let adsList = response.val();
      //   let row = genratingAdsStructure(adsList);
      //   adPlace.innerHTML += row;
      // });
    }
  }
}

function genratingAdsStructure(adData) {
  return `<figure onclick="adToDatabase(this)" class="snip1418">
  <img id="img-ad" class="img-src" src=${adData.adImg} alt="sample96" />
  <figcaption id="fgCaption">
    <h3>${adData.adName}</h3>
    <p>${adData.adDesc}</p>
    <div id="condition">${adData.adCondition}</div>
    <div>RS.<span id="price">${adData.adprice}</span></div>
    <div hidden id="dateAdded">${adData.Added}</div>
    <div hidden id="ad_Location">${adData.location}</div>
    <div hidden id="Seller_uid">${adData.seller.adSellerUid}</div>
    <div hidden id="Seller_Name">${adData.seller.adSellerName}</div>
    <div hidden id="Seller_Cell">${adData.seller.adSellerNo}</div>
    <div hidden id="Seller_Email">${adData.seller.adSellerEmail}</div>
    <div hidden id="ad_ID">${adData.AD_ID}</div>
  </figcaption>
</figure>`;
}

function gettingAdsToAdmin() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      myUid = user.uid;
      if (location.pathname == "/pages/dashboard.html")
        document.getElementById("responseArea").innerHTML = "";
      adPlace = document.getElementById("responseArea");

      // *************************  RestAPI *******************************//
      fetch(`https://olx-app111.firebaseio.com/UserAds/All Categories.json?orderBy="seller/adSellerUid"&equalTo="${myUid}"`)
        .then(resp => resp.json())
        .then(function(adminAdResponse) {
          for (data in adminAdResponse) {
            var row = genrateAdminAds(adminAdResponse[data]);
            adPlace.innerHTML += row;
          }
        })
        .catch(err => console.log(err));

      // ************************* DB REF*******************************//
      // databaseRefre.child(`UserAds/`).on("child_added", function(response) {
      // var Caterory = response.key;

      // databaseRefre.child(`UserAds/All Categories`).orderByChild("seller/adSellerUid").equalTo(myUid).on("child_added", function(response) {
      //     var adminAdResponse = response.val();
      //     var row = genrateAdminAds(adminAdResponse, response.key);
      //     adPlace.innerHTML += row;
      //   });
      // // });
    } else {
      console.log("Error Getting Admin Ads");
    }
  });
}

function genrateAdminAds(dataToFill, key) {
  // return `
  // <div class="container">
  //     <li class="list">
  //         <img id="img" src="${dataToFill.adImg}">
  //         <section class="list-left">
  //                 <h5 class="title">${dataToFill.adName}</h5>
  //             <h5 class="Desc">${dataToFill.adDesc}</h5>
  //             <span class="adprice">Rs.${dataToFill.adprice}</span>
  //             <p class="catpath">${dataToFill.adCondition}</p>
              
  //         </section>
  //         <section class="list-right">
  //         <button class='btn btn-danger' onclick="deleteRowAdmin('${key}',this)">X</button>
  //         </section>
  //         <div class="clearfix"></div>
  //     </li>
  // </div>`;

  return `<figure class="snip1418">
  <img id="img-ad" class="img-src" src="${
    dataToFill.adImg
  }" alt="sample96" />
  <figcaption id="fgCaption">
    <h3>${dataToFill.adName}</h3>
    <p>${dataToFill.adDesc}</p>
    <div id="condition">${dataToFill.adCondition}</div>
    <div id="price">Rs.${dataToFill.adprice}</div>

    <section style="position:absolute; right:8px; top:5px;" class="list-right">
          <button class='btn btn-danger' onclick="deleteRowAdmin('${key}',this)">X</button>
          </section>
    
  </figcaption>
</figure>`;
}

function deleteRowAdmin(key, row) {
  document
    .getElementById("responseArea")
    .removeChild(row.parentElement.parentElement.parentElement);
  var ref = database.ref(`UserAds/` + key).set({});
  document
    .getElementById("responseArea")
    .removeChild(row.parentElement.parentElement.parentElement);
}

// Saving ADS TO SERVER

function SavingAdToDb() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      let Saved_Ad_Img = $("#adImg").attr("src");
      let Saved_Ad_Title = $("#ad_title").text();
      let Saved_Ad_Desc = $("#ad_Desc").text();
      let Saved_Ad_Condition = $("#adCondition").text();
      let Saved_Ad_Price = $("#price").text();
      let Saved_Ad_Date = $("#CreatedOn").text();
      let Saved_Ad_Loca = $("#ad_loca").text();
      let Saved_SellerUid = $("#sellerUid").text();
      let Saved_SellerName = $("#sellerName").text();
      let Saved_SellerCell = $("#Phone").text();
      let Saved_SellerEmail = $("#sellerEmail").text();
      let Saved_AD_ID = $("#AD_ID").text();

      databaseRefre
        .child("SavedAds/")
        .child(myUid)
        .push()
        .set({
          Saved_Ad_Img: Saved_Ad_Img,
          Saved_Ad_Title: Saved_Ad_Title,
          Saved_Ad_Desc: Saved_Ad_Desc,
          Saved_Ad_Condition: Saved_Ad_Condition,
          Saved_Ad_Price: Saved_Ad_Price,
          Saved_Ad_Date: Saved_Ad_Date,
          Saved_Ad_Loca: Saved_Ad_Loca,
          Saved_SellerUid: Saved_SellerUid,
          Saved_SellerName: Saved_SellerName,
          Saved_SellerCell: Saved_SellerCell,
          Saved_SellerEmail: Saved_SellerEmail,
          Saved_AD_ID: Saved_AD_ID
        });

      swal({
        title: "Done",
        text: "Ad Saved Successfully",
        icon: "success"
      });
    } else {
      swal({
        title: "Login Required!",
        text: "You must Login First",
        icon: "warning",
        buttons: {
          cancel: true,
          confirm: "Login"
        }
      }).then(function(value) {
        if (value) {
          window.location.href = window.location.origin + "/pages/login.html";
        }
      });
    }
  });
}

// Getting Chats From Server

function getMyChats() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      myUid = user.uid;
      document.getElementById("responseAreaChats").innerHTML = "";

      // -==-=-=-=-=-=- FOR SELLER =-=-=-=-=-=-=-=\\
      databaseRefre.child(`Messages/`).on("child_added", function(data) {
        chatKey = data.key;
        databaseRefre.child(`Messages/${chatKey}`).child(myUid).on("child_added", function(data) {
            let chatsPlace = document.getElementById("responseAreaChats");
            chatsUIDS = data.key;
            var chatsData = data.val();
            var row = genrateAdChats(chatsData, chatsUIDS, chatKey);
            chatsPlace.innerHTML += row;
          });
      });

      // -==-=-=-=-=-=- FOR BUYER =-=-=-=-=-=-=-=\\
      databaseRefre.child(`Messages/`).on("child_added", function(data) {
        chatKey = data.key;
        databaseRefre.child(`Messages/${chatKey}`).on("child_added", function(data) {
            sellerUid_Message = data.key;
            databaseRefre.child(`Messages/${chatKey}/${sellerUid_Message}`).child(myUid).on("value", function(data) {
                let chatsPlace = document.getElementById("responseAreaChats");
                chatsUIDS = data.key;
                var chatsData = data.val();
                    var row = genrateAdChats(chatsData, chatsUIDS, chatKey);
                    chatsPlace.innerHTML += row;
              });
          });
      });
    }
  });
}

function genrateAdChats(chatsData, chatsUIDS, chatKey) {
  return `<div class="container" onclick="moveToChatRoom(this)">
  <li class="list">
      <img id="img" src="http://pronksiapartments.ee/wp-content/uploads/2015/10/placeholder-face-big.png">
      <section class="list-left">
      <h5 class="Desc">Message: ${chatsData.msgMessage}</h5>
      <p>Ad Id: 
      <span id="adChatID">${chatsData.AdID}</span>
      </p>
      <h5 class="about">Sent at: ${chatsData.msgTime}</h5>
      <div hidden id="buyerUID">${chatsUIDS}</div>
      <div hidden id="seller_UID">${chatsData.sellerUid}</div>
      <div hidden id="GetID">${chatKey}</div>
      </section>
      </li>
      </div>`;
  // <p class="Name">${chatsData}</p>
}

function getSavedAds() {
  if (location.pathname == "/pages/dashboard.html") {
    document.getElementById("savedAds").innerHTML = "";

    let SavedAdPlace = document.getElementById("savedAds");
    firebase.auth().onAuthStateChanged(function(user) {
      myUid = firebase.auth().currentUser.uid;

      //************************ RestAPI ************************//
      fetch(`https://olx-app111.firebaseio.com/SavedAds/${myUid}.json`)
        .then(resp => resp.json())
        .then(function(SavedAdsResponse) {
          for (x in SavedAdsResponse) {
            var row = genrateSavedAds(SavedAdsResponse[x]);
            SavedAdPlace.innerHTML += row;
          }
        })
        .catch(err => console.log(err));

      //************************************ DB ref  *************************************//

      // databaseRefre.child("SavedAds").child(myUid).on("child_added", function(savedAdResponse) {
      // savedAd = savedAdResponse.val();
      // var row = genrateSavedAds(savedAd);
      // SavedAdPlace.innerHTML += row;
      // });
    });
  }
}
function genrateSavedAds(savedAd) {
  return `<figure onclick="adToDatabase(this)" class="snip1418">
  <img id="img-ad" class="img-src" src="${
    savedAd.Saved_Ad_Img
  }" alt="sample96" />
  <figcaption id="fgCaption">
    <h3>${savedAd.Saved_Ad_Title}</h3>
    <p>${savedAd.Saved_Ad_Desc}</p>
    <div id="condition">${savedAd.Saved_Ad_Condition}</div>
    <div id="price">${savedAd.Saved_Ad_Price}</div>
    <div hidden id="dateAdded">${savedAd.Saved_Ad_Date}</div>
    <div hidden id="ad_loca">${savedAd.Saved_Ad_Loca}</div>
    <div hidden id="Seller_uid">${savedAd.Saved_SellerUid}</div>
    <div hidden id="Seller_Name">${savedAd.Saved_SellerName}</div>
    <div hidden id="Seller_Cell">${savedAd.Saved_SellerCell}</div>
    <div hidden id="Seller_Email">${savedAd.Saved_SellerEmail}</div>
    <div hidden id="ad_ID">${savedAd.Saved_Ad_Title}${
    savedAd.Saved_SellerName
  }</div>
  </figcaption>
</figure>`;
}
// ************************** Viewing Ad ****************************** \\

function adToDatabase(data) {
  let itemImg = data.childNodes[1].src;
  let itemTitle = data.childNodes[3].childNodes[1].innerText;
  let itemDesc = data.childNodes[3].childNodes[3].innerText;
  let itemCondition = data.childNodes[3].childNodes[5].innerText;
  let itemPrice = data.childNodes[3].childNodes[7].innerText;
  let itemDate = data.childNodes[3].childNodes[9].innerText;
  let itemLoca = data.childNodes[3].childNodes[11].innerText;
  let SellerUid = data.childNodes[3].childNodes[13].innerText;
  let SellerName = data.childNodes[3].childNodes[15].innerText;
  let SellerCell = data.childNodes[3].childNodes[17].innerText;
  let SellerEmail = data.childNodes[3].childNodes[19].innerText;
  let AD_ID = data.childNodes[3].childNodes[21].innerText;
  let hashID = `${SellerUid}_${AD_ID}_${myUid}`;

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      myUid = user.uid;

      localStorage.setItem("itemImg", itemImg);
      localStorage.setItem("itemTitle", itemTitle);
      localStorage.setItem("itemDesc", itemDesc);
      localStorage.setItem("itemCondition", itemCondition);
      localStorage.setItem("itemPrice", itemPrice);
      localStorage.setItem("itemDate", itemDate);
      localStorage.setItem("itemLoca", itemLoca);
      localStorage.setItem("SellerUid", SellerUid);
      localStorage.setItem("SellerName", SellerName);
      localStorage.setItem("SellerCell", SellerCell);
      localStorage.setItem("SellerEmail", SellerEmail);
      localStorage.setItem("AD_ID", AD_ID);
      localStorage.setItem("hashID", hashID);
      localStorage.setItem("BuyerUid", myUid);

      location.pathname = "/pages/single.html";
    } else {
      localStorage.setItem("itemImg", itemImg);
      localStorage.setItem("itemTitle", itemTitle);
      localStorage.setItem("itemDesc", itemDesc);
      localStorage.setItem("itemCondition", itemCondition);
      localStorage.setItem("itemPrice", itemPrice);
      localStorage.setItem("itemDate", itemDate);
      localStorage.setItem("itemLoca", itemLoca);
      localStorage.setItem("SellerUid", SellerUid);
      localStorage.setItem("SellerName", SellerName);
      localStorage.setItem("SellerCell", SellerCell);
      localStorage.setItem("SellerEmail", SellerEmail);
      localStorage.setItem("AD_ID", AD_ID);
      localStorage.setItem("hashID", hashID);
      localStorage.setItem("BuyerUid", "NAU");

      location.pathname = "/pages/single.html";
    }
  });
}

this.imagePlace = $("#adImg");
this.titlePlace = $("#ad_title");
this.DescPlace = $("#ad_Desc");
this.condPlace = $("#adCondition");
this.pricePlace = $("#price");
this.datePlace = $("#CreatedOn");
this.locationPlace = $("#ad_loca");
this.avatarPlace = $("#seller_pic");
this.namePlace = $("#sellerName");
this.cellPlace = $("#Phone");
this.viewsPlace = $("#views");
this.seller_Email_Place = $("#sellerEmail");
this.seller_Uid_Place = $("#sellerUid");
this.adID = $("#AD_ID");

function dbToSingle() {
  if (location.pathname == "/pages/single.html") {
    item_Img = localStorage.getItem("itemImg");
    itemTitle = localStorage.getItem("itemTitle");
    itemDesc = localStorage.getItem("itemDesc");
    itemCondition = localStorage.getItem("itemCondition");
    itemPrice = localStorage.getItem("itemPrice");
    itemDate = localStorage.getItem("itemDate");
    itemLocation = localStorage.getItem("itemLoca");
    SellerUid = localStorage.getItem("SellerUid");
    SellerName = localStorage.getItem("SellerName");
    SellerCell = localStorage.getItem("SellerCell");
    SellerEmail = localStorage.getItem("SellerEmail");
    avatar = localStorage.getItem("SellerPic");
    AD_ID_DATA = localStorage.getItem("AD_ID");
    adViews = (Math.random() * (10000 - 150) + 150).toFixed(0);

    imagePlace.attr("src", item_Img);
    titlePlace.text(itemTitle);
    DescPlace.text(itemDesc);
    condPlace.text(itemCondition);
    viewsPlace.text(adViews);
    pricePlace.text(itemPrice);
    datePlace.text(itemDate);
    locationPlace.text(itemLocation);
    // avatarPlace.attr('src', avatar);
    namePlace.text(SellerName);
    cellPlace.text(`${SellerCell}`);
    seller_Email_Place.text(SellerEmail);
    seller_Uid_Place.text(SellerUid);
    adID.text(AD_ID_DATA);

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // // Sending DATA TO DATABASE
        myUid = firebase.auth().currentUser.uid;
        if (SellerUid == "NAU" || myUid == undefined || SellerUid == myUid) {
          $("#talkToSeller").css("display", "none");
          $("#chatBtn").css("display", "none");
        } else {
          $("#talkToSeller").css("display", "block");
          $("#chatBtn").css("display", "block");
        }
      }
    });
  }
}

// ************************** Searcing Ads ****************************** \\

function onSearch() {
  const databaseRefre = firebase.database().ref();
  var searchText = $("#search").val();
  var searchTextCapital = searchText.toUpperCase();
  getCategory = $("#SearchByCategory option:selected").text();

  // For All Categories

  if (getCategory == "All Categories") {
    if (location.pathname == "/pages/search.html") {
      sessionStorage.setItem("searchQuery", searchTextCapital);
      sessionStorage.setItem("searchCategory", getCategory);
      searchComplete();
    } else {
      sessionStorage.setItem("searchQuery", searchTextCapital);
      sessionStorage.setItem("searchCategory", getCategory);
      location.pathname = "/pages/search.html";
    }
  }

  // For Specifi Category
  else {
    if (location.pathname == "/pages/search.html") {
      sessionStorage.setItem("searchQuery", searchTextCapital);
      sessionStorage.setItem("searchCategory", getCategory);
      searchComplete();
    } else {
      sessionStorage.setItem("searchQuery", searchTextCapital);
      sessionStorage.setItem("searchCategory", getCategory);
      location.pathname = "/pages/search.html";
    }
  }
}

function searchComplete() {
  let searchCondition = sessionStorage.getItem("searchCategory");
  let seachTerm = sessionStorage.getItem("searchQuery");
  document.getElementById(`searchResult`).innerHTML = "";

  //************************************ REST API  *************************************//
  adPlace = document.getElementById(`searchResult`);
  fetch(
    `https://olx-app111.firebaseio.com/UserAds/${searchCondition}.json?orderBy="adName"&startAt="${seachTerm}"`
  )
    .then(resp => resp.json())
    .then(function(searchedResponse) {
      for (data in searchedResponse) {
        var row = genratingStructure(searchedResponse[data]);
        adPlace.innerHTML += row;
      }
    });

  //************************************ DB ref  *************************************//
  // databaseRefre.child(`UserAds/${sessionStorage.getItem("searchCategory")}`).orderByChild("adName").startAt(sessionStorage.getItem("searchQuery")).on("child_added", function(data) {
  //     searchResult = document.getElementById(`searchResult`);
  //     searchResponse = data.val();
  //     let row = genratingStructure(searchResponse);
  //     searchResult.innerHTML += row;
  //   });
}

function genratingStructure(Searched) {
  return `<figure onclick="adToDatabase(this)" class="snip1418">
  <img id="img-ad" class="img-src" src=${Searched.adImg} alt="sample96" />
  <figcaption id="fgCaption">
    <h3>${Searched.adName}</h3>
    <p>${Searched.adDesc}</p>
    <div id="condition">${Searched.adCondition}</div>
    <div>RS.<span id="price">${Searched.adprice}</span></div>
    <div hidden id="dateAdded">${Searched.Added}</div>
    <div hidden id="ad_loca">${Searched.location}</div>
    <div hidden id="Seller_uid">${Searched.seller.adSellerUid}</div>
    <div hidden id="Seller_Name">${Searched.seller.adSellerName}</div>
    <div hidden id="Seller_Cell">${Searched.seller.adSellerNo}</div>
    <div hidden id="Seller_Email">${Searched.seller.adSellerEmail}</div>
    <div hidden id="ad_ID">${Searched.AD_ID}</div>
  </figcaption>
</figure>`;
}
