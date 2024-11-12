document.addEventListener('DOMContentLoaded', function() {
    const game = new ChessGame();


    const boardContainer = document.getElementById('chess-board');
    const ui = new ChessUI(game, boardContainer);
    

    const currentTurnElement = document.getElementById('current-turn');
    const capturedWhiteElement = document.getElementById('captured-white');
    const capturedBlackElement = document.getElementById('captured-black');
    const movesListElement = document.getElementById('moves-list');
    

    function updateGameStatus() {
        //current turn display
        currentTurnElement.textContent = `Current Turn: ${game.currentPlayer.charAt(0).toUpperCase() + game.currentPlayer.slice(1)}`;
        
        capturedWhiteElement.textContent = game.capturedPieces.white.map(piece => PIECES[piece.type.toUpperCase()]).join(' ');
        capturedBlackElement.textContent = game.capturedPieces.black.map(piece => PIECES[piece.type]).join(' ');
        
        //move history
        movesListElement.innerHTML = game.moveHistory
            .map((move, index) => `
                <div class="move">
                    ${index + 1}. ${move.piece.color} ${move.piece.type.toUpperCase()} 
                    ${String.fromCharCode(97 + move.from[1])}${8 - move.from[0]} → 
                    ${String.fromCharCode(97 + move.to[1])}${8 - move.to[0]}
                    ${move.captured ? `(captured ${move.captured.type.toUpperCase()})` : ''}
                </div>
            `)
            .join('');
    }
    ui.onMove = updateGameStatus;
    updateGameStatus();
});