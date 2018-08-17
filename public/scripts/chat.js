var authentication = firebase.auth();

let myEmail;
let myName;
let my_Uid;
let conversationIDFromDashBoard;


//***************************** Event Listeners************************\\

$("#sendMsg").on("click", function() {
  sendMessages();
});

$("#backArrow").on("click", function() {
  event.preventDefault()
  history.go(-1)
});


// ****************************GLOBALS **************************** \\
// For Buyer
sellerCell = localStorage.getItem("SellerCell");
SellerEmail = localStorage.getItem("SellerEmail");
SellerName = localStorage.getItem("SellerName");
sellerUid = localStorage.getItem("SellerUid");
adChatID = localStorage.getItem("AD_ID");
buyerUid = localStorage.getItem("BuyerUid");
get_ID_conversation = localStorage.getItem("hashID");


// For Seller
let buyerUIDFromDashBoard;
let adChatIDFromDashBoard;
let GetIDFromDashBoard;
let SellerUIDFromDashBoard = localStorage.getItem("sellerUIDFromDashBoard");

document.addEventListener("DOMContentLoaded", function() {
  buyerUIDFromDashBoard = localStorage.getItem("buyerUIDFromDashBoard");
  adChatIDFromDashBoard = localStorage.getItem("adChatIDFromDashBoard");
  $(`#sellerEmail`).text(SellerEmail);
  firebase.auth().onAuthStateChanged(function(user) {
    if ((user) && (location.pathname == "/pages/chat.html")) {
      my_Uid = user.uid;
      if (my_Uid == buyerUIDFromDashBoard) {
        gettingMsgFromDatabaseForBuyer();
      }else if (my_Uid == sellerUid) {
        gettingMsgFromDatabaseForSeller();
      }else if(my_Uid == buyerUid ){
        gettingMsgFromDatabaseForBuyer();
      }else if(my_Uid == SellerUIDFromDashBoard){
        gettingMsgFromDatabaseForSeller();
      }
    }
  });
});

// ************************** Chat to vendor *************************** \\

function moveToChatRoom(daya) {
  buyerUIDFromDashBoard = daya.childNodes[1].childNodes[3].childNodes[7].innerText;
  adChatIDFromDashBoard = daya.childNodes[1].childNodes[3].childNodes[3].childNodes[1].innerText;
  sellerUIDFromDashBoard = daya.childNodes[1].childNodes[3].childNodes[9].innerText;
  MessagesIDFromDashBoard = daya.childNodes[1].childNodes[3].childNodes[11].innerText;
  
  // adCategory = $("#").text();

  localStorage.setItem("buyerUIDFromDashBoard", buyerUIDFromDashBoard);
  localStorage.setItem("adChatIDFromDashBoard", adChatIDFromDashBoard);
  localStorage.setItem("sellerUIDFromDashBoard", sellerUIDFromDashBoard);
  localStorage.setItem("MessagesIDFromDashBoard", MessagesIDFromDashBoard);
  sellerEmail = $("#sellerEmail").text();

  location.pathname = "/pages/chat.html";
}

// GETS MESSAGES FROM SERVER & SERVES
function gettingMsgFromDatabaseForSeller() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var msgPlace = document.getElementById("messagesArea");
      buyerUIDFromDashBoard = localStorage.getItem("buyerUIDFromDashBoard");
      adChatIDFromDashBoard = localStorage.getItem("adChatIDFromDashBoard");
      my_Uid = user.uid;
      conversationIDFromDashBoard = `${my_Uid}_${adChatIDFromDashBoard}_${buyerUIDFromDashBoard}`;

      //const combineKeyValue1 = adChatID+"_"+sellerUid;
      databaseRefre.child("Chats/").orderByChild("get_ID_conversation").equalTo(conversationIDFromDashBoard).limitToLast(15).on("child_added", function(chatResp) {
         var chatResponse = chatResp.val();
          if (chatResponse.sentFrom == my_Uid) {
            var initials = my_Uid.charAt(0);
            var msgs = genrateMyMsgs(chatResponse, initials);
            msgPlace.innerHTML += msgs;
          } else {
            var initials = chatResponse.sentFrom.charAt(0);
            var msgs = genrateOtherMsgs(chatResponse, initials);
            msgPlace.innerHTML += msgs;
          }
        });
    }
  });
}


