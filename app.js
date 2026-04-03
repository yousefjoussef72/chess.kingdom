import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// إعداداتك التي قدمتها
const firebaseConfig = {
  apiKey: "AIzaSyAEMeWGWNCHS6MkweF0i_UMBKEKNVDXfRI",
  authDomain: "chess-1aece.firebaseapp.com",
  projectId: "chess-1aece",
  storageBucket: "chess-1aece.firebasestorage.app",
  messagingSenderId: "1056502246331",
  appId: "1:1056502246331:web:28d179351ddda48387329e",
  databaseURL: "https://chess-1aece-default-rtdb.firebaseio.com" // أضفتها لك بناءً على الـ Project ID
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// منطق اللعبة
let board = null;
let game = new Chess();
let playerColor = 'white';
let gameId = new URLSearchParams(window.location.search).get('game');

if (!gameId) {
    // أنت المنشئ (أبيض)
    gameId = Math.random().toString(36).substring(2, 9);
    window.history.pushState({}, '', '?game=' + gameId);
    set(ref(db, 'games/' + gameId), {
        fen: 'start',
        turn: 'w'
    });
} else {
    // أنت الضيف (أسود)
    playerColor = 'black';
    document.getElementById('room-section').style.display = 'none';
}

document.getElementById('invite-link').innerText = window.location.href;

// وظائف الشطرنج
function onDragStart (source, piece, position, orientation) {
    if (game.game_over()) return false;
    if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
        (playerColor === 'black' && piece.search(/^w/) !== -1) ||
        (game.turn() !== playerColor[0])) {
        return false;
    }
}

function onDrop (source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' 
    });

    if (move === null) return 'snapback';

    // تحديث قاعدة البيانات فوراً
    update(ref(db, 'games/' + gameId), {
        fen: game.fen(),
        turn: game.turn()
    });
    updateStatus();
}

function onSnapEnd () {
    board.position(game.fen());
}

// مراقبة التغييرات من الخصم
onValue(ref(db, 'games/' + gameId), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        game.load(data.fen);
        board.position(data.fen);
        updateStatus();
    }
});

function updateStatus () {
    let status = '';
    let moveColor = (game.turn() === 'w') ? 'الأبيض' : 'الأسود';

    if (game.in_checkmate()) {
        status = 'انتهت اللعبة! الفائز: ' + (game.turn() === 'w' ? 'الأسود' : 'الأبيض');
    } else if (game.in_draw()) {
        status = 'تعادل!';
    } else {
        status = 'دور: ' + moveColor;
        if (game.in_check()) status += ' (كش!)';
    }
    document.getElementById('status').innerText = status;
}

// تشغيل اللوحة
board = Chessboard('board', {
    draggable: true,
    position: 'start',
    orientation: playerColor,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});
