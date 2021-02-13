'use strict';

// モジュール
const os	   = require('os');
const crypto 　= require("crypto");
const http     = require('http');
const express  = require('express');
const socketIO = require('socket.io');
const moment   = require('moment');

// オブジェクト
const app    = express();
const server = http.Server(app);
const io     = socketIO(server);

// ポート番号	
const PORT = process.env.PORT || 3000;

  // グローバル変数
let MEMBER_COUNT = 0; // ユーザー数

// //httpのレスポンス
// app.get("/", (req, res) => {
//   res.sendFile(path.join(process.cwd(), "public", "index.html"));
// });

//  ipアドレス表示
console.log(getLocalAddress());
function getLocalAddress() {
    let ifacesObj = {}
    ifacesObj.ipv4 = [];
    ifacesObj.ipv6 = [];
    let interfaces = os.networkInterfaces();

    for (let dev in interfaces) {
        interfaces[dev].forEach(function(details){
            if (!details.internal){
                switch(details.family){
                    case "IPv4":
                        ifacesObj.ipv4.push({name:dev, address:details.address});
                    break;
                    case "IPv6":
                        ifacesObj.ipv6.push({name:dev, address:details.address})
                    break;
                }
            }
        });
    }
    return ifacesObj;
};

// 接続単位の処理
io.on('connection', (socket) => {
	//部屋設定
	let roomId = "";
	//ユーザー名設定
	const time = new Date();
	const md5 = crypto.createHash("MD5");
	md5.update(time.toString());
	let username = md5.digest("hex");

    // 接続ｍｓｇ
    console.log('connection');

	//部屋に入る
	socket.on("room_in", (data) => {
		socket.join(data.room);
		roomId = data.room;			//部屋番号を退避
		io.to(roomId).emit("message", `${username}が入室`);
	});

	//部屋を出る
	socket.on("room_out", () => {
	    io.to(roomId).emit("message", `${username}が退室`);
	    socket.leave(roomId);
	});

	//メッセージ受信時の処理
	socket.on("message", (strMessage) => {
        console.log('new message', strMessage);

        // 同じ部屋のクライアント全員に送信
        io.to(roomId).emit("message", strMessage);
	});

    // 切断時の処理
    socket.on('disconnect', () => {
        console.log('disconnect');
    });

});

// 公開フォルダの指定
app.use(express.static(__dirname + '/public'));

// サーバーの起動
server.listen(PORT, () => {
    console.log('server starts on port: %d', PORT,Date(Date.now()));
});
// クライアントからブラウザでhttp://localhost:3000 にアクセスすると、上記公開フォルダ
// のindex.htmlが表示される。（パスだけで接続しに行くとindex.htmlを探して表示）
// サーバーとクライアントの接続が確立すると、下記イベントが発生する。
//・ サーバー側　　 ： connection イベント（/server.js に記載）
//・ クライアント側 ： connect イベント（/public/client.js に記載）


