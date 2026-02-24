# 🎰 Project: Lina's Deluxe Casino

## 1. Project Overview
- **Goal:** A high-end web-based casino simulation featuring multiple classic games.
- **Tech Stack:** Vanilla HTML, CSS, JavaScript.
- **Core Value:** Premium Visuals, Fair RNG, Persistent Economy.

## 2. Core Systems
### 2.1 Global Wallet System
- **Chips:** Primary currency for betting.
- **Gold:** Premium currency earned through achievements or daily login.
- **Storage:** Use `localStorage` to save user balance and history.

### 2.2 Shared Game Engine
- **Fair RNG:** Centralized random number generator to ensure transparency.
- **Event Bus:** Handle game state transitions (Betting -> Playing -> Result -> Payout).
- **Sound Manager:** Immersive casino ambient sounds and UI feedback.

## 3. Game Roadmap
### Phase 1: Blackjack (MVP)
- Dealer AI logic.
- Card deck management (Shuffle, Dealing).
- Player actions: Hit, Stand, Double Down, Split.
- Payout logic: 2:1 for Blackjack, 1:1 for Win.

### Phase 2: Roulette
- Physics-based (or CSS animation) wheel rotation.
- Betting board: Inside bets (Straight, Split) & Outside bets (Color, Even/Odd).
- Result calculation based on wheel stop position.

### Phase 3: Slots & Daily Bonus
- 3-reel or 5-reel slot machines.
- Daily lucky spin wheel for free chips.

## 4. Design Guidelines (Aesthetics)
- **Palette:** #076324 (Casino Green), #D4AF37 (Gold), #1A1A1A (Carbon Black).
- **Typography:** Serif fonts for a classic luxury feel (e.g., 'Playfair Display').
- **Interaction:** Smooth card transitions, haptic vibration feedback (for mobile), and glowing win effects.

## 5. Sparring Points (Critical Checks)
- **Balance:** How to prevent the player from going bankrupt too quickly? (Strategy: Daily refill).
- **Security:** Preventing simple F12 console manipulation for infinite chips (Strategy: Code obfuscation and local encryption).
- **Addiction:** Implement a 'Play Responsibly' notice for ethical game design.
