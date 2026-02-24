/**
 * Terry's Deluxe Casino - Blackjack Pro Engine
 */

class Card {
    constructor(suit, value, isHidden = false) {
        this.suit = suit;
        this.value = value;
        this.isHidden = isHidden;
        this.element = this.createCardElement();
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = `card dealt ${this.isHidden ? '' : 'flipped'}`;

        const isRed = ['♥', '♦'].includes(this.suit);

        card.innerHTML = `
            <div class="card-inner">
                <div class="face face-back"></div>
                <div class="face face-front ${isRed ? 'red' : ''}">
                    <div class="card-value">${this.value}</div>
                    <div class="card-suit">${this.suit}</div>
                    <div class="card-suit-large">${this.suit}</div>
                </div>
            </div>
        `;
        return card;
    }

    flip() {
        this.isHidden = false;
        this.element.classList.add('flipped');
    }
}

class BlackjackGame {
    constructor() {
        this.deck = [];
        this.dealerHand = [];
        this.playerHand = [];
        this.currentBet = 0;
        this.gameState = 'BETTING';

        this.initEventListeners();
    }

    initEventListeners() {
        document.querySelectorAll('.btn-bet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(btn.dataset.amount);
                this.handleBetClick(amount, e.target);
            });
        });

        document.getElementById('btn-deal').addEventListener('click', () => this.deal());
        document.getElementById('btn-hit').addEventListener('click', () => this.hit());
        document.getElementById('btn-stand').addEventListener('click', () => this.stand());
        document.getElementById('btn-double').addEventListener('click', () => this.doubleDown());
        document.getElementById('btn-split').addEventListener('click', () => this.split());
    }

    handleBetClick(amount, buttonEl) {
        if (this.gameState !== 'BETTING' && this.gameState !== 'FINISHED') return;

        if (this.gameState === 'FINISHED') {
            this.resetTable();
        }

        if (Wallet.spendChips(amount)) {
            this.currentBet += amount;
            this.animateChip(amount, buttonEl);
            this.updateStatus(`BET: ₩${this.currentBet.toLocaleString()}`, true);
        } else {
            this.shakeWallet();
        }
    }

    animateChip(amount, startEl) {
        const stack = document.getElementById('main-chip-stack');
        const chip = document.createElement('div');
        chip.className = 'visual-chip move-to-bet';

        // Calculate start position relative to target
        const startRect = startEl.getBoundingClientRect();
        const targetRect = document.getElementById('betting-area').getBoundingClientRect();

        const startX = startRect.left - targetRect.left;
        const startY = startRect.top - targetRect.top;

        chip.style.setProperty('--start-x', `${startX}px`);
        chip.style.setProperty('--start-y', `${startY}px`);

        // Chip color based on KRW value
        if (amount >= 500000) { // 50만
            chip.style.background = 'radial-gradient(circle, #d4af37, #8a6d1e)';
            chip.textContent = '50만';
        } else if (amount >= 100000) { // 10만
            chip.style.background = 'radial-gradient(circle, #0000d4, #000066)';
            chip.textContent = '10만';
        } else if (amount >= 50000) { // 5만
            chip.style.background = 'radial-gradient(circle, #d40000, #660000)';
            chip.textContent = '5만';
        } else { // 1만
            chip.style.background = 'radial-gradient(circle, #444, #000)';
            chip.textContent = '1만';
        }

        // Stacking offset
        const offset = stack.children.length * 4;
        chip.style.bottom = `${offset}px`;

        stack.appendChild(chip);

        // Sound effect (optional if we had assets)
        // new Audio('chip.mp3').play();
    }

    createDeck() {
        const suits = ['♠', '♣', '♥', '♦'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        for (let suit of suits) {
            for (let value of values) deck.push({ suit, value });
        }
        return deck;
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    calculateScore(hand) {
        let score = 0;
        let aces = 0;
        for (let card of hand) {
            if (card.isHidden && this.gameState === 'DEALT') continue;
            const val = card.value;
            if (['J', 'Q', 'K'].includes(val)) score += 10;
            else if (val === 'A') { score += 11; aces++; }
            else score += parseInt(val);
        }
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    }

    async deal() {
        if (this.currentBet === 0) return this.updateStatus("PLACE A BET!", true);

        this.resetTable(false); // Clear cards but keep bet
        this.gameState = 'DEALT';
        this.toggleControls(true);
        this.updateStatus("DEALING...");

        this.deck = this.shuffleDeck(this.createDeck());

        // Sequential Dealing for realistic feel
        await this.addCard('player');
        await this.addCard('dealer'); // First dealer card face up
        await this.addCard('player');
        await this.addCard('dealer', true); // Second dealer card hidden

        this.updateScores();

        // Dealer Peek Animation (If dealer shows A or 10)
        const dealerUp = this.dealerHand[0];
        if (['A', '10', 'J', 'Q', 'K'].includes(dealerUp.value)) {
            await this.dealerPeek();
        }

        this.checkInitialBlackjack();
    }

    async dealerPeek() {
        this.updateStatus("DEALER PEEKING...");
        const hiddenCard = this.dealerHand[1].element;
        hiddenCard.style.transition = 'transform 0.3s ease';
        hiddenCard.style.transform = 'translateY(-20px) rotateX(-20deg)';
        await new Promise(r => setTimeout(r, 600));
        hiddenCard.style.transform = 'translateY(0) rotateX(0)';
        await new Promise(r => setTimeout(r, 300));
    }

    async addCard(who, hidden = false) {
        const cardData = this.deck.pop();
        const card = new Card(cardData.suit, cardData.value, hidden);

        if (who === 'player') {
            this.playerHand.push(card);
            document.getElementById('player-cards').appendChild(card.element);
        } else {
            this.dealerHand.push(card);
            document.getElementById('dealer-cards').appendChild(card.element);
        }

        await new Promise(r => setTimeout(r, 400));
    }

    async hit() {
        if (this.gameState !== 'DEALT') return;

        await this.addCard('player');
        const score = this.calculateScore(this.playerHand);
        this.updateScores();

        if (score > 21) this.endGame('PLAYER_BUST');
        else if (score === 21) this.stand();

        // After hit, can no longer double or split
        document.getElementById('btn-double').disabled = true;
        document.getElementById('btn-split').disabled = true;
    }

    async doubleDown() {
        if (this.gameState !== 'DEALT') return;

        // Try to spend more chips
        if (Wallet.spendChips(this.currentBet)) {
            const addedBet = this.currentBet;
            const dealBtn = document.getElementById('btn-deal'); // Just for rect
            this.animateChip(addedBet, document.getElementById('btn-double'));
            this.currentBet += addedBet;
            this.updateStatus(`DOUBLE DOWN: ₩${this.currentBet.toLocaleString()}`, true);

            await this.addCard('player');
            const score = this.calculateScore(this.playerHand);
            this.updateScores();

            if (score > 21) this.endGame('PLAYER_BUST');
            else this.stand();
        } else {
            this.shakeWallet();
        }
    }

    async split() {
        // [TODO] Split hand logic (Requires more complex UI handling for 2 hands)
        this.updateStatus("SPLIT COMING SOON!", true);
    }

    async stand() {
        if (this.gameState !== 'DEALT') return;
        this.gameState = 'STAND';
        this.toggleControls(false);

        // Reveal dealer's hidden card
        const hiddenCard = this.dealerHand.find(c => c.isHidden);
        if (hiddenCard) {
            hiddenCard.flip();
            await new Promise(r => setTimeout(r, 600));
        }

        this.updateScores();
        let dealerScore = this.calculateScore(this.dealerHand);

        while (dealerScore < 17) {
            await this.addCard('dealer');
            dealerScore = this.calculateScore(this.dealerHand);
            this.updateScores();
        }

        this.compareScores();
    }

    checkInitialBlackjack() {
        const p = this.calculateScore(this.playerHand);
        if (p === 21) this.stand();
    }

    compareScores() {
        const p = this.calculateScore(this.playerHand);
        const d = this.calculateScore(this.dealerHand);

        if (d > 21) this.endGame('DEALER_BUST');
        else if (p > d) this.endGame('PLAYER_WIN');
        else if (p < d) this.endGame('DEALER_WIN');
        else this.endGame('PUSH');
    }

    endGame(result) {
        this.gameState = 'FINISHED';
        let msg = '';
        let multiplier = 0;

        switch (result) {
            case 'PLAYER_WIN': msg = 'YOU WIN! ✨'; multiplier = 2; this.triggerWinEffect(); break;
            case 'DEALER_BUST': msg = 'DEALER BUST! 🃏'; multiplier = 2; this.triggerWinEffect(); break;
            case 'PUSH': msg = 'PUSH 🤝'; multiplier = 1; break;
            case 'PLAYER_BUST': msg = 'BUST! 💥'; multiplier = 0; break;
            case 'DEALER_WIN': msg = 'DEALER WINS 🏛️'; multiplier = 0; break;
        }

        this.updateStatus(msg, true);

        // Wallet.recordGame 호출
        const profit = (this.currentBet * multiplier) - this.currentBet;
        Wallet.recordGame(result.replace('_', ' '), this.currentBet, profit);

        if (multiplier > 0) {
            Wallet.addChips(this.currentBet * multiplier);
            this.collectChips(true);
        } else {
            this.collectChips(false);
        }

        document.getElementById('btn-deal').disabled = false;
        document.getElementById('btn-deal').textContent = 'REBET & DEAL';
    }

    updateScores() {
        const playerScoreEl = document.getElementById('player-score');
        const pScore = this.calculateScore(this.playerHand);
        playerScoreEl.textContent = pScore;

        // 21 축하 효과 적용
        if (pScore === 21) {
            playerScoreEl.classList.add('celebration-21');
            this.triggerConfetti();
        } else {
            playerScoreEl.classList.remove('celebration-21');
        }

        const dScore = this.calculateScore(this.dealerHand);
        document.getElementById('dealer-score').textContent = this.gameState === 'DEALT' ? '?' : dScore;
    }

    triggerConfetti() {
        const container = document.querySelector('.game-table');
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = ['#d4af37', '#f9e27c', '#ffffff', '#ffdf00'][Math.floor(Math.random() * 4)];
            confetti.style.width = Math.random() * 8 + 4 + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.animation = `confettiFall ${Math.random() * 2 + 1}s linear forwards`;
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    updateStatus(msg, show = false) {
        const el = document.getElementById('game-status');
        el.textContent = msg;
        if (show) el.classList.add('show');
        else el.classList.remove('show');
    }

    toggleControls(playing) {
        document.getElementById('btn-deal').disabled = playing;
        document.getElementById('btn-hit').disabled = !playing;
        document.getElementById('btn-stand').disabled = !playing;
        document.getElementById('btn-double').disabled = !playing || Wallet.chips < this.currentBet;
        document.getElementById('btn-split').disabled = !playing || !this.canSplit();

        // Visual feedback for active decisions
        if (playing) {
            document.getElementById('btn-hit').classList.add('active-action');
            document.getElementById('btn-stand').classList.add('active-action');
            if (!document.getElementById('btn-double').disabled) document.getElementById('btn-double').classList.add('active-action');
        } else {
            document.querySelectorAll('.btn-secondary').forEach(b => b.classList.remove('active-action'));
        }
    }

    canSplit() {
        if (this.playerHand.length !== 2) return false;
        return this.playerHand[0].value === this.playerHand[1].value;
    }

    resetTable(clearBet = true) {
        document.getElementById('player-cards').innerHTML = '';
        document.getElementById('dealer-cards').innerHTML = '';
        this.playerHand = [];
        this.dealerHand = [];
        if (clearBet) {
            this.currentBet = 0;
            document.getElementById('main-chip-stack').innerHTML = '';
            this.updateStatus("MIN BET: ₩10,000");
        }
        document.getElementById('win-overlay').classList.remove('active');
        document.getElementById('btn-deal').textContent = 'DEAL';
    }

    triggerWinEffect() {
        document.getElementById('win-overlay').classList.add('active');
    }

    collectChips(win) {
        const stack = document.getElementById('main-chip-stack');
        const chips = stack.querySelectorAll('.visual-chip');
        chips.forEach(c => {
            c.style.transition = 'all 0.8s ease-in';
            if (win) {
                c.style.transform = 'translate(0, 500px) scale(0.1)';
            } else {
                c.style.transform = 'translate(0, -500px) scale(0.1)';
            }
            c.style.opacity = '0';
        });
        setTimeout(() => { if (this.gameState === 'FINISHED') stack.innerHTML = ''; }, 800);
    }

    shakeWallet() {
        const wallet = document.querySelector('.wallet-status');
        wallet.style.animation = 'none';
        void wallet.offsetWidth; // trigger reflow
        wallet.style.animation = 'shake 0.5s';
    }
}

// Add shake animation to global CSS or handle here
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); color: red; }
        50% { transform: translateX(10px); }
        75% { transform: translateX(-10px); }
    }
`;
document.head.appendChild(style);

window.addEventListener('load', () => {
    window.game = new BlackjackGame();
});
