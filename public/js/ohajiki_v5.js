window.addEventListener('load',init);
function init() {
	const canvasElement = document.getElementById("myCanvas");
	stage = new createjs.Stage(canvasElement);
	cns_stageWidth = canvasElement.width;
	cns_stageHeight = canvasElement.height;

	//サウンド定義
	createjs.Sound.registerSound("./sounds/hitsound.mp3", "hitsound");
	createjs.Sound.registerSound("./sounds/wallsound.mp3", "wallsound");
	createjs.Sound.registerSound("./sounds/destructionsound.mp3", "destruction");
	createjs.Sound.registerSound("./sounds/mizudobon.mp3", "mizusound");

	// タッチ操作をサポートしているブラウザーならばタッチ操作を有効にします。
	if(createjs.Touch.isSupported() == true){
 		createjs.Touch.enable(stage);
	}

	createjs.Ticker.addEventListener("tick",stage); //自動更新を有効にする

	//ブラウザの画面更新に適したタイミング「RAF」は１秒間に６０回発生する。60fpsを実現
	// createjs.Ticker.timingMode = createjs.Ticker.RAF; //滑らかに

	//１秒間に更新するフレーム数を指定。デフォルトは２４fps
	createjs.Ticker.framerate = 40;
}

//自分の部屋のユーザリストを受け取る。自分のplayerNoはグローバルのuserNoをつかう。
function initStage(argUserList) {
	// verとか書かないとglobal変数
	cns_players = argUserList.length;		//プレイヤー数
	cns_pieces = 3;         //駒の数
	cns_speed = 3;         //速さ係数（fps60のとき1。fpsが小さいと係数は大きくする必要がある）
	cns_friction = 3 / 50;  //摩擦係数（fps60のとき1/50。fpsが小さいと係数は大きくする必要がある）
	cns_reflection = 0.9      //反発係数
	cns_duration = 1000;    //teenの期間　

	cns_fieldWidth = 1001;
	cns_fieldHeight = 1001;
	cns_fieldleft = -500;
	cns_fieldright = 500;
	cns_fieldtop = -500;
	cns_fieldbottom = 500;
	cns_fieldsidemargin = 50;
	cns_fieldvertmargin = 50;

	field = new createjs.Container();
	stage.addChild(field); 

	info = new createjs.Container();
	stage.addChild(info);

    // 審判を作成
    judge = new Judge();

	//背景を作成 xy座標をfieldの左上にして背景登録
	background = new Background(cns_fieldleft,cns_fieldtop,0);
	field.addChild(background); //背景
	//マウスポインタの座標表示用
	background.XYinfo =  new createjs.Text("", "14px sans-serif", "GhostWhite");
	background.XYinfo.text = "X:" + (stage.mouseX - field.x) + "  Y:" + (stage.mouseX - field.x);
	background.XYinfo.textAlign = "left";
	background.XYinfo.textBaseline = "top";
	background.XYinfo.x = cns_stageWidth - 200;
	background.XYinfo.y = cns_stageHeight　- 30;
	background.XYinfo.shadow = new createjs.Shadow("#000000", 3, 3, 5);
	background.XYinfo.cache(-2,-2,200,30);
	info.addChild(background.XYinfo);

	// structureの生成 constructor(arg_x,arg_y,arg_width,arg_height,arg_image,arg_i)
	field.addChild(new Structure(-170,-230,161,159,"./image/pyramid.png",0));

	// zoneの生成 constructor(arg_x,arg_y,arg_H_radius,arg_V_radius,arg_i)
	field.addChild(new Zone(-400,-450,350,400,20));
	field.addChild(new Zone(210,-270,280,300,80));
	field.addChild(new Zone(50,50,300,400,80));
	field.addChild(new Zone(150,150,250,300,-30));

    // playerを作成
    for (let i = 0; i < cns_players; i++){
    // playerを描画
	    field.addChild(new Player(i,argUserList[i],90 * i));
	}
	
	//stage の描画を更新
	stage.update();	

	judge.changeTurn();
}

function clearStage() {
	stage.removeChild(field); 
	stage.removeChild(info);

	endGame();
}

class Player extends createjs.Container{
	constructor(arg_playerno,arg_playername,arg_hue){
		super();
		//playerパラメータ
		this.playerNo = arg_playerno;
		this.playerName = arg_playername;
		this.live = true;
		this.currentPiece = 0;
		//piece
		this.pieceExistFlg = []; //0:消滅　1:存在
    	// ★をｎ個作成
		for (let i = 0; i < cns_pieces - 1; i++) {
	        // HSLカラーを算出
	        // let hue = 360 * Math.random();
	        let peak = i + 4;
	        let hue = arg_hue + 18 * Math.random();
	        let color = "hsl(" + hue + ", 90%, 50%)";
	        // let x = (cns_fieldWidth - 20) * Math.random() - 490;   //壁から10pix離す
	        // let y = (cns_fieldHeight - 20) * Math.random() - 490;  //壁から10pix離す
	        let x = (cns_fieldWidth - 60) / (cns_pieces + 1) * (i + 1) - cns_fieldWidth / 2 + 30; 
	        let y = (cns_fieldHeight - 60) / (cns_players - 1) * this.playerNo - cns_fieldHeight / 2 + 30;
			let myStar = new MyStar(color,x,y,i,peak);
			this.addChild(myStar);
			this.pieceExistFlg[i] = 1;
		}

		// キング作成
	    let hue = arg_hue + 18 * Math.random();
	    let color = "hsl(" + hue + ", 100%, 50%)";
	    // let x = (cns_fieldWidth - 40) * Math.random() - 480;   //壁から20pix離す
	    // let y = (cns_fieldHeight - 40) * Math.random() - 480;  //壁から20pix離す
        let x = (cns_fieldWidth - 60) / (cns_pieces + 1) * cns_pieces - cns_fieldWidth / 2 + 30; 
        let y = (cns_fieldHeight - 60) / (cns_players - 1) * this.playerNo - cns_fieldHeight / 2 + 30;
		let myKing = new MyKing(color,x,y,cns_pieces - 1,6);
		this.addChild(myKing);
		this.pieceExistFlg[cns_pieces - 1] = 1;

		// 審判に登録
		judge.addPlayer(this);
		this.judge = judge;
	}
}

class Judge{
	constructor(){
		this.playerList = [];
		this.currentPlayer = -1;

		this.score = [];
		this.currentscore = null;

		//0:試合中　1:操作終了　2:試合終了
		//judgeでwinnerが決まったら一旦操作終了とする。
		//操作終了となったら、駒操作不可とする。（hitした他方のpieceから呼ばれたjudge,または運動中の駒がhitした場合に呼ばれたjudgeでdrawとなる可能性あり）
		//操作終了となり、かつ運動中の駒がなくなったら、試合終了。→背景クリックでロビーに戻る。
		this.end = 0; 

		this.structureCount = 0;
		this.structureList = [];
		this.structureExistFlg = []; //0:消滅　1:存在

		this.zoneCount = 0;
		this.zoneList = [];
	}

	getcurrentPiece(){
		let i = this.playerList[this.currentPlayer].currentPiece;
		i += 1;
		if(i >= cns_pieces){
			i = 0;
		}
		while(this.playerList[this.currentPlayer].pieceExistFlg[i] != 1){
			i += 1;
			if(i >= cns_pieces){
				i = 0;
			}
		}
		this.playerList[this.currentPlayer].currentPiece = i;
		return this.playerList[this.currentPlayer].children[i];
	}

