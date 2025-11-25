import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface SnowEffectHandle {
  triggerPlow: () => void;
}

const SnowEffect = forwardRef<SnowEffectHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for animation accessible by imperative handle
  const plowState = useRef({
    isPlowing: false,
    x: -200
  });

  useImperativeHandle(ref, () => ({
    triggerPlow: () => {
      if (!plowState.current.isPlowing) {
        plowState.current.isPlowing = true;
        plowState.current.x = -200;
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Ground Setup
    const groundResolution = 4;
    let groundPoints = Math.ceil(width / groundResolution);
    let groundHeight = new Float32Array(groundPoints).fill(0);
    const MAX_SNOW_HEIGHT = 160; // Threshold to trigger plow (approx button height)

    // Snowflakes Setup
    const flakes: any[] = [];
    const maxFlakes = 250;

    const plowSpeed = 5;
    const sprayParticles: any[] = [];

    const createFlake = (w: number, h: number) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.5 + 1, 
        v: Math.random() * 2 + 1.5, 
        o: Math.random() * 0.5 + 0.3, 
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01
    });

    // Init Flakes
    for (let i = 0; i < maxFlakes; i++) {
      flakes.push(createFlake(width, height));
    }

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      groundPoints = Math.ceil(width / groundResolution);
      // Reset ground on resize to prevent array index errors, simpler than resizing array
      groundHeight = new Float32Array(groundPoints).fill(0);
    };

    window.addEventListener('resize', resize);
    resize(); // Trigger once

    let animationId: number;

    const update = () => {
      ctx.clearRect(0, 0, width, height);
      
      // --- 1. Logic Check: Trigger Plow? ---
      // We check plowState.current instead of local var
      if (!plowState.current.isPlowing) {
          let peak = 0;
          // Sample every 20 points
          for(let i=0; i<groundPoints; i+=20) {
              if (groundHeight[i] > peak) peak = groundHeight[i];
          }
          if (peak > MAX_SNOW_HEIGHT) {
            plowState.current.isPlowing = true;
            plowState.current.x = -150; // Start off-screen left
          }
      }

      // --- 2. Update & Draw Snowflakes ---
      ctx.fillStyle = 'white';
      const wind = 0.5;

      for (let i = 0; i < maxFlakes; i++) {
        const f = flakes[i];
        f.y += f.v;
        f.x += Math.sin(f.y * f.swaySpeed + f.swayOffset) * 0.5 + wind;

        const groundIdx = Math.floor(f.x / groundResolution);
        const currentGroundHeight = (groundIdx >= 0 && groundIdx < groundPoints) ? groundHeight[groundIdx] : 0;
        
        // Hit ground?
        if (f.y >= height - currentGroundHeight) {
           // Accumulate if valid index and not too high (absolute cap 250)
           if (groundIdx >= 0 && groundIdx < groundPoints && currentGroundHeight < 250) { 
              groundHeight[groundIdx] += f.r * 0.4; 
              // Smoothing
              if(groundIdx > 0) groundHeight[groundIdx-1] += f.r * 0.2;
              if(groundIdx < groundPoints - 1) groundHeight[groundIdx+1] += f.r * 0.2;
           }
           
           // Reset to top
           Object.assign(f, createFlake(width, -10));
        }

        // Wrap x
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;

        // Draw
        ctx.globalAlpha = f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 3. Draw Ground ---
      ctx.globalAlpha = 1.0;
      const grad = ctx.createLinearGradient(0, height - 150, 0, height);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#cbd5e1'); 
      ctx.fillStyle = grad;
      
      ctx.beginPath();
      ctx.moveTo(0, height);
      for(let i = 0; i < groundPoints; i++) {
         ctx.lineTo(i * groundResolution, height - groundHeight[i]);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- 4. Plow Animation ---
      if (plowState.current.isPlowing) {
          plowState.current.x += plowSpeed;
          const currentPlowX = plowState.current.x;
          
          // Determine Blade Position
          const bladeX = currentPlowX + 110; 
          
          // Clear Ground Logic
          const startIdx = Math.floor((currentPlowX + 80) / groundResolution);
          const endIdx = Math.floor((bladeX + 10) / groundResolution);
          
          for(let i = startIdx; i <= endIdx; i++) {
              if (i >= 0 && i < groundPoints) {
                  const h = groundHeight[i];
                  if (h > 10) {
                      // Chance to spawn spray particle based on height of snow removed
                      if (Math.random() < 0.3) {
                          sprayParticles.push({
                              x: i * groundResolution,
                              y: height - h,
                              vx: Math.random() * 4 + 2,
                              vy: -(Math.random() * 5 + 5),
                              life: 1.0,
                              size: Math.random() * 3 + 1
                          });
                      }
                  }
                  // Flatten ground
                  groundHeight[i] = Math.max(0, groundHeight[i] * 0.1); 
              }
          }

          // Draw Spray Particles
          for (let i = sprayParticles.length - 1; i >= 0; i--) {
              const p = sprayParticles[i];
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.4; // gravity
              p.life -= 0.02;
              
              if (p.life <= 0) {
                  sprayParticles.splice(i, 1);
              } else {
                  ctx.globalAlpha = p.life;
                  ctx.fillStyle = 'white';
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                  ctx.fill();
              }
          }

          // Draw Truck Graphic
          ctx.globalAlpha = 1.0;
          ctx.save();
          ctx.translate(currentPlowX, height - 20); // Truck baseline near bottom
          
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.ellipse(60, 5, 70, 10, 0, 0, Math.PI*2); ctx.fill();

          // Body (Red)
          ctx.fillStyle = '#dc2626'; 
          ctx.fillRect(0, -40, 80, 40); // Cab
          ctx.fillRect(80, -25, 20, 25); // Nose

          // Window
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(5, -35, 40, 20);
          
          // Text
          ctx.fillStyle = 'white';
          ctx.font = '900 10px Arial';
          ctx.fillText('PARKSTAD', 5, -5);

          // Wheels
          ctx.fillStyle = '#1e293b';
          ctx.beginPath(); ctx.arc(20, 0, 12, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(80, 0, 12, 0, Math.PI*2); ctx.fill();

          // Plow Blade (Silver)
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(105, 0);
          ctx.lineTo(105, -30);
          ctx.quadraticCurveTo(115, -15, 120, 0);
          ctx.fill();
          
          // Flash Light
          const flash = Math.floor(Date.now() / 100) % 2 === 0;
          ctx.fillStyle = flash ? '#facc15' : '#854d0e';
          ctx.beginPath();
          ctx.arc(40, -40, 5, Math.PI, 0); 
          ctx.fill();
          if (flash) {
             ctx.shadowColor = '#facc15';
             ctx.shadowBlur = 15;
             ctx.beginPath(); ctx.arc(40, -45, 10, 0, Math.PI*2); ctx.fill();
             ctx.shadowBlur = 0;
          }

          ctx.restore();

          if (currentPlowX > width + 100) {
            plowState.current.isPlowing = false;
          }
      }

      animationId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
});

export default SnowEffect;