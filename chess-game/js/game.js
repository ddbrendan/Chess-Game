class ChessGame {
    constructor() {
        this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.initializeBoard();
        this.positionHistory = [];
        this.currentMove = 0;
        this.savePosition();
    }

    initializeBoard() {
        const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        this.board[7] = backRow.map(piece => ({ type: piece, color: 'black' }));
        this.board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'black' }));
        this.board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'white' }));
        this.board[0] = backRow.map(piece => ({ type: piece, color: 'white' }));

        for (let row = 2; row < 6; row++) {
            this.board[row] = new Array(8).fill(null);
        }
    }

    isValidMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        
        const piece = this.board[startRow][startCol];
        if (!piece || piece.color !== this.currentPlayer) return false;

        const targetPiece = this.board[endRow][endCol];
        if (targetPiece && targetPiece.color === piece.color) return false;

        const rowDiff = endRow - startRow;
        const colDiff = endCol - startCol;

        //piece movement rules
        switch (piece.type) {
            case 'p': //pawn
                const direction = piece.color === 'white' ? 1 : -1;
                const startRank = piece.color === 'white' ? 1 : 6;

                //normal move
                if (colDiff === 0 && rowDiff === direction && !targetPiece) {
                    return true;
                }
                //two square move
                if (colDiff === 0 && startRow === startRank && rowDiff === 2 * direction && 
                    !targetPiece && !this.board[startRow + direction][startCol]) {
                    return true;
                }
                //capture
                if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece) {
                    return true;
                }
                return false;

            case 'r': //rook
                return this.isValidStraightMove(startPos, endPos);

            case 'n': //knight
                return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                       (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);

            case 'b': //bishiop
                return this.isValidDiagonalMove(startPos, endPos);

            case 'q': //queen
                return this.isValidStraightMove(startPos, endPos) ||
                       this.isValidDiagonalMove(startPos, endPos);

            case 'k': //king
                return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        }
        return false;
    }

    isValidStraightMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        
        if (startRow !== endRow && startCol !== endCol) return false;
        
        const rowDir = Math.sign(endRow - startRow);
        const colDir = Math.sign(endCol - startCol);
        let currentRow = startRow + rowDir;
        let currentCol = startCol + colDir;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowDir;
            currentCol += colDir;
        }
        return true;
    }

    isValidDiagonalMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        
        if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) return false;
        
        const rowDir = Math.sign(endRow - startRow);
        const colDir = Math.sign(endCol - startCol);
        let currentRow = startRow + rowDir;
        let currentCol = startCol + colDir;

        while (currentRow !== endRow) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowDir;
            currentCol += colDir;
        }
        return true;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'k' && piece.color === color) {
                    return [row, col];
                }
            }
        }
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        const originalCurrentPlayer = this.currentPlayer;
        this.currentPlayer = opponentColor;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isValidMove([row, col], kingPos)) {
                        this.currentPlayer = originalCurrentPlayer;
                        return true;
                    }
                }
            }
        }
        
        this.currentPlayer = originalCurrentPlayer;
        return false;
    }

    makeMove(startPos, endPos) {
        if (!this.isValidMove(startPos, endPos)) {
            return false;
        }
        
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
    
        // Store original state
        const movingPiece = this.board[startRow][startCol];
        const capturedPiece = this.board[endRow][endCol];
    
        // Make the move
        this.board[endRow][endCol] = movingPiece;
        this.board[startRow][startCol] = null;
    
        // Check if move puts/leaves king in check
        if (this.isInCheck(this.currentPlayer)) {
            // Undo the move
            this.board[startRow][startCol] = movingPiece;
            this.board[endRow][endCol] = capturedPiece;
            return false;
        }
    
        // Store captured piece
        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }
    
        // Handle move history
        if (this.currentMove < this.moveHistory.length) {
            // If we're not at the latest move, truncate future moves
            this.moveHistory = this.moveHistory.slice(0, this.currentMove);
            this.positionHistory = this.positionHistory.slice(0, this.currentMove + 1);
        }
    
        // Add new move to history
        this.moveHistory.push({
            piece: movingPiece,
            from: startPos,
            to: endPos,
            captured: capturedPiece
        });
    
        // Update current move counter and save position
        this.currentMove++;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.savePosition();
    
        return true;
    }

    isCheckmate() {
        if (!this.isInCheck(this.currentPlayer)) return false;

        //try every possible move for current player
        for (let startRow = 0; startRow < 8; startRow++) {
            for (let startCol = 0; startCol < 8; startCol++) {
                const piece = this.board[startRow][startCol];
                if (piece && piece.color === this.currentPlayer) {
                    for (let endRow = 0; endRow < 8; endRow++) {
                        for (let endCol = 0; endCol < 8; endCol++) {
                            if (this.isValidMove([startRow, startCol], [endRow, endCol])) {
                                //try move
                                const originalEndPiece = this.board[endRow][endCol];
                                this.board[endRow][endCol] = piece;
                                this.board[startRow][startCol] = null;

                                const stillInCheck = this.isInCheck(this.currentPlayer);

                                //undo move
                                this.board[startRow][startCol] = piece;
                                this.board[endRow][endCol] = originalEndPiece;

                                if (!stillInCheck) return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    
    savePosition() {
        // Deep copy the current board
        const boardCopy = this.board.map(row => 
            row.map(piece => piece ? {...piece} : null)
        );
        this.positionHistory[this.currentMove] = {
            board: boardCopy,
            currentPlayer: this.currentPlayer,
            capturedPieces: {
                white: [...this.capturedPieces.white],
                black: [...this.capturedPieces.black]
            }
        };
    }

    goToMove(moveNumber) {
        if (moveNumber < 0 || moveNumber > this.positionHistory.length - 1) return false;
    
        const position = this.positionHistory[moveNumber];
        this.board = position.board.map(row => 
            row.map(piece => piece ? {...piece} : null)
        );
        this.currentPlayer = position.currentPlayer;
        this.capturedPieces = {
            white: [...position.capturedPieces.white],
            black: [...position.capturedPieces.black]
        };
        this.currentMove = moveNumber;
        
        return true;
    }

}

