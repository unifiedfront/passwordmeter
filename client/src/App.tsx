import { useMemo, useState } from 'react';
import zxcvbn from 'zxcvbn';

interface Estimate {
  entropy: number;
  crackSeconds: number;
  crackTime: string;
  suggestion: string;
  variety: number;
}

const PRESETS = [
  { label: 'Classic weak', value: 'password123' },
  { label: 'Better with mix', value: 'C@ts4Life' },
  { label: 'Passphrase', value: 'giraffe planet dance 2024!' },
  { label: 'Super strong', value: 'Zy9!mN&QpL#7' }
];

const INFO = {
  mfa: 'Multi-factor authentication (MFA) adds another lock on your account even if someone guesses your password.',
  passkeys: 'Passkeys replace passwords with a secure key stored on your device. They are phishing-resistant and fast to use.'
};

const LEVELS = [
  { minEntropy: 0, label: 'Very weak', color: '#ef4444' },
  { minEntropy: 30, label: 'Okay', color: '#f59e0b' },
  { minEntropy: 45, label: 'Strong', color: '#10b981' },
  { minEntropy: 60, label: 'Excellent', color: '#14b8a6' }
];

const CHARACTER_SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz'.length,
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.length,
  digits: '0123456789'.length,
  symbols: "!@#$%^&*()-_=+[]{};:'\",.<>/?`~|".length
};

function strengthFromEntropy(entropy: number) {
  return LEVELS.reduce((current, level) => (entropy >= level.minEntropy ? level : current), LEVELS[0]);
}

function varietyLabel(variety: number) {
  const map = ['just one type', 'two types', 'three types', 'four types'];
  return map[variety - 1] ?? 'no variety yet';
}

function estimateEntropy(password: string) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += CHARACTER_SETS.lower;
  if (/[A-Z]/.test(password)) charsetSize += CHARACTER_SETS.upper;
  if (/[0-9]/.test(password)) charsetSize += CHARACTER_SETS.digits;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += CHARACTER_SETS.symbols;
  const length = password.length;
  if (length === 0 || charsetSize === 0) return 0;
  return Math.round(length * Math.log2(charsetSize));
}

function estimateCrackTimeSeconds(password: string) {
  const entropy = estimateEntropy(password);
  const guessesPerSecond = 1e10; // optimistic attacker speed
  const totalGuesses = Math.pow(2, entropy);
  return totalGuesses / guessesPerSecond / 2; // average case
}

function formatDuration(seconds: number) {
  if (!isFinite(seconds) || seconds <= 0) return 'almost instantly';
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [365, 'day'],
    [100, 'year']
  ];

  let value = seconds;
  let unit = 'second';
  for (const [step, name] of units) {
    if (value < step) {
      unit = name;
      break;
    }
    value /= step;
    unit = name;
  }

  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  const suffix = rounded === 1 ? '' : 's';
  return `${rounded} ${unit}${suffix}`;
}

function passwordFeedback(password: string) {
  const entropy = estimateEntropy(password);
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((regex) => regex.test(password)).length;
  const suggestions: string[] = [];

  if (password.length < 12) suggestions.push('Try a longer password or passphrase.');
  if (variety < 3) suggestions.push('Mix uppercase, lowercase, numbers, and symbols.');
  if (!/\s/.test(password) && password.length >= 16) suggestions.push('Passphrases with spaces are memorable and strong.');
  if (suggestions.length === 0) suggestions.push('Nice job! This looks strong.');

  return { entropy, variety, suggestions };
}

function scorePassword(password: string): Estimate {
  const entropy = estimateEntropy(password);
  const crackSeconds = estimateCrackTimeSeconds(password);
  const feedback = passwordFeedback(password);

  return {
    entropy,
    crackSeconds,
    crackTime: formatDuration(crackSeconds),
    suggestion: password.length ? feedback.suggestions[0] : 'Type a password to see how strong it is!',
    variety: feedback.variety
  };
}

function App() {
  const [password, setPassword] = useState('password123');
  const estimate = useMemo(() => scorePassword(password), [password]);
  const level = useMemo(() => strengthFromEntropy(estimate.entropy), [estimate.entropy]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Career Fair Demo</p>
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
              <p className="label">Entropy score</p>
              <p className="entropy">{estimate.entropy} bits</p>
            </div>
            <div className="strength" style={{ color: level.color }}>
              {level.label}
            </div>
          </div>
          <div className="meter-bar" aria-label={`Strength: ${level.label}`}>
            <div className="fill" style={{ width: `${Math.min(estimate.entropy, 80) + 20}%`, background: level.color }} />
          </div>
          <p className="crack-time">
            Estimated crack time: <strong>{estimate.crackTime}</strong>
          </p>
          <p className="variety">Character variety: {varietyLabel(estimate.variety)}</p>
          <p className="suggestion">{estimate.suggestion}</p>
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