	addPlayer(arg_player){
		this.playerList[arg_player.playerNo] = arg_player;
	// スコアに表示
	    this.score[arg_player.playerNo] =  new createjs.Text("", "14px sans-serif", "GhostWhite");
//		this.score[this.playerCount - 1].text = "Player" + this.playerCount + ": " + judge.playerList[this.playerCount - 1].pieceExistFlg.reduce((p,c) => p += c,0) + "p";
		this.score[arg_player.playerNo].text = arg_player.playerName + ": " + judge.playerList[arg_player.playerNo].pieceExistFlg.reduce((p,c) => p += c,0) + "p";
	    this.score[arg_player.playerNo].textAlign = "left";
	    this.score[arg_player.playerNo].textBaseline = "top";
	    this.score[arg_player.playerNo].x = (cns_stageWidth - 20) / cns_players * (arg_player.playerNo) + 10;
	    this.score[arg_player.playerNo].y = 10;
		this.score[arg_player.playerNo].shadow = new createjs.Shadow("#000000", 3, 3, 5);
		this.score[arg_player.playerNo].cache(-2,-2,100,30);
	    info.addChild(this.score[arg_player.playerNo]);
	}

	addStructure(arg_structure){
		this.structureExistFlg[this.structureCount] = 1;
		this.structureList[this.structureCount] = arg_structure;
		this.structureCount += 1;
	}

	addZone(arg_zone){
		this.zoneList[this.zoneCount] = arg_zone;
		this.zoneCount += 1;
	}

	changeTurn(){
		for (let i = 0; i < cns_players; i++){
			//子要素にマウスイベントが伝搬されないようにする。
			this.playerList[i].mouseChildren = false;
		}

		this.currentPlayer += 1;
		if(this.currentPlayer >= cns_players){
			this.currentPlayer = 0;
		}
		while(!this.playerList[this.currentPlayer].live){
			this.currentPlayer += 1;
			if(this.currentPlayer >= cns_players){
				this.currentPlayer = 0;
			}
		}

		if(this.currentPlayer == userNo){
			this.playerList[this.currentPlayer].mouseChildren = true;
		}
//
		info.removeChild(this.currentscore);
		this.currentscore = this.score[judge.currentPlayer].clone();
		this.currentscore.shadow = null;
		this.currentscore.color = "hsl(" + judge.currentPlayer*99 + ", 90%, 50%)";
		this.currentscore.outline = 1;
		this.currentscore.alpha = 0.7;
		info.addChild(this.currentscore);
	}

	judgeScore(){
		let liveplayers = 0;
		let winner = 0;
		for (let i = 0; i < cns_players; i++) {
			this.score[i].uncache();
			let p_no = judge.playerList[i].pieceExistFlg.reduce((p,c) => p += c,0);
			//全駒が生きていない場合、または最後の駒＊キングが生きてない場合、負け。
			if(p_no == 0 || judge.playerList[i].pieceExistFlg[cns_pieces - 1] == 0){
				this.score[i].text = judge.playerList[i].playerName + ": lose";
				this.score[i].color = "DarkGray";
				judge.playerList[i].live = false;
			}else{
//				this.score[i].text = "Player" + (i+1) + ": " + p_no + "p";
				this.score[i].text = judge.playerList[i].playerName + ": " + p_no + "p";
				liveplayers += 1;
				winner = i;
			}
			this.score[i].cache(-2,-2,100,30);
			if(i == judge.currentPlayer){
				this.currentscore.text = this.score[i].text;
			}
		}
		if(liveplayers == 1){
//			this.result =  new createjs.Text("Player" + winner + "  WIN!!", "24px sans-serif", "GhostWhite");
			if(userNo == winner){
				this.result =  new createjs.Text("YOU WIN!!", "24px sans-serif", "GhostWhite");
			}else{
				this.result =  new createjs.Text("YOU LOSE..", "24px sans-serif", "GhostWhite");
			}
			this.result.textAlign = "center";
	    	this.result.textBaseline = "top";
	    	this.result.x = cns_stageWidth / 2;
	    	this.result.y = cns_stageHeight / 2 - 20;
   			this.result.shadow = new createjs.Shadow("#000000", 3, 3, 5);
	    	info.addChild(this.result);
	    	this.end = 1; //操作終了
   			for (let i = 0; i < cns_players; i++){
				//子要素にマウスイベントが伝搬されないようにする。
				this.playerList[i].mouseChildren = false;
			}
		}

		if(liveplayers == 0){
			this.result.text = "DRAW";
	    	this.end = 1; //操作終了
   			for (let i = 0; i < cns_players; i++){
				//子要素にマウスイベントが伝搬されないようにする。
				this.playerList[i].mouseChildren = false;
			}
			// info.removeChild(this.result);
			// this.result =  new createjs.Text("DRAW", "24px sans-serif", "GhostWhite");
	    	// this.result.textAlign = "center";
	    	// this.result.textBaseline = "top";
	    	// this.result.x = cns_stageWidth / 2;
	    	// this.result.y = cns_stageHeight / 2 - 20;
   			// this.result.shadow = new createjs.Shadow("#000000", 3, 3, 5);
	    	// info.addChild(this.result);
		}
	}

	judgeHit(arg_piece){
		let ownplayer = arg_piece.parent.playerNo;
		let ownpiece = arg_piece.pieceNo;
	//プレイヤー数分　繰り返し
		for (let i = 0; i < judge.playerList.length; i++){
	//自プレイヤーの駒には当たらないうようにする
	//		if(i != ownplayer){
			    let xplayer = judge.playerList[i];
	//駒数分　繰り返し
	//		    for(let j = 0; j < xplayer.children.length; j++){
	//駒数分　繰り返し ← bullet は見に行かないように変更
			    for(let j = 0; j < cns_pieces; j++){
	//自分（駒）には当たらないうようにする
			    	if(i != ownplayer || j != ownpiece){
	// （重なっている間中）同じ駒に連続して当たらないように、直前にhitした駒には当たらないよう判定
			    	if(!arg_piece.hitpiece || i != arg_piece.hitplayerNo || j != arg_piece.hitpieceNo){
	// 検査対象の他pieceが、生存中であり、かつ移動中、または静止中であること
			    	if(xplayer.pieceExistFlg[j] == 1  &&  xplayer.children[j].moving <= 1){
			    		let xpiece = xplayer.children[j];
				    	if(Math.abs(arg_piece.x - xpiece.x) < arg_piece.radius + xpiece.radius){
						if(Math.abs(arg_piece.y - xpiece.y) < arg_piece.radius + xpiece.radius){
    // 引数の駒と「i番目playerのj番目の駒」の相対座標を求める
	//				    let xpoint = arg_piece.localToLocal(0, 0, xpiece);
    // 引数の駒と「i番目playerのj番目の駒」があたっているかを調べる
	//				    let isHit = xpiece.hitTest(xpoint.x, xpoint.y);
	//		    		if (isHit == true) {

     	  				    let xpoint = arg_piece.localToLocal(0, 0, xpiece);
						    let xdistance = Math.sqrt(xpoint.x**2 + xpoint.y**2);
	//					let xdistance = Math.sqrt((arg_piece.x - xpiece.x)**2 + (arg_piece.y - xpiece.y)**2);

							if (xdistance < arg_piece.radius + xpiece.radius){
			    		//	xpiece.hitAction(xpoint);
			    		//  初速を求める際は重量を考慮していないが、衝突時の計算は重量を考慮し、下記の通り計算する。
			    		//　F1 = m1 * v1**2 , v1 = sqrt(F1 / m1) 衝突時の反力fは　f1 = F1 * m2/(m1+m2)  , f1 = m1 * v2**2。
			    		//　m1 * v2**2 = F1 * m2/(m1*m2) = m1 * v1**2 * m2/(m1*m2)
			    		//  v2**2 = v1**2 * m2/(m1*m2)
			    		//  v2 = sqrt(v1**2 * m2/(m1*m2)) = v1 * sqrt(m2/(m1*m2))
			    		//　単純化のため、 v2 = v1 * m2/(m1*m2)　とする。
			    		//　反発係数　
								let temp_radians = Math.atan2((xpiece.y - arg_piece.y),(xpiece.x - arg_piece.x));
								let diff_radians = arg_piece.radians - temp_radians;
								let temp_pow = Math.sqrt(arg_piece.dx**2 + arg_piece.dy**2) * Math.cos(diff_radians);
								let temp_dx = Math.cos(temp_radians) * temp_pow;
								let temp_dy = Math.sin(temp_radians) * temp_pow;
								let temp_reflection = 2 * xpiece.weight / (arg_piece.weight + xpiece.weight);

								let temp_radians2 = Math.atan2((arg_piece.y - xpiece.y),(arg_piece.x - xpiece.x));
								let diff_radians2 = xpiece.radians - temp_radians2;
								let temp_pow2 = Math.sqrt(xpiece.dx**2 + xpiece.dy**2) * Math.cos(diff_radians2);
								let temp_dx2 = Math.cos(temp_radians2) * temp_pow2;
								let temp_dy2 = Math.sin(temp_radians2) * temp_pow2;
								let temp_reflection2 = 2 * arg_piece.weight / (arg_piece.weight + xpiece.weight);

				    			arg_piece.hitAction(temp_dx,temp_dy,temp_dx2,temp_dy2,temp_reflection,xpiece);

				    	//xpieceが静止中の場合は、xpiece側のhitActionも実施。　＋　bulletの場合はxpiece側から衝突を検知できないためココでcall
				    			if (xpiece.moving == 0 || arg_piece.pieceNo >= cns_pieces){
				    				xpiece.hitAction(temp_dx2,temp_dy2,temp_dx,temp_dy,temp_reflection2,arg_piece);
				    			}

				    			let effe = new Effect(arg_piece.x + (xpiece.x - arg_piece.x) / 2,arg_piece.y + (xpiece.y - arg_piece.y) / 2);
		    					field.addChild(effe);
		    					createjs.Sound.play("hitsound");

//debug用　駒の座標を表示　＊＊＊＊＊＊			    			
//			    				foot3Elm.innerHTML = "x:" + xpiece.x;
//				    			foot4Elm.innerHTML = "y:" + xpiece.y;
//			    				foot5Elm.innerHTML = "aaaa";
//			    				foot6Elm.innerHTML = "bbbb";
			    			}
	 					}
	 					}
			    	}
			    	}
			    	}
			    }
			//}
		}
	}

