# FramerIDE Website

The official website for FramerIDE - the first Onchain Development Environment.

## 🚀 What is FramerIDE?

FramerIDE is the first IDE built specifically for onchain development. Stop juggling VS Code, browsers, wallets, terminals, and mobile simulators. Build Base Mini Apps and onchain applications in one unified environment.

**Key Features:**
- Native blockchain simulation
- Built-in wallet injection
- Mobile-first Mini App preview
- Zero context switching
- Rust-powered performance

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Web3:** Coinbase OnchainKit + Wagmi
- **Package Manager:** Yarn 4

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## 🎨 Features

### Mini App Preview
The website includes a working Mini App preview modal that:
- Loads external Mini Apps via iframe
- Injects wallet provider for testing
- Supports mobile-responsive preview
- Handles cross-origin wallet communication

### Wallet Integration
- Coinbase OnchainKit integration
- Base network support
- Wallet connection UI
- Transaction simulation ready

### Theme Support
- Light/dark mode toggle
- System preference detection
- Smooth theme transitions
- Base brand colors

## 🔧 Development

### Environment Setup
```bash
# Node.js version requirement
node --version  # Should be 20.19+ or 22.12+

# Install dependencies
yarn install
```

### Available Scripts
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn lint` - Run ESLint
- `yarn preview` - Preview production build

### Code Style
- TypeScript strict mode enabled
- ESLint with React hooks rules
- Tailwind CSS for styling
- Component-based architecture

## 🌐 Deployment

The site is optimized for static hosting on platforms like:
- Vercel
- Netlify
- GitHub Pages
- Base hosting solutions

Build artifacts are generated in the `dist/` directory.

## 🤝 Contributing

This is the marketing site for FramerIDE. For the main IDE development, see the main FramerIDE repository.

### Local Development
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `yarn dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [FramerIDE Main Repo](../FramerIDE/)
- [Base Documentation](https://docs.base.org)
- [OnchainKit Docs](https://onchainkit.xyz)

---

**Building the future of onchain development, one commit at a time.** 🔵
