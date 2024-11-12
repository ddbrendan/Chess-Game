class ChessUI {
    constructor(game, container) {
        this.game = game;
        this.container = container;
        this.selectedCell = null;
        this.legalMoves = [];
        this.createBoard();
        this.initializeHistory();
    }

    //chatgpt
    findLegalMoves(row, col) {
        const legalMoves = [];
        const piece = this.game.board[row][col];
        if (!piece) return [];

        // Store original state
        const originalCurrentPlayer = this.game.currentPlayer;
        
        // Check all possible positions
        for (let endRow = 0; endRow < 8; endRow++) {
            for (let endCol = 0; endCol < 8; endCol++) {
                // Skip current position
                if (row === endRow && col === endCol) continue;

                if (this.game.isValidMove([row, col], [endRow, endCol])) {
                    // Store board state
                    const originalEndSquare = this.game.board[endRow][endCol];
                    
                    // Try move
                    this.game.board[endRow][endCol] = piece;
                    this.game.board[row][col] = null;
                    
                    // Check if move leaves king in check
                    if (!this.game.isInCheck(piece.color)) {
                        legalMoves.push([endRow, endCol]);
                    }
                    
                    // Restore board state
                    this.game.board[row][col] = piece;
                    this.game.board[endRow][endCol] = originalEndSquare;
                }
            }
        }
        
        // Restore original state
        this.game.currentPlayer = originalCurrentPlayer;
        
        return legalMoves;
    }
    initializeHistory() {
        const historyContainer = document.getElementById('moves-list');
        if (!historyContainer) {
            console.error('Moves list container not found!');
            return;
        }
        this.updateMoveHistory();
    }

    updateMoveHistory() {
        const historyContainer = document.getElementById('moves-list');
        if (!historyContainer) return;

        historyContainer.innerHTML = '';

        for (let i = 0; i < this.game.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const moveDiv = document.createElement('div');
            moveDiv.className = 'move-row';

            // Convert positions to chess notation
            const whiteMove = this.positionToNotation(
                this.game.moveHistory[i].from,
                this.game.moveHistory[i].to,
                this.game.moveHistory[i].piece
            );

            const blackMove = i + 1 < this.game.moveHistory.length ? 
                this.positionToNotation(
                    this.game.moveHistory[i + 1].from,
                    this.game.moveHistory[i + 1].to,
                    this.game.moveHistory[i + 1].piece
                ) : '';

            moveDiv.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="white-move">${whiteMove}</span>
                ${blackMove ? `<span class="black-move">${blackMove}</span>` : ''}
            `;

            historyContainer.appendChild(moveDiv);
        }

        //scroll runter
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    positionToNotation(from, to, piece) {
        const files = 'abcdefgh';
        const fromNotation = files[from[1]] + (8 - from[0]);
        const toNotation = files[to[1]] + (8 - to[0]);
        
        //piece symbole
        let pieceSymbol = '';
        switch (piece.type) {
            case 'k': pieceSymbol = 'K'; break;
            case 'q': pieceSymbol = 'Q'; break;
            case 'r': pieceSymbol = 'R'; break;
            case 'b': pieceSymbol = 'B'; break;
            case 'n': pieceSymbol = 'N'; break;
            case 'p': pieceSymbol = ''; break;
        }

        return `${pieceSymbol}${fromNotation}-${toNotation}`;
    }

    createBoard() {
        this.container.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                
                const displayRow = 7 - row;
                const displayCol = col;
                

                cell.className = `cell ${(displayRow + displayCol) % 2 === 1 ? 'light' : 'dark'}`;
                
                cell.dataset.row = displayRow;
                cell.dataset.col = displayCol;
                
                //coordinate label
                if (col === 0) {
                    const rowLabel = document.createElement('div');
                    rowLabel.className = 'row-label';
                    rowLabel.textContent = displayRow + 1;
                    cell.appendChild(rowLabel);
                }
                if (row === 7) {
                    const colLabel = document.createElement('div');
                    colLabel.className = 'col-label';
                    colLabel.textContent = String.fromCharCode(97 + displayCol);
                    cell.appendChild(colLabel);
                }
                
                cell.addEventListener('click', () => this.handleCellClick(displayRow, displayCol));
                this.container.appendChild(cell);
            }
        }
        
        this.updateBoard();
    }

    updateBoard() {
        const cells = this.container.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const piece = this.game.board[row][col];
            
            const rowLabel = cell.querySelector('.row-label');
            const colLabel = cell.querySelector('.col-label');
            
            cell.innerHTML = '';
            cell.className = `cell ${(row + col) % 2 === 1 ? 'light' : 'dark'}`;
            
            if (rowLabel) cell.appendChild(rowLabel);
            if (colLabel) cell.appendChild(colLabel);
            
            if (piece) {
                const img = document.createElement('img');
                img.src = `images/${piece.color}-${piece.type}.png`;
                img.className = 'chess-piece';
                cell.appendChild(img);
            }
            
            //legal move indicators
            if (this.legalMoves.length > 0) {
                const isLegalMove = this.legalMoves.some(move => 
                    move[0] === row && move[1] === col
                );
                
                if (isLegalMove) {
                    const indicator = document.createElement('div');
                    indicator.className = piece ? 'capture-indicator' : 'move-indicator';
                    cell.appendChild(indicator);
                }
            }
            
            //highlight selected cell
            if (this.selectedCell && this.selectedCell[0] === row && this.selectedCell[1] === col) {
                cell.classList.add('selected');
            }

            //highlight king in check
            if (piece && piece.type === 'k' && this.game.isInCheck(piece.color)) {
                cell.classList.add('in-check');
            }
        });
    }

    handleCellClick(row, col) {
        if (!this.selectedCell) {
            const piece = this.game.board[row][col];
            if (piece && piece.color === this.game.currentPlayer) {
                this.selectedCell = [row, col];
                this.legalMoves = this.findLegalMoves(row, col);
                this.updateBoard();
            }
        } else {
            const moveSuccess = this.game.makeMove(this.selectedCell, [row, col]);
            this.selectedCell = null;
            this.legalMoves = [];
            this.updateBoard();

            if (moveSuccess) {
                this.updateMoveHistory();
                if (this.game.isCheckmate()) {
                    const winner = this.game.currentPlayer === 'white' ? 'Black' : 'White';
                    this.showGameOverMessage(`Checkmate! ${winner} wins!`);
                } else if (this.game.isInCheck(this.game.currentPlayer)) {
                    this.showCheckMessage();
                }
            }
        }
    }

    showGameOverMessage(message) {
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${message}</h2>
                <button onclick="location.reload()">Play Again</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showCheckMessage() {
        const checkAlert = document.createElement('div');
        checkAlert.className = 'check-alert';
        checkAlert.textContent = 'Check!';
        document.body.appendChild(checkAlert);
        setTimeout(() => checkAlert.remove(), 2000);
    }
}