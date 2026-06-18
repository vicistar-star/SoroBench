# Contributing to SoroBench

First off, thank you for considering contributing to SoroBench! It's people like you who make SoroBench such a great tool for the Soroban ecosystem.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 18.x)
- [npm](https://www.npmjs.com/) (>= 10.x)
- [Rust](https://www.rust-lang.org/) (latest stable)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup#install-the-stellar-cli)

### Setup

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SoroBench.git
   cd SoroBench
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## 🛠 Development Workflow

This project is a monorepo managed by [Turbo](https://turbo.build/).

- **Build everything**: `npm run build`
- **Linting**: `npm run lint`
- **Testing**: `npm run test`
- **Formatting**: `npm run format`
- **Development (Dashboard)**: `npm run dev:dashboard`

### Project Structure

- `packages/cli`: The command-line interface for SoroBench.
- `packages/runner`: Core logic for running benchmarks and collecting metrics.
- `packages/rust-harness`: Rust library for instrumenting contracts.
- `packages/flamegraph`: Logic for generating flame graphs from traces.
- `packages/storage`: Data persistence layer (SQLite/File).
- `packages/dashboard`: Web-based visualization dashboard.

## 🤝 Pull Request Process

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and ensure they follow the project's coding standards.
3. Run tests and linting to make sure everything is working as expected.
4. Commit your changes with descriptive commit messages.
5. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Open a Pull Request on the main SoroBench repository.

## 🌈 Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📜 Coding Standards

- Use TypeScript for all JavaScript/TypeScript packages.
- Follow the existing code style and formatting (Prettier is used).
- Write clear, commented code where necessary.
- Ensure all new features are accompanied by appropriate tests.

## 🐞 Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub using the provided templates.

## 📄 License

By contributing to SoroBench, you agree that your contributions will be licensed under the [MIT License](LICENSE).