	judgeHitStr(arg_piece){
	//	let ownplayer = arg_piece.parent.playerNo;
	//	let ownpiece = arg_piece.pieceNo;
	//構造物数分　繰り返し
		for (let i = 0; i < judge.structureList.length; i++){
			if (this.structureExistFlg[i] == 1){
			    let xstructure = judge.structureList[i];
	// （重なっている間中）同じ構造物に連続して当たらないように、直前にhitした構造物には当たらないよう判定
	//　とおもったが、重なってる以外でも同じ障害物に連続で当たるはある。
			// if(!arg_piece.hitstructure || i != arg_piece.hitstructureNo){
    // 引数の駒と「i番目playerのj番目の駒」の相対座標を求める
				let xpoint = arg_piece.localToLocal(0, 0, xstructure);
    // 引数の駒と「i番目playerのj番目の駒」があたっているかを調べる
				let isHit = xstructure.hitTest(xpoint.x, xpoint.y);
	    		if (isHit == true) {
			    		//	xpiece.hitAction(xpoint);
			    		//  初速を求める際は重量を考慮していないが、衝突時の計算は重量を考慮し、下記の通り計算する。
			    		//　F1 = m1 * v1**2 , v1 = sqrt(F1 / m1) 衝突時の反力fは　f1 = F1 * m2/(m1+m2)  , f1 = m1 * v2**2。
			    		//　m1 * v2**2 = F1 * m2/(m1*m2) = m1 * v1**2 * m2/(m1*m2)
			    		//  v2**2 = v1**2 * m2/(m1*m2)
			    		//  v2 = sqrt(v1**2 * m2/(m1*m2)) = v1 * sqrt(m2/(m1*m2))
			    		//　単純化のため、 v2 = v1 * m2/(m1*m2)　とする。
			    		//　反発係数　
					let temp_dx = 0;
					let temp_dy = 0;
					let temp_reflection = 0;
					let temp_dx2 = 0;
					let temp_dy2 = 0;
					let temp_reflection2 = 0;
					let	temp_ex = 0;
					let	temp_ey = 0;
			    	if(arg_piece.dx > 0 && xpoint.x < 0 + arg_piece.radius){ //left
						temp_dx = arg_piece.dx;
						temp_dy = 0;
						temp_reflection = 2 * xstructure.weight / (arg_piece.weight + xstructure.weight);

						temp_dx2 = 0;
						temp_dy2 = 0;
						temp_reflection2 = 2 * arg_piece.weight / (arg_piece.weight + xstructure.weight);
						temp_ex = 10;
						temp_ey = 0;
			    	}
			    	if(arg_piece.dx < 0 && xpoint.x > xstructure.width - arg_piece.radius){  //right
						temp_dx = arg_piece.dx;
						temp_dy = 0;
						temp_reflection = 2 * xstructure.weight / (arg_piece.weight + xstructure.weight);

						temp_dx2 = 0;
						temp_dy2 = 0;
						temp_reflection2 = 2 * arg_piece.weight / (arg_piece.weight + xstructure.weight);
						temp_ex = -10;
						temp_ey = 0;
			    	}
			    	if(arg_piece.dy > 0 && xpoint.y < 0 + arg_piece.radius){	//top;
						temp_dx = 0;
						temp_dy = arg_piece.dy;
						temp_reflection = 2 * xstructure.weight / (arg_piece.weight + xstructure.weight);

						temp_dx2 = 0;
						temp_dy2 = 0;
						temp_reflection2 = 2 * arg_piece.weight / (arg_piece.weight + xstructure.weight);
						temp_ex = 0;
						temp_ey = 10;
			    	}
			    	if(arg_piece.dy < 0 && xpoint.y > xstructure.height - arg_piece.radius){	//bttom;
						temp_dx = 0;
						temp_dy = arg_piece.dy;
						temp_reflection = 2 * xstructure.weight / (arg_piece.weight + xstructure.weight);

						temp_dx2 = 0;
						temp_dy2 = 0;
						temp_reflection2 = 2 * arg_piece.weight / (arg_piece.weight + xstructure.weight);
						temp_ex = 0;
						temp_ey = -10;
			    	}
//structure のplayerNoは999
	    			arg_piece.hitAction(temp_dx,temp_dy,temp_dx2,temp_dy2,temp_reflection,xstructure);

    				xstructure.hitAction(temp_dx2,temp_dy2,temp_dx,temp_dy,temp_reflection2,arg_piece);

	    			let effe = new Effect(arg_piece.x + temp_ex,arg_piece.y + temp_ey);
   					field.addChild(effe);
   					createjs.Sound.play("hitsound");
			    }
			}
		}
	}

