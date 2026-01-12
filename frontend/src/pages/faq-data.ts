export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
}

export const faqItems: FaqItem[] = [
  // Getting Started
  {
    id: 'how-does-it-work',
    question: 'How does TapLock work?',
    answer: 'TapLock uses passkeys for authentication. You choose a username, then authenticate with your fingerprint, face ID, or security key. Once authenticated, you can store and access your secrets. No passwords to remember, no complex setup required.',
    category: 'Getting Started'
  },
  {
    id: 'what-are-passkeys',
    question: 'What are passkeys and why are they better than passwords?',
    answer: 'Passkeys are a new authentication standard that replaces passwords. They use your device\'s biometrics (fingerprint, face ID) or security keys instead of typed passwords. They\'re more secure because they can\'t be phished, reused, or stolen in data breaches. Plus, they\'re much more convenient - just tap or glance to sign in.',
    category: 'Getting Started'
  },
  {
    id: 'why-others-dont-use-passkeys',
    question: 'Why don\'t other secret managers use passkeys?',
    answer: 'Many secret managers were built before passkeys became widely available. They rely on traditional "master password" systems that require you to remember one complex password to unlock all your others. TapLock was built from the ground up to take advantage of modern passkey technology, making it simpler and more secure.',
    category: 'Getting Started'
  },
  {
    id: 'can-passkeys-be-phished',
    question: 'Can passkeys be phished like passwords?',
    answer: 'No, this is one of the key security advantages of passkeys. Passkeys are bound to the original website or app that created them. Even if you visit a fake phishing site, your passkey won\'t work there - it will only work on the real TapLock. This makes them immune to phishing attacks that steal passwords.',
    category: 'Getting Started'
  },

  // Security & Privacy
  {
    id: 'how-encryption-works',
    question: 'How does TapLock encrypt my secrets?',
    answer: 'TapLock uses client-side AES-256-GCM encryption. Your secrets are encrypted on your device using a key derived from your passkey before they ever leave your device. The server only stores the encrypted data and can never decrypt it. This means even if TapLock\'s servers were breached, your secrets would remain safe and unreadable.',
    category: 'Security & Privacy'
  },
  {
    id: 'can-developer-see-secrets',
    question: 'Can you (the developer) see my secrets?',
    answer: 'No, absolutely not. Because of client-side encryption, your secrets are never stored in a readable format on the servers. I only have access to encrypted data that I cannot decrypt. Your privacy and security are built into the architecture.',
    category: 'Security & Privacy'
  },
  {
    id: 'server-breach',
    question: 'What happens if TapLock\'s servers are breached?',
    answer: 'Your secrets would remain safe. Since all data is encrypted client-side before being stored, a server breach would only expose encrypted data. Without your passkey (which never leaves your device), the encrypted data is useless and cannot be decrypted.',
    category: 'Security & Privacy'
  },

  // Recovery & Backup
  {
    id: 'what-are-recovery-codes',
    question: 'What are recovery codes?',
    answer: 'Recovery codes are 12-character backup codes that allow you to regain access to your account if you lose all your passkeys. Think of them as emergency backup keys - they\'re not for daily use, but they\'re crucial when you need them most.',
    category: 'Recovery & Backup'
  },
  {
    id: 'how-recovery-codes-work',
    question: 'How do recovery codes work?',
    answer: 'Recovery codes are NOT your password. They are one-time use codes that allow you to register new passkeys if you lose access to your existing ones.\n\nThink of it this way:\n- Your passkey is like your house key (what you use daily)\n- Recovery codes are like backup keys with a locksmith (what you use when you\'re locked out)\n\nWhen you use a recovery code, you\'re not "recovering" your old passkey - you\'re creating a new one. The recovery code proves you\'re the account owner and allows you to set up new passkey authentication.',
    category: 'Recovery & Backup'
  },
  {
    id: 'why-need-recovery-codes',
    question: 'Why do I need recovery codes if I have passkeys?',
    answer: 'Passkeys are stored on your devices. If you lose your device, upgrade to a new one, or have device issues, you could lose access to your passkeys. Recovery codes are your safety net - they ensure you can always regain access to your account and set up new passkeys, no matter what happens to your devices.',
    category: 'Recovery & Backup'
  },
  {
    id: 'store-recovery-codes',
    question: 'How should I store my recovery codes?',
    answer: 'Store your recovery codes somewhere safe and separate from your device. Good options include:\n- Printed and stored in a safe or secure location\n- Saved in a password manager you don\'t use for TapLock\n- Stored with other important documents\n- Written down and kept with family members\n\nNever store them in the same device as your TapLock account - that defeats the purpose!',
    category: 'Recovery & Backup'
  },
  {
    id: 'new-recovery-codes',
    question: 'Can I get new recovery codes if I lose them?',
    answer: 'Yes, but you need access to your existing passkeys to generate new ones. If you have access to your account, you can generate a new set of recovery codes. When you do this, your old recovery codes will be invalidated for security. This is why it\'s important to save at least one recovery code safely - so you always have a way back in.',
    category: 'Recovery & Backup'
  },

  // Practical Usage
  {
    id: 'device-support',
    question: 'What devices support passkeys?',
    answer: 'Passkeys are supported on most modern devices:\n- iOS (iPhone/iPad) with Face ID or Touch ID\n- macOS with Touch ID or Apple Watch\n- Android with fingerprint or face unlock\n- Windows 11 with Windows Hello\n- Chrome and Edge browsers on desktop\n- Safari browser on Apple devices\n\nIf your device has biometric authentication, it likely supports passkeys.',
    category: 'Practical Usage'
  },
  {
    id: 'multiple-devices',
    question: 'Can I use TapLock on multiple devices?',
    answer: 'Yes, but you need to set up passkeys on each device separately. When you first sign up, you\'ll create passkeys on your current device. To use TapLock on additional devices, you\'ll need to sign in and create new passkeys on each device. Your secrets sync across all devices, but each device has its own passkeys for security.',
    category: 'Practical Usage'
  },
  {
    id: 'lose-device',
    question: 'What happens if I lose my device?',
    answer: 'If you lose a device with TapLock passkeys:\n1. Your account and secrets remain safe (passkeys only work on that specific device)\n2. Use your recovery codes to sign in on a new device\n3. Create new passkeys on your new device\n4. Optionally, you can remove the lost device\'s passkeys from your account for extra security\n\nThis is why saving your recovery codes safely is so important!',
    category: 'Practical Usage'
  },
  {
    id: 'secrets-limit',
    question: 'Is there a limit to how many secrets I can store?',
    answer: 'Currently, there\'s no strict limit on the number of secrets you can store. However, very large amounts of data might impact performance. For typical use cases (API keys, passwords, notes, etc.), you shouldn\'t encounter any limits. If you have specific needs, feel free to reach out.',
    category: 'Practical Usage'
  },

  // About TapLock
  {
    id: 'is-free',
    question: 'Is TapLock free?',
    answer: 'Yes, TapLock is free to use. There are no subscription fees, no premium tiers, and no hidden costs. The goal is to provide secure, simple secret management for everyone.',
    category: 'About TapLock'
  },
  {
    id: 'self-host',
    question: 'Can I self-host TapLock?',
    answer: 'Yes! TapLock is designed to be self-hostable. You can run it on your own server using Docker or Node.js. This gives you complete control over your data and infrastructure. Check the GitHub repository for self-hosting instructions.',
    category: 'About TapLock'
  },
  {
    id: 'open-source',
    question: 'Is TapLock open source?',
    answer: 'Yes, TapLock is open source. You can view the code, contribute, or run your own instance. The transparency of open source helps build trust and allows the community to verify the security implementations.',
    category: 'About TapLock'
  },
  {
    id: 'trust-control',
    question: 'How can I trust TapLock with my sensitive data?',
    answer: 'Trust is important for secret management. TapLock offers two approaches:\n\n**Public Instance (app.taplock.dev)**:\n- Open source code you can review\n- Client-side encryption means I can\'t read your secrets\n- Zero-knowledge architecture\n- Built on standard, audited technologies (WebAuthn, AES-256-GCM)\n\n**Self-Hosted (Full Control)**:\n- If you want complete control, simply self-host TapLock\n- Docker deployment makes it easy to run on your own infrastructure\n- Your data never leaves your servers\n- You control all configuration and security\n\nThe choice is yours: use the convenient public instance, or self-host for complete control over your data and infrastructure.',
    category: 'About TapLock'
  }
]

export const faqCategories = [
  'Getting Started',
  'Security & Privacy', 
  'Recovery & Backup',
  'Practical Usage',
  'About TapLock'
]