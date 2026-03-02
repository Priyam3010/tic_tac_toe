import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  
  // Multiplayer state
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [myMark, setMyMark] = useState(null);
  const [playersCount, setPlayersCount] = useState(0);
  const socketRef = useRef(null);

  const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWinner = (currentBoard) => {
    for (let condition of winConditions) {
      const [a, b, c] = condition;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: condition };
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return null;
  };

  useEffect(() => {
    // Initialize socket connection
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    socketRef.current = io(backendUrl);

    socketRef.current.on('playerJoined', ({ mark, board, currentPlayer }) => {
      setMyMark(mark);
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setInRoom(true);
    });

    socketRef.current.on('gameStart', ({ players }) => {
      setPlayersCount(players.length);
    });

    socketRef.current.on('moveMade', ({ board, currentPlayer }) => {
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      const result = checkWinner(board);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
      }
    });

    socketRef.current.on('gameRestarted', ({ board, currentPlayer }) => {
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setWinner(null);
      setWinningLine(null);
    });

    socketRef.current.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleCellClick = (index) => {
    if (board[index] || winner || currentPlayer !== myMark || playersCount < 2) return;
    
    socketRef.current.emit('makeMove', { roomId, index, mark: myMark });
  };

  const restartGame = () => {
    socketRef.current.emit('restartGame', roomId);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      socketRef.current.emit('joinRoom', roomId.trim());
    }
  };

  const XIcon = ({ isWinning }) => (
    <svg viewBox="0 0 24 24" className={`w-16 h-16 ${isWinning ? 'animate-pulse' : ''}`}>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="var(--neon-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="animate-draw-x glow-cyan"
        fill="none"
      />
    </svg>
  );

  const OIcon = ({ isWinning }) => (
    <svg viewBox="0 0 24 24" className={`w-16 h-16 ${isWinning ? 'animate-pulse' : ''}`}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--neon-magenta)"
        strokeWidth="2.5"
        className="animate-draw-o glow-magenta"
        fill="none"
      />
    </svg>
  );

  if (!inRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-white p-4">
        <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 drop-shadow-lg">
          ARCADE LOBBY
        </h1>
        <form onSubmit={joinRoom} className="w-full max-w-sm flex flex-col gap-4">
          <input
            type="text"
            placeholder="ENTER ROOM ID (e.g. BATTLE-1)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            className="bg-white/5 border border-white/20 rounded-lg px-6 py-4 text-center text-xl font-bold tracking-widest focus:outline-none focus:border-cyan-400 transition-all uppercase"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-magenta-500 p-4 rounded-lg font-black tracking-[0.2em] hover:scale-105 transition-all text-sm uppercase shadow-xl shadow-cyan-500/20"
          >
            JOIN BATTLE
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-white p-4 transition-all duration-300 ${winner && winner !== 'draw' ? 'screen-shake' : ''}`}>
      <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 drop-shadow-lg">
        ROOM: {roomId}
      </h1>
      
      <div className="mb-4 text-xs font-mono tracking-widest uppercase opacity-50">
        You are playing as: <span className={myMark === 'X' ? 'text-cyan-400' : 'text-magenta-400'}>{myMark}</span>
      </div>

      <div className="mb-8 text-xl font-bold tracking-widest uppercase flex flex-col items-center gap-2">
        {playersCount < 2 ? (
          <div className="animate-pulse text-gray-400 text-sm">WAITING FOR CHALLENGER...</div>
        ) : winner ? (
          <div className="animate-bounce scale-125">
            {winner === 'draw' ? (
              <span className="text-gray-400">IT'S A DRAW!</span>
            ) : (
              <span className={winner === 'X' ? 'text-[var(--neon-cyan)]' : 'text-[var(--neon-magenta)]'}>
                {winner} WINS!
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">TURN:</span>
            <span className={currentPlayer === 'X' ? 'text-[var(--neon-cyan)] glow-cyan' : 'text-[var(--neon-magenta)] glow-magenta'}>
              {currentPlayer === myMark ? 'YOUR TURN' : `${currentPlayer}'S TURN`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-0 bg-white/5 p-1 rounded-xl shadow-2xl backdrop-blur-sm border border-white/10">
        {board.map((cell, i) => {
          const isWinningCell = winningLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              className={`
                w-24 h-24 md:w-32 md:h-32 
                flex items-center justify-center 
                border-white/10 border-[0.5px]
                relative overflow-hidden
                ${(currentPlayer === myMark && !cell && !winner && playersCount === 2) ? 'cell-hover' : ''}
                transition-colors duration-300
                ${isWinningCell ? (winner === 'X' ? 'bg-cyan-500/20' : 'bg-magenta-500/20') : ''}
              `}
              disabled={!!cell || !!winner || currentPlayer !== myMark || playersCount < 2}
            >
              {cell === 'X' && <XIcon isWinning={isWinningCell} />}
              {cell === 'O' && <OIcon isWinning={isWinningCell} />}
              
              {!cell && !winner && currentPlayer === myMark && playersCount === 2 && (
                <div className={`absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 ${currentPlayer === 'X' ? 'bg-cyan-400' : 'bg-magenta-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={restartGame}
          className="mt-12 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full font-black tracking-[0.2em] transition-all hover:scale-110 active:scale-95 text-xs md:text-sm uppercase"
        >
          Reset Game
        </button>
        <button
          onClick={() => setInRoom(false)}
          className="mt-12 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full font-black tracking-[0.2em] transition-all hover:scale-110 active:scale-95 text-xs md:text-sm uppercase"
        >
          Leave Room
        </button>
      </div>

      <div className="fixed bottom-4 text-white/20 text-xs font-mono tracking-widest uppercase">
        Multiplayer Arcade
      </div>
    </div>
  );
};

export default TicTacToe;
