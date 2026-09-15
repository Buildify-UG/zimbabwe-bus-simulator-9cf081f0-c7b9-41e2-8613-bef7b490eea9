import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface Passenger {
  id: number;
  x: number;
  y: number;
  waiting: boolean;
  boarded: boolean;
}

interface Stop {
  id: number;
  name: string;
  x: number;
  y: number;
  passengers: number;
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState({
    busX: 50,
    busY: 300,
    speed: 0,
    passengers: 0,
    money: 0,
    fuel: 100,
    damage: 0,
    score: 0,
    gameOver: false,
    soundOn: true,
  });

  const [stops] = useState<Stop[]>([
    { id: 1, name: 'Harare CBD', x: 100, y: 150, passengers: 5 },
    { id: 2, name: 'Avondale', x: 350, y: 200, passengers: 3 },
    { id: 3, name: 'Southerton', x: 600, y: 250, passengers: 4 },
    { id: 4, name: 'Mbare', x: 800, y: 150, passengers: 6 },
  ]);

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        let newState = { ...prev };

        // Movement
        if (keysPressed.current['arrowup'] || keysPressed.current['w']) {
          newState.speed = Math.min(newState.speed + 0.5, 8);
          newState.busY -= newState.speed;
        }
        if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
          newState.speed = Math.max(newState.speed - 0.5, -4);
          newState.busY += Math.abs(newState.speed) * 0.5;
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
          newState.busX += newState.speed * 1.5;
        }
        if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
          newState.busX -= newState.speed * 1.5;
        }

        // Friction
        if (!keysPressed.current['arrowup'] && !keysPressed.current['w']) {
          newState.speed *= 0.95;
        }

        // Boundaries
        newState.busX = Math.max(20, Math.min(900, newState.busX));
        newState.busY = Math.max(50, Math.min(550, newState.busY));

        // Fuel consumption
        newState.fuel -= Math.abs(newState.speed) * 0.1;

        // Check stop proximity
        stops.forEach((stop) => {
          const dist = Math.hypot(newState.busX - stop.x, newState.busY - stop.y);
          if (dist < 60 && Math.abs(newState.speed) < 1) {
            if (stop.passengers > 0) {
              const pickUp = Math.min(stop.passengers, 10 - newState.passengers);
              newState.passengers += pickUp;
              newState.money += pickUp * 50;
              newState.score += pickUp * 100;
              stop.passengers = 0;
            }
          }
        });

        // Game over conditions
        if (newState.fuel <= 0) {
          newState.gameOver = true;
        }
        if (newState.damage > 100) {
          newState.gameOver = true;
        }

        // Random damage from potholes
        if (Math.random() < 0.02 && newState.speed > 2) {
          newState.damage += Math.random() * 5;
        }

        return newState;
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [stops]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 100, canvas.width, 400);

    // Road markings
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(canvas.width, 300);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw stops
    stops.forEach((stop) => {
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stop.passengers.toString(), stop.x, stop.y + 4);
    });

    // Draw bus
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(gameState.busX - 25, gameState.busY - 15, 50, 30);
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(gameState.busX - 20, gameState.busY - 12, 15, 12);
    ctx.fillRect(gameState.busX + 5, gameState.busY - 12, 15, 12);

    // Draw windows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(gameState.busX - 18, gameState.busY - 10, 8, 8);
    ctx.strokeRect(gameState.busX + 10, gameState.busY - 10, 8, 8);
  }, [gameState, stops]);

  const handleReset = () => {
    setGameState({
      busX: 50,
      busY: 300,
      speed: 0,
      passengers: 0,
      money: 0,
      fuel: 100,
      damage: 0,
      score: 0,
      gameOver: false,
      soundOn: true,
    });
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-300 to-sky-100 flex flex-col items-center justify-center p-4">
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🚌 Zimbabwe Bus Simulator</h1>
        <p className="text-gray-700 text-center">Navigate the streets of Harare! Use Arrow Keys or WASD to drive</p>
      </div>

      <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="border-4 border-gray-800"
        />

        {/* HUD */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded font-mono text-sm space-y-2">
          <div>💰 Money: ${gameState.money}</div>
          <div>👥 Passengers: {gameState.passengers}/10</div>
          <div>⛽ Fuel: {Math.max(0, gameState.fuel.toFixed(1))}%</div>
          <div>🔧 Damage: {gameState.damage.toFixed(1)}%</div>
          <div>⭐ Score: {gameState.score}</div>
        </div>

        {/* Game Over Screen */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <h2 className="text-5xl font-bold text-white mb-4">GAME OVER</h2>
            <p className="text-2xl text-yellow-300 mb-2">Final Score: {gameState.score}</p>
            <p className="text-xl text-white mb-6">Money Earned: ${gameState.money}</p>
            <button
              onClick={handleReset}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg flex items-center gap-2 text-lg"
            >
              <RotateCcw size={24} />
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">How to Play</h2>
        <ul className="space-y-2 text-gray-700">
          <li>🎮 <strong>Arrow Keys or WASD:</strong> Drive the bus</li>
          <li>🛑 <strong>Slow down</strong> to pick up passengers at red stops</li>
          <li>💰 <strong>Earn money</strong> for each passenger you transport</li>
          <li>⛽ <strong>Watch your fuel</strong> - it runs out quickly!</li>
          <li>⚠️ <strong>Avoid potholes</strong> - they damage your bus</li>
          <li>🎯 <strong>Goal:</strong> Maximize your score before running out of fuel!</li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
