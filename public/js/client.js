'use strict';

// クライアントからサーバーへの接続要求
const socket = io.connect();

let userName = null;
let userNo = 0;
let selectRoom = null;
let memArray = new Array(2);

let roomState = false;

document.getElementById("view_canvas").style.display ="none";

// 接続時の処理
socket.on('connect', () => {
    console.log('connect');
    
    //部屋選択UI
    $("#room_in_out").text("in");
    $("#room_list").prop("disabled", false);
    $("#username_text").prop("disabled", false);

    //メッセージ送信UI
    $("#message_text").prop("disabled", true);
    $("#message_send").prop("disabled", true);

    //メッセージリストを削除
    $("#message_list").empty();

    roomState = false;

    selectRoom = $("#room_list").val();  
    socket.emit("selectRoom", { room: selectRoom });　　　　//サーバへルーム情報（ユーザリスト）の送信依頼
});

//メッセージの送信用関数定義
const sendMessage = function () {
  if ($("#message_text").val() != "") {
    socket.emit("message", $("#message_text").val());
    $("#message_text").val("");
  }
};

// サーバーからのメッセージ拡散に対する処理
socket.on("message", function (strMessage) {
  $("#message_list").prepend($("<li>").text(strMessage));　// 拡散されたメッセージをメッセージリストに追加
});

//セレクトルームによる部屋メンバリスト更新
$("#room_list").change(function () {
  selectRoom = $("#room_list").val();  
  socket.emit("selectRoom", { room: selectRoom });　　　　//サーバへルーム情報（ユーザリスト）の送信依頼
  $("#message_list").empty();  　　　　　　　　　　　　　　　//メッセージリストを削除
});

//サーバーからのユーザリスト配信に対する処理
socket.on("renewUserList", function (data) {
    $("#member_list").empty();
    memArray = JSON.parse(data);
    for(let i=0; i < memArray.length; i++){
      if(memArray[i] != null){
        $("#member_list").prepend($("<li>").text(memArray[i]));
      }
    }
});

//メッセージボックスでのenter
//テキストボックスとボタンの動作（13はenterキー）
$("#message_text").keypress(function (event) {
  if (event.which === 13) {
    sendMessage();
  }
});

//メッセージ送信ボタン
$("#message_send").click(function () {
	sendMessage();
});

//入退室
$("#room_in_out").click(function () {
  selectRoom = $("#room_list").val();
  roomState = !roomState;

  if (roomState) {
    userName = $("#username_text").val();
    socket.emit("inRoom", { room: selectRoom ,name: userName});
  } else {
    socket.emit("outRoom");
    lobbyWaitForEntry();
  }
});

socket.on("inRoomOk", function (data) {
    lobbyEntering();
    $("username_text").val(data.name);
    userName = data.name;
    userNo = data.no;
});

socket.on("inRoomNg", function (strMessage) {
    //in-outボタンはinのまま
    roomState = false;
    lobbyWaitForEntry();
    //ngmsg表示
    $("#message_list").prepend($("<li>").text(strMessage));
});

socket.on("dismissRoom", function () {
    //in-outボタンはinのまま
    roomState = false;
    socket.emit("outRoom");
    lobbyWaitForEntry();
});

//ゲームスタート
$("#game_start").click(function () {
  document.getElementById("view_login").style.display ="none";
  document.getElementById("view_canvas").style.display ="block";
  initStage(memArray);
});

socket.on("pieceControl", function (data) {
  let target = judge.playerList[data.playerNo].children[data.pieceNo];
  target.backupPointX = data.backupPointX;
  target.backupPointY = data.backupPointY;
  target.x = data.x;
  target.y = data.y;
  target.alpha = data.alpha;
  target.moving = data.moving;
  target.nextX = data.nextX;
  target.nextY = data.nextY;
  target.distance = data.distance;
  target.radians = data.radians;
  target.dx = data.dx;
  target.dy = data.dy;
  target.accx = data.accx;
  target.accy = data.accy;

  target.actPiece();
});

//ゲーム終了
const endGame = function () {
  document.getElementById("view_login").style.display ="block";
  document.getElementById("view_canvas").style.display ="none";

  roomState = false;
  socket.emit("serverDismissRoom");    //!!一人づつ抜けると、抜ける前にゲームスタートされる懸念あり。
  lobbyWaitForEntry();
}

const lobbyEntering = function () {
      //部屋選択UI
    $("#room_in_out").text("out");
    $("#room_list").prop("disabled", true);
    $("#username_text").prop("disabled", true);

    //メッセージ送信UI
    $("#message_text").prop("disabled", false);
    $("#message_send").prop("disabled", false);

    //メッセージリストを削除
    $("#message_list").empty();
}

const lobbyWaitForEntry = function () {
    //部屋選択UI
    $("#room_in_out").text("in");
    $("#room_list").prop("disabled", false);
    $("#username_text").prop("disabled", false);

    //メッセージ送信UI
    $("#message_text").prop("disabled", true);
    $("#message_send").prop("disabled", true);

    //メッセージリストを削除
    $("#message_list").empty();
}


