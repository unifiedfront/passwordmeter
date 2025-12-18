import { useMemo, useState } from 'react';
import zxcvbn from 'zxcvbn';

import { Tooltip } from './Tooltip';

interface Estimate {
  entropy: number;
  crackSeconds: number;
  crackTime: string;
  suggestion: string;
  variety: number;
  score: number;
  meterPercent: number;
}

const PRESETS = [
  { label: 'Very weak', value: 'password123' },
  { label: 'Weak (pattern)', value: 'Summer2025!' },
  { label: 'Okay', value: 'D0gz4Life' },
  { label: 'Strong', value: 'D0gz4Life!!-v2' },
  { label: 'Passphrase', value: 'correct horse battery staple' },
  { label: 'Random', value: '7*JGiULWFJtydsK*VdpwtGJw' }
];

const INFO = {
  mfa: 'Multi-factor authentication (MFA) adds another lock on your account even if someone guesses your password.',
  passkeys: 'Passkeys replace passwords with a secure key stored on your device. They are phishing-resistant and fast to use.'
};

const LEVELS = [
  { score: 0, label: 'Very weak', color: '#ef4444' },
  { score: 1, label: 'Weak', color: '#f97316' },
  { score: 2, label: 'Okay', color: '#f59e0b' },
  { score: 3, label: 'Strong', color: '#10b981' },
  { score: 4, label: 'Excellent', color: '#14b8a6' }
];

const LOG2_10 = Math.LN10 / Math.LN2;

function strengthFromScore(score: number) {
  return LEVELS.find((level) => level.score === score) ?? LEVELS[0];
}

function varietyLabel(variety: number) {
  const map = ['just one type', 'two types', 'three types', 'four types'];
  return map[variety - 1] ?? 'no variety yet';
}

function clamp (n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function meterPercentFromGuessesLog10(guessesLog10: number, hasInput: boolean) {
  const min = 3; // ~100 guesses
  const max = 24; // ~1e18 guesses (~century at 1e10 guesses/sec)
  const t = clamp((guessesLog10 - min) / (max - min), 0, 1);

  const gamma = 0.72;
  const curved = Math.pow(t, gamma); // gamma correction

  const pct = Math.round(curved * 100);

  if (!hasInput) return 0;
  return clamp(pct, 1, 100);
}

function scorePassword(password: string): Estimate {
  const result = zxcvbn(password);
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((regex) => regex.test(password)).length;
  const entropy = Math.max(0, Math.round(result.guesses_log10 * LOG2_10));
  const crackSeconds = Number(result.crack_times_seconds.offline_slow_hashing_1e4_per_second); // offline_fast_hashing_1e10_per_second
  const crackTime = String(result.crack_times_display.offline_slow_hashing_1e4_per_second);
  const feedback =
    password.length === 0
      ? 'Type a password to see how strong it is!'
      : result.feedback.warning || result.feedback.suggestions[0] || 'Nice job! This looks strong.';

    console.log(result);

  return {
    entropy,
    crackSeconds,
    crackTime,
    suggestion: feedback,
    variety,
    score: result.score,
    meterPercent: meterPercentFromGuessesLog10(result.guesses_log10, password.length > 0)
  };
}

function App() {
  const [password, setPassword] = useState('password123');
  const estimate = useMemo(() => scorePassword(password), [password]);
  const level = useMemo(() => strengthFromScore(estimate.score), [estimate.score]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>Password Strength Lab</h1>
          <p className="subtitle">
            Type a password or pick a preset to see how long it might take a robot to guess it. Then learn how MFA and
            passkeys keep you even safer.
          </p>
        </div>
        <div className="badge">Built with React and TypeScript</div>
      </header>

      <section className="card">
        <div className="inputs">
          <label htmlFor="password">Try a password</label>
          <input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type something..."
          />
          <div className="presets">
            {PRESETS.map((preset) => (
              <button key={preset.value} onClick={() => setPassword(preset.value)}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="meter">
          <div className="meter-header">
            <div>
              <p className="label">
                Entropy score &nbsp;
                <Tooltip
                  label="What are entropy bits?"
                  content={
                    <>
                      <p><strong>Entropy bits</strong> are a "how hard to guess" number.</p>
                      <p>Each extra bit roughly means a guessing computer has to try about <strong>twice</strong> as many options.</p>
                    </>
                  }
                />
              </p>
              <p className="entropy">{estimate.entropy} bits</p>
            </div>
            <div className="strength" style={{ color: level.color }}>
              {level.label}
            </div>
          </div>
          <div className="meter-bar" aria-label={`Strength: ${level.label}`}>
            <div className="fill" style={{ width: `${estimate.meterPercent}%`, background: level.color }} />
          </div>
          <p className="crack-time">
            Estimated crack time: <strong>{estimate.crackTime}</strong>
          </p>
          <p className="variety">Character variety: {varietyLabel(estimate.variety)}</p>
          <p className="suggestion">{estimate.suggestion}</p>
          <div className="callout">
            <div className="callout-title">Reality check</div>
            <ul>
              <li><strong>Reused passwords</strong> can be broken instantly if they’re already leaked.</li>
              <li>Crack times assume guessing - attackers often try <strong>breach lists</strong> first.</li>
              <li><strong>MFA</strong> helps even if a password is guessed or reused.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid">
        <article className="card info">
          <h2>Why multi-factor authentication (MFA)?</h2>
          <p>{INFO.mfa}</p>
          <ul>
            <li>Even if a password leaks, a one-time code stops attackers.</li>
            <li>App or hardware keys work better than SMS when possible.</li>
            <li>Think of it like needing both a key and a badge to enter.</li>
          </ul>
        </article>
        <article className="card info">
          <h2>Passkeys: the future of logging in</h2>
          <p>{INFO.passkeys}</p>
          <ul>
            <li>No need to type a password at all.</li>
            <li>Works with face unlock, fingerprint, or a device PIN.</li>
            <li>Fast, safe, and hard for attackers to steal.</li>
          </ul>
        </article>
      </section>

      <footer className="footer">Curious minds welcome — ask how you can build tools like this!</footer>
    </div>
  );
}

export default App;
