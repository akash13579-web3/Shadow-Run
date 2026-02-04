
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { LEVELS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [hp, setHp] = useState(100);
  const [kills, setKills] = useState(0);
  const [lastAction, setLastAction] = useState<'sword' | null>(null);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setCurrentLevel(0);
    setHp(100);
    setKills(0);
  };

  const continueMission = () => {
    setGameState(GameState.PLAYING);
    // Keep currentLevel as is
    setHp(100);
    setKills(0);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1);
      setKills(0);
      setHp(100);
      setGameState(GameState.PLAYING);
    } else {
      setGameState(GameState.VICTORY);
    }
  };

  const handleAction = (action: 'sword') => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 50);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#02040a] select-none touch-none">
      <GameCanvas 
        gameState={gameState}
        levelData={LEVELS[currentLevel]}
        onGameOver={() => setGameState(GameState.GAME_OVER)}
        onLevelClear={() => setGameState(GameState.LEVEL_CLEAR)}
        onHpChange={setHp}
        onKillsChange={setKills}
        externalAction={lastAction}
      />

      {/* UI HUD */}
      {gameState === GameState.PLAYING && (
        <>
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold text-white uppercase tracking-[0.2em] opacity-40">Vitality</div>
              <div className="w-48 h-2 bg-gray-900/50 rounded-full border border-white/5 overflow-hidden backdrop-blur-sm">
                <div 
                  className={`h-full transition-all duration-500 ${hp < 40 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${hp}%`, boxShadow: `0 0 10px ${hp < 40 ? '#ef4444' : '#06b6d4'}` }} 
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-white uppercase tracking-[0.2em] opacity-40">Mission {currentLevel + 1}</div>
              <div className="text-4xl font-black text-white italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {kills}<span className="text-lg opacity-30 ml-1">/ {LEVELS[currentLevel].targetEnemies + LEVELS[currentLevel].bossCount}</span>
              </div>
            </div>
          </div>

          {/* Combat Button - Single Lethal Blade */}
          <div className="absolute bottom-12 right-12 z-30">
            <button 
              onPointerDown={(e) => { e.stopPropagation(); handleAction('sword'); }}
              className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all shadow-2xl group"
            >
              <div className="relative">
                 <div className="w-12 h-1 bg-white/80 rotate-45 rounded-full group-active:scale-110 transition-transform shadow-[0_0_10px_#fff]"></div>
                 <div className="absolute top-[-20px] left-0 right-0 text-center text-[8px] text-white font-bold tracking-widest opacity-40">STRIKE</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Menu & Screens */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-6">
          <div className="mb-8 relative">
             <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 text-center">
              MOONLIGHT<br/>ASSASSIN
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>
          
          <button 
            onClick={startGame}
            className="px-20 py-6 bg-white text-black font-black rounded-full hover:tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95"
          >
            BEGIN HUNT
          </button>
          
          <div className="mt-12 grid grid-cols-2 gap-8 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-t border-white/5 pt-8">
            <div className="text-center">Touch Sides<br/>to Run</div>
            <div className="text-center">Multi-Tap<br/>to Parkour</div>
          </div>
        </div>
      )}

      {gameState === GameState.LEVEL_CLEAR && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl text-white">
          <h2 className="text-8xl font-black mb-2 italic text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">CLEAR</h2>
          <p className="text-gray-500 font-mono tracking-widest mb-12 uppercase text-sm">Targets neutralized. Exiting zone.</p>
          <button 
            onClick={nextLevel}
            className="px-16 py-5 border-2 border-cyan-500 text-cyan-500 font-black rounded-full hover:bg-cyan-500 hover:text-white transition-all"
          >
            CONTINUE
          </button>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-2xl text-white p-6 text-center">
          <h2 className="text-8xl font-black mb-4 italic text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">FAILED</h2>
          <p className="text-red-200/50 font-bold tracking-[0.3em] uppercase text-xs mb-12">The mission was compromised.</p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={continueMission}
              className="w-full py-6 bg-white text-black font-black rounded-xl shadow-2xl active:scale-95 transition-all"
            >
              CONTINUE THIS MISSION
            </button>
            <button 
              onClick={startGame}
              className="w-full py-5 border-2 border-white/20 text-white/60 font-black rounded-xl hover:border-white hover:text-white active:scale-95 transition-all text-sm"
            >
              START FROM LEVEL 1
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.VICTORY && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-8">
          <h2 className="text-8xl font-black mb-4 text-cyan-400 italic">LEGEND</h2>
          <p className="text-gray-500 tracking-widest mb-12 text-center max-w-sm uppercase text-xs">The rooftops are silent. You are the shadow in the moon.</p>
          <button 
            onClick={startGame}
            className="px-20 py-6 bg-white text-black font-black rounded-full shadow-2xl active:scale-95 transition-all"
          >
            RESTART HUNT
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