	judgeHitWall(arg_piece){
		if(arg_piece.x < cns_fieldleft + arg_piece.radius && (!arg_piece.hitwall || arg_piece.hitwallNo != 1 || arg_piece.dx < 0)){
			arg_piece.dx = -1 * arg_piece.dx * cns_reflection;
			arg_piece.dy = arg_piece.dy * cns_reflection;
			arg_piece.accx = -1 * arg_piece.accx;
			arg_piece.radians = Math.atan2(arg_piece.dy,arg_piece.dx);
			arg_piece.hitwall = true;
			arg_piece.hitwallNo = 1;
			arg_piece.hitpiece = false;
			arg_piece.hitstructure = false;
			field.addChild(new Effect(cns_fieldleft,arg_piece.y));
			createjs.Sound.play("wallsound");
		}
		if(arg_piece.x > (cns_fieldright - arg_piece.radius) && (!arg_piece.hitwall || arg_piece.hitwallNo != 2 || arg_piece.dx > 0)){
			arg_piece.dx = -1 * arg_piece.dx * cns_reflection;
			arg_piece.dy = arg_piece.dy * cns_reflection;
			arg_piece.accx = -1 * arg_piece.accx;
			arg_piece.radians = Math.atan2(arg_piece.dy,arg_piece.dx);
			arg_piece.hitwall = true;
			arg_piece.hitwallNo = 2;
			arg_piece.hitpiece = false;
			arg_piece.hitstructure = false;
			field.addChild(new Effect(cns_fieldright,arg_piece.y));
			createjs.Sound.play("wallsound");
		}
		if(arg_piece.y < cns_fieldtop + arg_piece.radius && (!arg_piece.hitwall || arg_piece.hitwallNo != 3 || arg_piece.dy < 0)){
			arg_piece.dy = -1 * arg_piece.dy * cns_reflection;
			arg_piece.dx = arg_piece.dx * cns_reflection;
			arg_piece.accy = -1 * arg_piece.accy;
			arg_piece.radians = Math.atan2(arg_piece.dy,arg_piece.dx);
			arg_piece.hitwall = true;
			arg_piece.hitwallNo = 3;
			arg_piece.hitpiece = false;
			arg_piece.hitstructure = false;
			field.addChild(new Effect(arg_piece.x,cns_fieldtop));
			createjs.Sound.play("wallsound");
		} 
		if(arg_piece.y > (cns_fieldbottom  - arg_piece.radius) && (!arg_piece.hitwall || arg_piece.hitwallNo != 4 || arg_piece.dy > 0)){
			arg_piece.dy = -1 * arg_piece.dy * cns_reflection;
			arg_piece.dx = arg_piece.dx * cns_reflection;
			arg_piece.accy = -1 * arg_piece.accy;
			arg_piece.radians = Math.atan2(arg_piece.dy,arg_piece.dx);
			arg_piece.hitwall = true;
			arg_piece.hitwallNo = 4;
			arg_piece.hitpiece = false;
			arg_piece.hitstructure = false;
			field.addChild(new Effect(arg_piece.x,cns_fieldbottom));
			createjs.Sound.play("wallsound");
		} 
	}

	judgeHitZone(arg_piece){
		let result = false;
		for (let i = 0; i < judge.zoneList.length; i++){
			let xzone = judge.zoneList[i];
			let xpoint = arg_piece.localToLocal(0, 0, xzone);
			let isHit = xzone.hitTest(xpoint.x, xpoint.y);
    		if (isHit == true) {
    			result = true;
		    }
		}
		if(result){
			return false;
		}else{
			let effe = new Effect2(arg_piece.x,arg_piece.y,arg_piece.radius);
			field.addChild(effe);
			createjs.Sound.play("mizusound");
			return true;
		}
	}
}

class MyPiece extends createjs.Container{
	constructor(arg_i){
		super();
		this.pieceNo = arg_i;
		this.classification = 0;  // 0:piece 1:structure
		this.HP = 2;
		this.hitCount = 0;
		this.damage = true;		// 相手にダメージを与えるか否か
		this.moving = 0;		// 0:静止中、1:移動中、2:操作中
		this.weight = 10;		// 5 ～ 15
		this.radians = 0;
		this.radius = 10;
		this.bulletspeed = 10;
		this.distance = 0;
        this.dx = 0;
        this.dy = 0;
        this.accx = 0;
        this.accy = 0;
		this.hitwall = false;
		this.hitwallNo = 0; // 1:left,2:right,3:top,4:bottom
		this.hitpiece = false;
		this.hitplayerNo = 0;
		this.hitpieceNo = 0;
		this.hitstructure = false;
		this.hitstructureNo = 0;
		this.select = false;
	}

 	handleDown(event){
    // 背景選択の非活性化
		background.notActivate();

 		this.backupPointX = this.x;
 		this.backupPointY = this.y;
        this.dragPointX = stage.mouseX - this.x;
        this.dragPointY = stage.mouseY - this.y;
    // 半透明にする
        this.alpha = 0.5;
    // ドラッグ中ステータス　（透明化、ｈｉｔ判定除外）
		this.moving  =  2;

 	}

    handleMove(event){
    // マウス追従　ドラッグ開始地点との補正あり
    	if(this.moving == 2){
        	this.x = stage.mouseX - this.dragPointX;
        	this.y = stage.mouseY - this.dragPointY;
        }
    }

 	handleUp(event){
 		socket.emit("serverPieceControl", {
 			playerNo: this.parent.playerNo ,
 			pieceNo: this.pieceNo,
 			backupPointX: this.backupPointX,
 			backupPointY: this.backupPointY,
 			x: this.x,
 			y: this.y,
 			alpha: this.alpha,
 			moving: this.moving,
			nextX: this.nextX,
	  		nextY: this.nextY,
			distance: this.distance,
			radians: this.radians,
			dx: this.dx,
			dy: this.dy,
			accx: this.accx,
			accy: this.accy
		});
 	}

	actPiece() {
		this.hitwall = false;
		this.hitpiece = false;

        if(this.alpha > 0 ){
        	this.setMovingPrm();
		}
	//目標地点確定
		if(this.distance != 0){
			this.moving  =  1;
			this.select  =  true;
		}
		else{
			this.skillBullet();
			this.moving  =  0;
		}

    //元の透明度に戻す
        this.alpha = 1.0;
    //元の位置に戻す
        this.x = this.backupPointX;
        this.y = this.backupPointY;

       	judge.changeTurn();

	// 背景選択の活性化
		background.Activate();
    }

    hitAction(own_dx,own_dy,another_dx,another_dy,arg_reflection,another_piece){
 		this.dx = this.dx - own_dx * arg_reflection * cns_reflection + another_dx * arg_reflection * cns_reflection;
		this.dy = this.dy - own_dy * arg_reflection * cns_reflection + another_dy * arg_reflection * cns_reflection;
    	this.accx = this.dx / (Math.abs(this.dx) + Math.abs(this.dy)) * this.weight / 10 * cns_friction;
    	this.accy = this.dy / (Math.abs(this.dx) + Math.abs(this.dy)) * this.weight / 10 * cns_friction;
		this.radians = Math.atan2(this.dy,this.dx);

		this.moving = 1;
		this.hitwall = false;

		if(another_piece.classification == 1){
			this.hitpiece = false;
			this.hitstructure = true;
			this.hitstructureNo = another_piece.pieceNo;
		}else{
	    	this.hitstructure = false;
			this.hitpiece = true;
			this.hitplayerNo = another_piece.parent.playerNo;
			this.hitpieceNo = another_piece.pieceNo;
		}
		if(another_piece.damage){
	    	this.hitCount += 1;
		}
		if(this.hitCount > this.HP){
			if(this.classification == 1){
		        judge.structureExistFlg[this.pieceNo] = 0;
				this.destruction();
			}else{
		        this.parent.pieceExistFlg[this.pieceNo] = 0;
				this.destruction();
				judge.judgeScore();
			}
		}
    }

