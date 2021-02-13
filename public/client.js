'use strict';

// クライアントからサーバーへの接続要求
const socket = io.connect();

let room_state = false;

// 接続時の処理
socket.on('connect', () => {
    console.log('connect');
});

//メッセージの送信用関数定義
const emit = function () {
  if ($("#message_text").val() != "") {
    socket.emit("message", $("#message_text").val());
    $("#message_text").val("");
  }
};

// サーバーからのメッセージ拡散に対する処理
socket.on("message", function (strMessage) {
    // 拡散されたメッセージをメッセージリストに追加
    $("#message_list").prepend($("<li>").text(strMessage));
});

//メッセージボックスでのenter
//テキストボックスとボタンの動作（13はenterキー）
$("#message_text").keypress(function (event) {
  if (event.which === 13) {
    emit();
  }
});

//メッセージ送信ボタン
$("#message_send").click(function () {
	emit();
});

//入退室
$("#room_in_out").click(function () {
  let selectRoom = $("#select_rooms").val();
  room_state = !room_state;

  if (room_state) {
    socket.emit("room_in", { room: selectRoom });
    //部屋選択UI
    $("#room_in_out").text("out");
    $("#select_rooms").prop("disabled", true);

    //メッセージ送信UI
    $("#message_text").prop("disabled", false);
    $("#message_send").prop("disabled", false);

    //メッセージリストを削除
    $("#message_list").empty();
  } else {
    socket.emit("room_out");
    //部屋選択UI
    $("#room_in_out").text("in");
    $("#select_rooms").prop("disabled", false);

    //メッセージ送信UI
    $("#message_text").prop("disabled", true);
    $("#message_send").prop("disabled", true);

    //メッセージリストを削除
    $("#message_list").empty();
  }
});
