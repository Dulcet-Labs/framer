import { useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { WelcomeHero } from './components/WelcomeHero';
import { BottomBar } from './components/BottomBar';
import { WaitlistModal } from './components/WaitlistModal';
import { Toast } from './components/Toast';
import type { ToastProps } from './components/Toast';
import { MiniAppModal } from './components/MiniAppModal';
import type { MiniAppConfig } from './components/MiniAppModal';
import confetti from 'canvas-confetti';

function App() {
  // Waitlist Modal State
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState<ToastProps>({
    show: false,
    message: '',
    type: 'success',
  });

  // Mini App Modal State
  const [isAppCollapsed, setIsAppCollapsed] = useState(true);
  const [miniApp, setMiniApp] = useState<MiniAppConfig>({
    name: 'MyApp',
    icon: '/mini-app-model/myApp.svg',
    url: '',
  });

  // Waitlist Logic
  const handleWaitlistSuccess = () => {
    setIsWaitlistOpen(false);
    triggerSideConfetti();
    showToast('Successfully joined the waitlist!', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const triggerSideConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#007aff', '#ffffff', '#f2f2f7'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#007aff', '#ffffff', '#f2f2f7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return (
    <>
      <ThemeToggle />

      <WelcomeHero onStartBuilding={() => setIsWaitlistOpen(true)} />

      <BottomBar />

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        onSuccess={handleWaitlistSuccess}
        onError={(msg) => showToast(msg, 'error')}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />

      <MiniAppModal
        miniApp={miniApp}
        setMiniApp={setMiniApp}
        isAppCollapsed={isAppCollapsed}
        setIsAppCollapsed={setIsAppCollapsed}
      />
    </>
  );
}

export default App;