	update(){
	//ドラッグ中透明化
		if(this.moving == 2){
	        this.alpha -= 0.015 * cns_speed;
    //ドラック距離算出
	        if(this.alpha <= 0 ){
	        	this.setMovingPrm();
	        	this.moving = 0;
	       	}
		}

	//移動中の座標更新。（0：静止中の更新をすると、原理不明ながらバグる）
		if(this.moving == 1){
	//移動中ｈｉｔ判定実施　（tween or 当てられて移動中）
			judge.judgeHit(this);
			judge.judgeHitStr(this);
	//
			this.x += this.dx;
			this.y += this.dy;
			this.dx -= this.accx;
			this.dy -= this.accy;
			if(Math.abs(this.dx) < Math.abs(this.accx) || Math.abs(this.dy) < Math.abs(this.accy)){
				this.moving = 0;
				this.radians = 0;
				this.dx = 0;
				this.dy = 0;
				this.accx = 0;
				this.accy = 0;
				this.select = false;
				if(judge.judgeHitZone(this)){
					this.hitCount += 1;
					if(this.hitCount > this.HP){
				        this.parent.pieceExistFlg[this.pieceNo] = 0;
						this.destruction();
						judge.judgeScore();
					}
				}
			}
	//駒に画面追従
			if(this.select){
				if((this.x + field.x < 80 && this.dx < 0 ) || (this.x + field.x > (cns_stageWidth - 80) && this.dx > 0)){
					field.x -= this.dx;
				}
				if((this.y + field.y < 100 && this.dy < 0 ) || (this.y + field.y > (cns_stageHeight - 100) && this.dy > 0)){
					field.y -= this.dy;
				}
			}
	//壁反射
			judge.judgeHitWall(this);
//debug用 移動した駒の座標表示　＊＊＊＊＊
//	    	foot1Elm.innerHTML = "playerNo:" + this.parent.playerNo;
// 			foot2Elm.innerHTML = "pieceNo:"  + this.pieceNo;
// 			foot3Elm.innerHTML = "x:" + this.x;
// 			foot4Elm.innerHTML = "y:" + this.y;
		}
		this.pieceaction();
	}

	pieceaction(){
	}

	destruction(){
		field.addChild(new Destruction(this.x,this.y,this.color,this.peak,this.radius));
		createjs.Sound.play("destruction");

        this.off();
        this.visible = false;
        this.moving = 0;
        // removeChildするとhitjudgeでcns-piecesまで繰り返しができなくなるので。
	}

	setMovingPrm(){
	//tween移動先退避
        this.nextX = this.x;
	  	this.nextY = this.y;
	//角度距離算出
		this.distance = Math.sqrt((this.nextX - this.backupPointX)**2 + (this.nextY - this.backupPointY)**2);
		if(this.distance == 0){
			this.dx = 0;
			this.dy = 0;
			this.accx = 0;
			this.accy = 0;
   		}
   		else{
   	//this.weightは5～15を想定。10/this.weightで移動距離を出す。
			this.radians = Math.atan2((this.nextY - this.backupPointY),(this.nextX - this.backupPointX));
			this.dx = Math.cos(this.radians) * this.distance / 30 * cns_speed;
    		this.dy = Math.sin(this.radians) * this.distance / 30 * cns_speed;
	   		this.accx = this.dx / (Math.abs(this.dx) + Math.abs(this.dy)) * this.weight / 10 * cns_friction;
			this.accy = this.dy / (Math.abs(this.dx) + Math.abs(this.dy)) * this.weight / 10 * cns_friction;
		}
	}

	skillBullet(){
        let color = "hsl(20, 50%, 50%)";
		for (let i = 0; i < 10; i++) {
			let angle = Math.random() * Math.PI * 2;
			let temp_x = Math.cos(angle) * this.bulletspeed;
			let temp_y = Math.sin(angle) * this.bulletspeed;
			let myBullet = new MyBullet(color,this.x + temp_x,this.y + temp_y,cns_pieces + i);
			myBullet.radians = angle;
			myBullet.dx = temp_x * 0.6 * cns_speed;
			myBullet.dy = temp_y * 0.6 * cns_speed;
			myBullet.accx = 0;
			myBullet.accy = 0;
			myBullet.moving = 1;
			myBullet.hitpiece = true;
			myBullet.hitplayerNo = this.parent.playerNo;
			myBullet.hitpieceNo = this.pieceNo;
			myBullet.weight = (this.hitCount + 1) / 2

			this.parent.addChild(myBullet);
			// bulletはjudgehitの繰り返しの対象外。★★★★★★★★★★★ほんとはplayerのchildにしないほうがいいのかも。★★★★★★
			// this.parent.pieceExistFlg[cns_pieces + i] = 1;
		}

	}
}

class MyStar extends MyPiece{
	constructor(arg_color,arg_x,arg_y,arg_i,arg_peak){
		super(arg_i);
		this.weight = arg_i * 3 + 5;
		this.color = arg_color;
		this.peak = arg_peak;
		this.radius = 10;
		
		//円を作成
		let circle = new createjs.Shape();
		circle.graphics.beginStroke(arg_color);// 線の色を指定
		circle.graphics.setStrokeStyle(2);// 線の幅を指定
		circle.graphics.drawCircle(0, 0, 10); // 50pxの星を記述
		circle.shadow = new createjs.Shadow("Black", 3, 3, 5);
		circle.cache(-12,-12,24,24);
        this.addChild(circle); // 表示リストに追加

        // 多角形を作成
        let poly = new createjs.Shape();
        poly.graphics.beginFill(arg_color); // 赤色で描画するように設定
        poly.graphics.drawPolyStar(0, 0, 10, arg_peak, 0.6, -90); // 150pxの星を記述
	//	poly.shadow = new createjs.Shadow("Azure", 3, 3, 5);
		poly.cache(-12,-12,24,24);
        this.addChild(poly); // 表示リストに追加

        // 初期座標
        this.x = arg_x;
        this.y = arg_y;

//debug用　駒の座標を表示　＊＊＊＊＊＊
		let txt = new createjs.Text("", "9px serif", "DarkRed");
		txt.textAlign = "left";
		txt.textBaseline = "top";
		txt.text = this.x + " , " + this.y;
		this.addChild(txt);

        //更新イベントを定義
        this.on('tick',this.update,this);
        // scopeを渡すため、addEventListenerではなく、onを使用。
        // イベントハンドラー（on）のthisは、ハンドラーが定義されたオブジェクトを指す
        // eventlistenerはグローバルなオブジェクトeventdispacherの下で実行される
        //　ため、thisはwindowオブジェクトとなる。
        // addEventListenerを使う場合は、以下のようにアロー関数を使用する必要あり。
        // this.addEventListener("tick", () => { this.update(); });
    	this.on("mousedown", this.handleDown,this);
        this.on("pressmove", this.handleMove,this);
        this.on("pressup", this.handleUp,this);
    }

	pieceaction(){
		this.children[1].rotation += 1;
		this.children[2].text = this.hitCount;
	}
}