function gettingMsgFromDatabaseForBuyer() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var msgPlace = document.getElementById("messagesArea");
      buyerUID = localStorage.getItem("BuyerUid");
      adChatID = localStorage.getItem("AD_ID");
      sellerUid = localStorage.getItem('SellerUid');
      ChatsID = `${sellerUid}_${adChatID}_${buyerUID}`
      my_Uid = user.uid;
      

      //const combineKeyValue1 = adChatID+"_"+sellerUid;
      databaseRefre.child("Chats").orderByChild("get_ID_conversation").equalTo(ChatsID).limitToLast(15).on("child_added", function(chatResp) {
          var chatResponse = chatResp.val();
          if (chatResponse.sentFrom == my_Uid) {
            var initials = my_Uid.charAt(0);
            var msgs = genrateMyMsgs(chatResponse, initials);
            msgPlace.innerHTML += msgs;
          } else {
            var initials = chatResponse.sellerUid.charAt(0);
            var msgs = genrateOtherMsgs(chatResponse, initials);
            msgPlace.innerHTML += msgs;
          }
        });
    }
  });
}

// MESSAGE FORMAT FOR OTHERS
function genrateOtherMsgs(msgs, avatar) {
  return `<li class="msg_id">
      <div>
          <div id="msg_avatar">${avatar}</div>
          <div id="user_msg">${msgs.msgMessage}
          <div id="msg_time">${msgs.msgTime}</div>
          </div>
      </div>
      </li>`;
}

// MESSAGE FORMAT FOR ME
function genrateMyMsgs(msgs, avatar1) {
  return `<li class="my_msg_id">
      <div>
          <div id="my_avatar">${avatar1}</div>
          <div id="my_msg">${msgs.msgMessage}
          <div id="my_msg_time">${msgs.msgTime}</div>
          </div>
      </div>
      </li>`;
}



//*************************** Sending MESSAGE TO USER *************************** \\
function sendMessages() {
  firebase.auth().onAuthStateChanged(function(response) {
    if (response) {
      myEmail = response.email;
      my_Uid = response.uid;
      if ((sellerUid == my_Uid) || (SellerUIDFromDashBoard == my_Uid)) {
        sellerReply();
      } else {
        pushingMessagesToDatabase();
      }
    } else {
      alert("You Must Login First");
      location.pathname = "/pages/single.html";
    }
  });
}

function sellerReply() {
  my_Uid = authentication.currentUser.uid;
  msg = $("#message_textBox").val();

  // ****************Chat Messages For chatting and storing messages ****************\\
  var userMsg = databaseRefre.child("Chats/").push();
  
  // var userMsg = database.ref(`Messages`).push();
  userMsg.set({
    msgMessage: msg,
    sentFrom: my_Uid,
    To: localStorage.getItem('buyerUIDFromDashBoard'),
    msgTime: new Date().toLocaleTimeString(),
    AdID: adChatIDFromDashBoard, // to get messages for each ad seperatly
    sellerUid: my_Uid, // To only Get Ads for my account
    get_ID_conversation: conversationIDFromDashBoard
  });
}

// SENDING MESSAGE TO DB
function pushingMessagesToDatabase() {
  my_Uid = authentication.currentUser.uid;
  msg = $("#message_textBox").val();

  let messageID = localStorage.getItem('SellerUid')  + '_' + localStorage.getItem('AD_ID') ;
  let ChatsID = localStorage.getItem('SellerUid')  + '_' + localStorage.getItem('AD_ID') + '_' + localStorage.getItem('BuyerUid');

  // For Making A seprate Message Place to get to My Chats Dashboard
  databaseRefre.child(`Messages/${messageID}`).child(sellerUid).child(my_Uid).set({
      msgMessage: msg,
      sentFrom: my_Uid,
      msgTime: new Date().toLocaleTimeString(),
      AdID: adChatID, // to get messages for each ad seperatly
      sellerUid: sellerUid,// To only Get Ads for my account
      // get_ID_conversation: messageID
    });


  // Chat Messages For chatting and storing messages
  var userMsg = databaseRefre.child("Chats/").push();
  // var userMsg = database.ref(`Messages`).push();
  userMsg.set({
    msgMessage: msg,
    sentFrom: my_Uid,
    msgTime: new Date().toLocaleTimeString(),
    AdID: adChatID, // to get messages for each ad seperatly
    sellerUid: sellerUid, // To only Get Ads for my account
    get_ID_conversation: ChatsID,
    To: sellerUid
    // buyerUID:Uid,
    // AD_ID: adChatID, //Write Ad ID here
    // sellerUID:sellerUid,
  });
}

