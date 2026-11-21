
import { useEffect, useState } from 'react'
import './App.css'

type Mode = 'Focus' | 'Short Break' | 'Long Break'

const durations: Record<Mode, number> = {
  Focus: 25 * 60,
  'Short Break': 5 * 60,
  'Long Break': 15 * 60,
}

function playCompletionSound() {
  try {
    const audioContext = new window.AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.connect(gain)
    gain.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)

    gain.gain.setValueAtTime(0.2, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 1,
    )

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 1)

    oscillator.onended = () => {
      void audioContext.close()
    }
  } catch (error) {
    console.error('Unable to play completion sound:', error)
  }
}

function App() {
  const [mode, setMode] = useState<Mode>('Focus')
  const [timeLeft, setTimeLeft] = useState(durations.Focus)
  const [isRunning, setIsRunning] = useState(false)

  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem('focusflow-sessions')
    return savedSessions ? Number(savedSessions) : 0
  })

  const [showBreakSuggestion, setShowBreakSuggestion] = useState(false)

  // Save completed sessions
  useEffect(() => {
    localStorage.setItem('focusflow-sessions', String(sessions))
  }, [sessions])

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, mode])

  // Handle timer completion
  useEffect(() => {
    if (timeLeft !== 0 || !isRunning) return

    setIsRunning(false)
    playCompletionSound()

    if (mode === 'Focus') {
      setSessions((count) => count + 1)
      setShowBreakSuggestion(true)
    } else {
      setShowBreakSuggestion(false)
    }

    if (
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('FocusFlow', {
        body:
          mode === 'Focus'
            ? 'Focus session completed! Time for a break.'
            : 'Your break is over. Ready to focus again?',
      })
    }
  }, [timeLeft, isRunning, mode])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        await Notification.requestPermission()
      } catch (error) {
        console.error('Notification permission error:', error)
      }
    }
  }

  // Start and pause timer
  const handleStartPause = () => {
    if (!isRunning && timeLeft > 0) {
      void requestNotificationPermission()
    }

    setIsRunning((running) => !running)
  }

  // Change timer mode
  const changeMode = (newMode: Mode) => {
    setMode(newMode)
    setTimeLeft(durations[newMode])
    setIsRunning(false)
    setShowBreakSuggestion(false)
  }

  // Start suggested short break
  const startShortBreak = () => {
    setMode('Short Break')
    setTimeLeft(durations['Short Break'])
    setShowBreakSuggestion(false)
    setIsRunning(true)
  }

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(durations[mode])
    setShowBreakSuggestion(false)
  }

  // Format timer
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`
  }

  const progress =
    ((durations[mode] - timeLeft) / durations[mode]) * 100

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="dashboard">
        <header className="topbar">
          <a className="brand" href="/">
            <span className="brand-icon">F</span>
            <span>
              focus<span className="brand-light">flow.</span>
            </span>
          </a>

          <div className="topbar-right">
            <span className="live-dot" />
            <span className="status-text">YOUR FOCUS SPACE</span>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">STAY PRESENT. GET THINGS DONE.</p>
            <h1>
              Make time <span>count.</span>
            </h1>
            <p className="welcome-text">
              One focused session at a time. You've got this.
            </p>
          </div>

          <div className="session-card">
            <span className="session-label">COMPLETED SESSIONS</span>

            <div className="session-value">
              {String(sessions).padStart(2, '0')}
              <span> / 04</span>
            </div>

            <div className="session-dots">
              {[1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={sessions >= item ? 'dot filled' : 'dot'}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="timer-panel">
          <div className="timer-heading">
            <span className="section-label">YOUR TIMER</span>

            <span className="timer-status">
              <span className="live-dot" />
              {isRunning
                ? 'SESSION IN PROGRESS'
                : 'READY WHEN YOU ARE'}
            </span>
          </div>

          <div className="mode-tabs">
            {(['Focus', 'Short Break', 'Long Break'] as Mode[]).map(
              (item) => (
                <button
                  key={item}
                  className={`mode-tab ${mode === item ? 'active' : ''}`}
                  onClick={() => changeMode(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <div className="timer-area">
            <div
              className="timer-ring"
              style={{
                background: `conic-gradient(#B7FF3C ${progress}%, #263026 ${progress}%)`,
              }}
            >
              <div className="timer-inner">
                <span className="timer-mode">
                  {mode.toUpperCase()}
                </span>

                <h2>{formatTime(timeLeft)}</h2>

                <span className="timer-caption">
                  {isRunning ? 'Stay in the zone' : 'Time to focus'}
                </span>
              </div>
            </div>

            <div className="timer-decoration decoration-one" />
            <div className="timer-decoration decoration-two" />
          </div>

          <div className="timer-controls">
            <button className="reset-button" onClick={resetTimer}>
              ↺
              <span>Reset</span>
            </button>

            <button
              className="start-button"
              onClick={handleStartPause}
              disabled={timeLeft === 0}
            >
              <span>{isRunning ? 'Ⅱ' : '▶'}</span>
              {isRunning ? 'Pause Session' : 'Start Focus'}
            </button>
          </div>

          <p className="timer-hint">
            {isRunning
              ? 'Keep going. Every second counts.'
              : 'Take a breath. Start whenever you are ready.'}
          </p>

          {showBreakSuggestion && (
            <div
              style={{
                marginTop: '20px',
                padding: '18px',
                border: '1px solid #66745A',
                borderRadius: '14px',
                background: 'rgba(102, 116, 90, 0.12)',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#B7FF3C', fontWeight: 600 }}>
                🎉 Great job! Focus session completed.
              </p>

              <p style={{ color: '#F0F2EB', margin: '8px 0 14px' }}>
                Take a 5-minute break and recharge.
              </p>

              <button
                className="start-button"
                onClick={startShortBreak}
              >
                ▶ Start Short Break
              </button>
            </div>
          )}
        </section>

        <footer className="footer">
          <span>FOCUSFLOW © 2026</span>
          <span>LESS DISTRACTION. MORE DIRECTION.</span>
        </footer>
      </div>
    </main>
  )
}

export default App