class MyKing extends MyPiece{
	constructor(arg_color,arg_x,arg_y,arg_i,arg_peak){
		super(arg_i);
		this.weight = arg_i * 3 + 5;
		this.HP = 5;
		this.color = arg_color;
		this.peak = arg_peak;
		this.radius = 20;
		
		//円を作成
		let circle = new createjs.Shape();
		circle.graphics.beginStroke(arg_color);// 線の色を指定
		circle.graphics.setStrokeStyle(2);// 線の幅を指定
		circle.graphics.drawCircle(0, 0, this.radius); // 50pxの星を記述
		circle.shadow = new createjs.Shadow("Black", 3, 3, 5);
		circle.cache(-1 * this.radius - 2,-1 * this.radius - 2,2 * this.radius + 4,2 * this.radius + 4);
        this.addChild(circle); // 表示リストに追加

        // 多角形を作成
        let poly = new createjs.Shape();
        poly.graphics.beginFill(arg_color); // 赤色で描画するように設定
        poly.graphics.drawPolyStar(0, 0, this.radius, 3, 0.7, -90); // 150pxの星を記述
        poly.alpha = 0.8;
	//	poly.shadow = new createjs.Shadow("Azure", 3, 3, 5);
		poly.cache(-1 * this.radius - 2,-1 * this.radius - 2,2 * this.radius + 4,2 * this.radius + 4);
        this.addChild(poly); // 表示リストに追加

        // 多角形を作成
        let poly2 = new createjs.Shape();
        poly2.graphics.beginFill(arg_color); // 赤色で描画するように設定
        poly2.graphics.drawPolyStar(0, 0, this.radius, 5, 0.7, -90); // 150pxの星を記述
        poly2.alpha = 0.6;
	//	poly.shadow = new createjs.Shadow("Azure", 3, 3, 5);
		poly2.cache(-1 * this.radius - 2,-1 * this.radius - 2,2 * this.radius + 4,2 * this.radius + 4);
        this.addChild(poly2); // 表示リストに追加

        // 初期座標
        this.x = arg_x;
        this.y = arg_y;

//debug用　駒の座標を表示　＊＊＊＊＊＊
		let txt = new createjs.Text("", "9px serif", "DarkRed");
		txt.textAlign = "left";
		txt.textBaseline = "top";
		txt.text = this.x + " , " + this.y;
		this.addChild(txt);

        //更新イベントを定義
        this.on('tick',this.update,this);
        // scopeを渡すため、addEventListenerではなく、onを使用。
        // イベントハンドラー（on）のthisは、ハンドラーが定義されたオブジェクトを指す
        // eventlistenerはグローバルなオブジェクトeventdispacherの下で実行される
        //　ため、thisはwindowオブジェクトとなる。
        // addEventListenerを使う場合は、以下のようにアロー関数を使用する必要あり。
        // this.addEventListener("tick", () => { this.update(); });
    	this.on("mousedown", this.handleDown,this);
        this.on("pressmove", this.handleMove,this);
        this.on("pressup", this.handleUp,this);
    }

	pieceaction(){
		this.children[1].rotation += 1;
		this.children[2].rotation -= 1;
		this.children[3].text = this.hitCount;

		if(Math.random() < 0.005){
			field.addChild(new Effect(this.x,this.y));
		}
	}
}
class MyBullet extends MyPiece{
	constructor(arg_color,arg_x,arg_y,arg_i){
		super(arg_i);
		this.weight = 1;
		
		//円を作成
		let circle = new createjs.Shape();
        circle.graphics.beginFill(arg_color); // 赤色で描画するように設定
		circle.graphics.drawCircle(0, 0, 3); // 50pxの星を記述
        this.addChild(circle); // 表示リストに追加

        // 初期座標
        this.x = arg_x;
        this.y = arg_y;

        //更新イベントを定義
        this.on('tick',this.update,this);
    }
	pieceaction(){
		if(this.hitCount > 0 || this.hitwall || this.hitstructure){
	        this.off();
			this.parent.removeChild(this);
		}
	}
	destruction(){
	}

}

class Effect extends createjs.Container{
	constructor(arg_x,arg_y){
		super();
        let color = "hsl(60, 90%, 80%)";
		for (let i = 0; i < 3; i++){
			let tri = new createjs.Shape();
			tri.graphics.beginFill(color); // 赤色で描画するように設定
			tri.graphics.moveTo(0, 0); // (0,0)座標から描き始める
			tri.graphics.lineTo(3, 0); // (100,0)座標まで辺を描く
			tri.graphics.lineTo(0, 3); // (0,100)座標まで辺を描く
			tri.graphics.lineTo(0, 0); // (0,0)座標まで辺を描く
    	    tri.alpha = 1;
			tri.x = arg_x;
			tri.y = arg_y;
			tri.dx = (Math.random() - 0.5) * 40 / 20;
    		tri.dy = (Math.random() - 0.5) * 40 / 20;
	   		tri.accx = tri.dx / (Math.abs(tri.dx) + Math.abs(tri.dy)) * cns_friction;
			tri.accy = tri.dy / (Math.abs(tri.dx) + Math.abs(tri.dy)) * cns_friction;

    	    this.addChild(tri);
    	}

		for (let i = 3; i < 6; i++){
	        let poly = new createjs.Shape();
	        poly.graphics.beginFill(color); // 赤色で描画するように設定
		    poly.graphics.drawPolyStar(0, 0, 3, 5, 0.6, -90); // 星を記述
        	poly.alpha = 1;
			poly.x = arg_x;
			poly.y = arg_y;
			poly.dx = (Math.random() - 0.5) * 40 / 25;
    		poly.dy = (Math.random() - 0.5) * 40 / 25;
	   		poly.accx = poly.dx / (Math.abs(poly.dx) + Math.abs(poly.dy)) * cns_friction;
			poly.accy = poly.dy / (Math.abs(poly.dx) + Math.abs(poly.dy)) * cns_friction;

    	    this.addChild(poly);
		}
        this.on('tick',this.update,this);
    }

	update(){
    	for (let i = 0; i < this.children.length; i++){
			this.children[i].rotation += 2;
			this.children[i].alpha -= 0.01;
			this.children[i].x += this.children[i].dx;
			this.children[i].y += this.children[i].dy;
			this.children[i].dx -= this.children[i].accx;
			this.children[i].dy -= this.children[i].accy;
		}
		if(Math.abs(this.children[0].dx) < Math.abs(this.children[0].accx) || Math.abs(this.children[0].dy) < Math.abs(this.children[0].accy)){
	        this.off();
			field.removeChild(this);
		}
	}
}

class Effect2 extends createjs.Container{
	constructor(arg_x,arg_y,arg_radius){
		super();
        let color = "hsl(200, 90%, 100%)";
		for (let i = 0; i < 3 * arg_radius / 10; i++){
			let tri = new createjs.Shape();
			tri.graphics.beginFill(color); // 赤色で描画するように設定
			tri.graphics.moveTo(0, 0); // (0,0)座標から描き始める
			tri.graphics.lineTo(3, 0); // (100,0)座標まで辺を描く
			tri.graphics.lineTo(0, 3); // (0,100)座標まで辺を描く
			tri.graphics.lineTo(0, 0); // (0,0)座標まで辺を描く
    	    tri.alpha = 1;
			tri.x = arg_x;
			tri.y = arg_y;
			tri.dx = (Math.random() - 0.5) * 40 / 20;
    		tri.dy = (Math.random() - 0.5) * 40 / 20;
	   		tri.accx = tri.dx / (Math.abs(tri.dx) + Math.abs(tri.dy)) * cns_friction;
			tri.accy = tri.dy / (Math.abs(tri.dx) + Math.abs(tri.dy)) * cns_friction;

    	    this.addChild(tri);
    	}

        color = "hsl(200, 70%, 70%)";
		for (let i = 3; i < 6 * arg_radius / 10; i++){
	        let cir = new createjs.Shape();
	        cir.graphics.beginFill(color); // 赤色で描画するように設定
		    cir.graphics.drawCircle(0, 0, 1 + 2 * Math.random()); // 星を記述
        	cir.alpha = 1;
			cir.x = arg_x;
			cir.y = arg_y;
			cir.dx = (Math.random() - 0.5) * 40 / 25;
    		cir.dy = (Math.random() - 0.5) * 40 / 25;
	   		cir.accx = cir.dx / (Math.abs(cir.dx) + Math.abs(cir.dy)) * cns_friction;
			cir.accy = cir.dy / (Math.abs(cir.dx) + Math.abs(cir.dy)) * cns_friction;

    	    this.addChild(cir);
		}
        this.on('tick',this.update,this);
    }

	update(){
    	for (let i = 0; i < this.children.length; i++){
			this.children[i].rotation += 2;
			this.children[i].alpha -= 0.01;
			this.children[i].x += this.children[i].dx;
			this.children[i].y += this.children[i].dy;
			this.children[i].dx -= this.children[i].accx;
			this.children[i].dy -= this.children[i].accy;
		}
		if(Math.abs(this.children[0].dx) < Math.abs(this.children[0].accx) || Math.abs(this.children[0].dy) < Math.abs(this.children[0].accy)){
	        this.off();
			field.removeChild(this);
		}
	}
}

