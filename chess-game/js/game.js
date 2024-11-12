class ChessGame {
    constructor() {
        this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.initializeBoard();
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
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;

        if (!this.isValidMove(startPos, endPos)) {
            return false;
        }

        const originalPiece = this.board[startRow][startCol];
        const capturedPiece = this.board[endRow][endCol];

        this.board[endRow][endCol] = originalPiece;
        this.board[startRow][startCol] = null;

        //check check
        if (this.isInCheck(this.currentPlayer)) {
            this.board[startRow][startCol] = originalPiece;
            this.board[endRow][endCol] = capturedPiece;
            return false;
        }

        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }

        this.moveHistory.push({
            piece: originalPiece,
            from: startPos,
            to: endPos,
            captured: capturedPiece
        });

        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
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
}