class Destruction extends createjs.Container{
	constructor(arg_x,arg_y,arg_color,arg_peak,arg_radius){
		super();
		let arc1 = new createjs.Shape();
		arc1.graphics.beginStroke(arg_color);// 線の色を指定
		arc1.graphics.setStrokeStyle(2);// 線の幅を指定
		arc1.graphics.arc(0,0,arg_radius,Math.PI * 0.2,Math.PI * 0.8,false);
    	arc1.alpha = 1;
		arc1.x = 0;
		arc1.y = 0;
		arc1.dx = (Math.random() - 0.5) * 40 / 20 * cns_speed;;
    	arc1.dy = (Math.random() - 0.5) * 40 / 20 * cns_speed;;
	   	arc1.accx = arc1.dx / (Math.abs(arc1.dx) + Math.abs(arc1.dy)) * cns_friction/3;
		arc1.accy = arc1.dy / (Math.abs(arc1.dx) + Math.abs(arc1.dy)) * cns_friction/3;
		arc1.rtt = Math.random() * 6 - 3;
		arc1.shadow = new createjs.Shadow("#000000", 3, 3, 5);
		arc1.cache(-1 * arg_radius - 2,-1 * arg_radius - 2,2 * arg_radius + 4,2 * arg_radius + 4);
    	this.addChild(arc1);

		let arc2 = new createjs.Shape();
		arc2.graphics.beginStroke(arg_color);// 線の色を指定
		arc2.graphics.setStrokeStyle(2);// 線の幅を指定
		arc2.graphics.arc(0,0,arg_radius,Math.PI * 0.8,Math.PI * 1.5,false);
    	arc2.alpha = 1;
		arc2.x = 0;
		arc2.y = 0;
		arc2.dx = (Math.random() - 0.5) * 40 / 28 * cns_speed;;
    	arc2.dy = (Math.random() - 0.5) * 40 / 28 * cns_speed;;
	   	arc2.accx = arc2.dx / (Math.abs(arc2.dx) + Math.abs(arc2.dy)) * cns_friction/3;
		arc2.accy = arc2.dy / (Math.abs(arc2.dx) + Math.abs(arc2.dy)) * cns_friction/3;
		arc2.rtt = Math.random() * 6 - 3;
		arc2.shadow = new createjs.Shadow("#000000", 3, 3, 5);
		arc2.cache(-1 * arg_radius - 2,-1 * arg_radius - 2,2 * arg_radius + 4,2 * arg_radius + 4);
    	this.addChild(arc2);

		let arc3 = new createjs.Shape();
		arc3.graphics.beginStroke(arg_color);// 線の色を指定
		arc3.graphics.setStrokeStyle(2);// 線の幅を指定
		arc3.graphics.arc(0,0,arg_radius,Math.PI * 1.5,Math.PI * 2,false);
    	arc3.alpha = 1;
		arc3.x = 0;
		arc3.y = 0;
		arc3.dx = (Math.random() - 0.5) * 40 / 25 * cns_speed;;
    	arc3.dy = (Math.random() - 0.5) * 40 / 25 * cns_speed;;
	   	arc3.accx = arc3.dx / (Math.abs(arc3.dx) + Math.abs(arc3.dy)) * cns_friction/3;
		arc3.accy = arc3.dy / (Math.abs(arc3.dx) + Math.abs(arc3.dy)) * cns_friction/3;
		arc3.rtt = Math.random() * 6 - 3;
		arc3.shadow = new createjs.Shadow("#000000", 3, 3, 5);
		arc3.cache(-1 * arg_radius - 2,-1 * arg_radius - 2,2 * arg_radius + 4,2 * arg_radius + 4);
    	this.addChild(arc3);

		let pert_angle = Math.PI * 2 / arg_peak;
		for (let i = 1; i < arg_peak + 1; i++){
			let angle2 = pert_angle * i;
			let angle1 = angle2 - pert_angle / 2;
			let angle3 = angle2 + pert_angle / 2;
			let tri = new createjs.Shape();
			tri.graphics.beginFill(arg_color);
			tri.graphics.moveTo(0, 0);
			tri.graphics.lineTo(0 + Math.cos(angle1)*arg_radius/2, 0 + Math.sin(angle1)*arg_radius/2);
			tri.graphics.lineTo(0 + Math.cos(angle2)*arg_radius, 0 + Math.sin(angle2)*arg_radius);
			tri.graphics.lineTo(0 + Math.cos(angle3)*arg_radius/2, 0 + Math.sin(angle3)*arg_radius/2);
			tri.graphics.lineTo(0, 0); 
    	    tri.alpha = 1;
			tri.x = 0;
			tri.y = 0;
			tri.dx = (Math.random() - 0.5) * 40 / 25 * cns_speed;;
    		tri.dy = (Math.random() - 0.5) * 40 / 25 * cns_speed;;
	   		tri.accx = tri.dx / (Math.abs(tri.dx) + Math.abs(tri.dy)) * cns_friction/3;
			tri.accy = tri.dy / (Math.abs(tri.dx) + Math.abs(tri.dy)) * cns_friction/3;
			tri.rtt = Math.random() * 6 - 3;
			tri.shadow = new createjs.Shadow("#000000", 3, 3, 5);
			tri.cache(-1 * arg_radius - 2,-1 * arg_radius - 2,2 * arg_radius + 4,2 * arg_radius + 4);

    	    this.addChild(tri);
    	}
    	this.x = arg_x;
    	this.y = arg_y;

        this.on('tick',this.update,this);
    }

	update(){
    	for (let i = 0; i < this.children.length; i++){
			this.children[i].rotation += this.children[i].rtt;
			this.children[i].alpha -= 0.005;
			this.children[i].x += this.children[i].dx;
			this.children[i].y += this.children[i].dy;
			this.children[i].dx -= this.children[i].accx;
			this.children[i].dy -= this.children[i].accy;
			if(Math.abs(this.children[i].dx) < Math.abs(this.children[i].accx) || Math.abs(this.children[i].dy) < Math.abs(this.children[i].accy)){
				this.children[i].dx = 0;
				this.children[i].dy = 0;
				this.children[i].accx = 0;
				this.children[i].accy = 0;
			}
		}
		if(this.children[0].alpha < 0){
		// if(Math.abs(this.children[0].dx) < Math.abs(this.children[0].accx) || Math.abs(this.children[0].dy) < Math.abs(this.children[0].accy)){
	        this.off();
			field.removeChild(this);
		}
	}	
}

class Structure extends MyPiece{
	constructor(arg_x,arg_y,arg_width,arg_height,arg_image,arg_i){
		super(arg_i);
		this.classification = 1;  // 0:piece 1:structure
		this.weight = 1000;
		this.HP = 10;
		this.damage = false;		// 相手にダメージを与えるか否か

		let image = new createjs.Bitmap(arg_image);

		this.width = arg_width;
		this.height = arg_height;

        this.addChild(image); // 表示リストに追加

        // 初期座標
        this.x = arg_x;
        this.y = arg_y;

		judge.addStructure(this); //judgeに登録

        //更新イベントを定義
        this.on('tick',this.update,this);
    }
	update(){
		this.pieceaction();
	}
}

class Zone extends MyPiece{
	constructor(arg_x,arg_y,arg_H_radius,arg_V_radius,arg_rotation){
		super(0);

    	let zone = new createjs.Shape();		
    	let hue = 100 + 40 * Math.random();
	    let color = "hsl(" + hue + ", 60%, 50%)";
    	zone.graphics.beginStroke(color);		//線の色を指定
    	zone.graphics.beginFill(color);		//塗りつぶしの色を作成
    	zone.graphics.drawEllipse(0,0,arg_H_radius,arg_V_radius);	//楕円を描く(x:0,y:0を中心とした、横半径50px,縦の半径100pxの楕円)

	    color = "hsl(" + hue + ", 40%, 40%)";
	    zone.graphics.setStrokeStyle(5);
    	zone.graphics.beginStroke(color);		//線の色を指定
		zone.graphics.moveTo(arg_H_radius / 2, 0);
		zone.graphics.lineTo(arg_H_radius / 2,arg_V_radius);

	    color = "hsl(" + hue + ", 70%, 60%)";
	    zone.graphics.setStrokeStyle(2);
    	zone.graphics.beginStroke(color);		//線の色を指定
		zone.graphics.moveTo(arg_H_radius / 2 -2, 0);
		zone.graphics.lineTo(arg_H_radius / 2 -2,arg_V_radius);
 
        this.addChild(zone); // 表示リストに追加

        // 初期座標
        this.x = arg_x;
        this.y = arg_y;
        this.rotation += arg_rotation;
		judge.addZone(this); //judgeに登録

        //更新イベントを定義
        this.on('tick',this.update,this);
    }

	update(){
		this.pieceaction();
	}
}

class Background extends MyPiece{
	constructor(arg_x,arg_y,arg_i){
		super(arg_i);
		this.activate = true;

		// let imageWidth = cns_fieldright - cns_fieldleft;
		// let imageHight = cns_fieldbottom - cns_fieldtop;
		let image = new createjs.Bitmap("./image/ike.png");
		
		// image.setBounds(-500,-500,750,550);
		// image.scaleX = imageWidth / image.getBounds().width;
		// image.scaleY = imageHight / image.getBounds().hight;

        this.addChild(image); // 表示リストに追加

        // 初期座標
        this.x = arg_x;
        this.y = arg_y;

        this.on('tick',this.update,this);

    	this.on("mousedown", this.handleDown,this);
        this.on("pressmove", this.handleMove,this);
        this.on("pressup", this.handleUp,this);
        // this.on("dblclick", this.handledblclick,this);
    }

    hitAction(own_dx,own_dy,another_dx,another_dy,arg_reflection,another_playerNo,another_pieceNo){
    }

    handleDown(event){
        this.dx = 0;
        this.dy = 0;
        this.accx = 0;
        this.accy = 0;
        this.dragPointX = stage.mouseX - field.x;
        this.dragPointY = stage.mouseY - field.y;
    	// this.prePointX = stage.x;
    	// this.prePointY = stage.y;
    // swipeの速度測定用
		this.prex = field.x;
		this.prey = field.y;
		this.prex2 = field.x;
		this.prey2 = field.y;
		this.hitwall = false;
 	}

    handleMove(event){
    // this.activate だとダメなのはなぜ？？？
		if(background.activate){
    // マウス追従　ドラッグ開始地点との補正あり
        	field.x = (stage.mouseX - this.dragPointX);
        	if(field.x * -1 < cns_fieldleft - cns_fieldsidemargin){
        		field.x = (cns_fieldleft - cns_fieldsidemargin) * -1;
        	}else{
	        	if(field.x  * -1 > cns_fieldright - cns_stageWidth + cns_fieldsidemargin){
	        		field.x = (cns_fieldright - cns_stageWidth + cns_fieldsidemargin) * -1;
	        	}else{
					this.prex2 = this.prex;
					this.prex = field.x;
	        	}
        	}

        	field.y = (stage.mouseY - this.dragPointY);
        	if(field.y * -1 < cns_fieldtop - cns_fieldvertmargin){
        		field.y = (cns_fieldtop - cns_fieldvertmargin) * -1;
        	}else{
	        	if(field.y  * -1 > cns_fieldbottom - cns_stageHeight + cns_fieldvertmargin){
	        		field.y = (cns_fieldbottom - cns_stageHeight + cns_fieldvertmargin) * -1;
	        	}else{
					this.prey2 = this.prey;
					this.prey = field.y;
	        	}
        	}
		}
    }

	handleUp(event) {
		if(background.activate){
			this.dx = (this.prex - this.prex2) / 4 * cns_speed;;
			this.dy = (this.prey - this.prey2) / 4 * cns_speed;;
			if(this.dx > 60){this.dx = 60};
			if(this.dy > 60){this.dy = 60};
			if(Math.abs(this.dx) > 8){this.dx = this.dx / Math.abs(this.dx) * 8};
			if(Math.abs(this.dy) > 8){this.dy = this.dy / Math.abs(this.dy) * 8};
			if(this.dx != 0 || this.dy != 0){
				this.accx = this.dx / (Math.abs(this.dx) + Math.abs(this.dy)) * cns_friction;
				this.accy = this.dy / (Math.abs(this.dx) + Math.abs(this.dy)) * cns_friction;
			}
			// if(this.dx == 0 && this.dy == 0 && this.activate){
			if(this.dx == 0 && this.dy == 0 && this.prey2 == field.y && this.prex2 == field.x){
				if(judge.end == 0){
					let xPiece = judge.getcurrentPiece();
					let nX = xPiece.x * -1 + cns_stageWidth / 2;
					let nY = xPiece.y * -1 + cns_stageHeight / 2; 
					let duration = 1000;
					createjs.Tween.get(field, {override:true})
					.to({x:nX, y:nY}, duration, createjs.Ease.cubicOut);
				}else{
					let moving = 0;
					for (let i = 0; i < judge.playerList.length; i++){
					    for(let j = 0; j < cns_pieces; j++){
					    	if(judge.playerList[i].pieceExistFlg[j] == 1  &&  judge.playerList[i].children[j].moving == 1){
					    		moving += 1;
					    	}
					    }
					}
					if(moving == 0){
						judge.end = 2;
						clearStage();
					}
				}
			}
		}
    }

  //   handledblclick(event){
		// let xPiece = judge.getcurrentPiece();
		// let nX = xPiece.x * -1 + cns_stageWidth / 2;
		// let nY = xPiece.y * -1 + cns_stageHeight / 2; 
		// let duration = 1000;
		// createjs.Tween.get(field, {override:true})
		// .to({x:nX, y:nY}, duration, createjs.Ease.cubicOut);
  //   }

	notActivate(){
		this.activate = false;
	}

	Activate(){
		this.activate = true;
	}

	update(){
		field.x += this.dx;
		field.y += this.dy;
		this.dx -= this.accx;
		this.dy -= this.accy;
		if((field.x * -1 < cns_fieldleft - cns_fieldsidemargin || field.x * -1 > cns_fieldright - cns_stageWidth + cns_fieldsidemargin) && ( !this.hitwall || this.hitwallNo != 1) ){
			this.dx = this.dx * -1 / 2;
			this.dy = this.dy / 2;
			this.accx = this.accx * -1 * 5;
			this.accy = this.accy * 5;
			this.hitwallNo = 1;
			this.hitwall = true;
		}
		if((field.y * -1 < cns_fieldtop - cns_fieldvertmargin  || field.y * -1 > cns_fieldbottom - cns_stageHeight + cns_fieldvertmargin) && (!this.hitwall || this.hitwallNo != 2) ){
			this.dy = this.dy * -1 / 2;
			this.dx = this.dx / 2;
			this.accy = this.accy * -1 * 5;
			this.accx = this.accx * 5;
			this.hitwallNo = 2;
			this.hitwall = true;
		}
		if(Math.abs(this.dx) < Math.abs(this.accx) || Math.abs(this.dy) < Math.abs(this.accy)){
			this.dx = 0;
			this.dy = 0;
			this.accx = 0;
			this.accy = 0;
		}
		this.pieceaction();
	}

	pieceaction(){
		this.XYinfo.uncache();
		let mouse_x = Math.floor((stage.mouseX - field.x) * 100) / 100;
		let mouse_y = Math.floor((stage.mouseY - field.y) * 100) / 100;
		this.XYinfo.text = "X:" + mouse_x + "  Y:" + mouse_y;
		this.XYinfo.cache(-2,-2,200,30);
	}

}
