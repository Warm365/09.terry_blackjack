/**
 * Terry's Deluxe Casino - Global Wallet & App Logic
 */

const Wallet = {
    chips: 100000, // 십만원으로 시작

    init() {
        // Load from localStorage if exists
        const saved = localStorage.getItem('terry_casino_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.chips = data.chips !== undefined ? data.chips : 100000;
            this.history = data.history || []; // [{ result, bet, profit, time }]
            this.stats = data.stats || { totalGames: 0, wins: 0, totalProfit: 0 };

            // [추가] 경제 시스템 개편 (최소 1만 원 단위) 대응
            // 잔액이 만 원보다 적으면 파산으로 간주하고 십만 원으로 자동 리셋
            if (this.chips < 10000) {
                this.chips = 100000;
                this.save();
            }
        }
        this.updateUI();
    },

    save() {
        localStorage.setItem('terry_casino_data', JSON.stringify({
            chips: this.chips,
            history: this.history,
            stats: this.stats
        }));
    },

    recordGame(result, bet, profit) {
        this.stats.totalGames++;
        if (profit > 0) this.stats.wins++;
        this.stats.totalProfit += profit;

        const record = {
            result,
            bet,
            profit,
            time: new Date().toLocaleTimeString()
        };
        this.history.unshift(record);
        if (this.history.length > 10) this.history.pop();

        this.save();
        this.updateUI();
    },

    resetStats() {
        this.history = [];
        this.stats = { totalGames: 0, wins: 0, totalProfit: 0 };
        this.save();
        this.updateUI();
    },

    resetWallet() {
        if (confirm("파산하셨나요? 초기 자본 10만원으로 다시 시작합니다!")) {
            this.chips = 100000;
            this.save();
            this.updateUI();

            // 게임이 진행 중이라면 테이블도 리셋
            if (window.game) window.game.resetTable();
        }
    },

    addChips(amount) {
        this.chips += amount;
        this.updateUI();
        this.save();
    },

    spendChips(amount) {
        if (this.chips >= amount) {
            this.chips -= amount;
            this.updateUI();
            this.save();
            return true;
        }
        return false;
    },

    updateUI() {
        document.getElementById('balance-chips').textContent = this.chips.toLocaleString();

        // 통계 대시보드 업데이트
        if (this.stats) {
            const wr = this.stats.totalGames > 0 ? ((this.stats.wins / this.stats.totalGames) * 100).toFixed(1) : 0;
            const totalGamesEl = document.getElementById('stat-total-games');
            const winRateEl = document.getElementById('stat-win-rate');
            const netProfitEl = document.getElementById('stat-net-profit');

            if (totalGamesEl) totalGamesEl.textContent = this.stats.totalGames;
            if (winRateEl) winRateEl.textContent = wr + '%';
            if (netProfitEl) {
                netProfitEl.textContent = (this.stats.totalProfit >= 0 ? '₩' : '-₩') + Math.abs(this.stats.totalProfit).toLocaleString();
                netProfitEl.style.color = this.stats.totalProfit >= 0 ? '#4ade80' : '#f87171';
            }
            this.renderHistory();
        }
    },

    renderHistory() {
        const container = document.getElementById('history-container');
        if (!container || !this.history) return;

        container.innerHTML = this.history.map(h => `
            <div class="history-item">
                <span class="history-time">${h.time}</span>
                <span class="history-status ${h.profit > 0 ? 'history-win' : (h.profit < 0 ? 'history-loss' : 'history-push')}">
                    ${h.result}
                </span>
                <span class="history-profit">${h.profit >= 0 ? '+' : ''}${h.profit.toLocaleString()}</span>
            </div>
        `).join('');
    },

    toggleStats(show) {
        const panel = document.getElementById('stats-panel');
        if (panel) {
            panel.classList.toggle('active', show);
        }
    }
};

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    Wallet.init();

    // Stats 패널 이벤트
    const statsBtn = document.getElementById('btn-show-stats');
    const closeStatsBtn = document.getElementById('btn-close-stats');
    const resetStatsBtn = document.getElementById('btn-reset-stats');

    // Guide 모달 이벤트
    const guideBtn = document.getElementById('btn-show-guide');
    const closeGuideBtn = document.getElementById('btn-close-guide');
    const guideModal = document.getElementById('guide-modal');

    if (statsBtn) statsBtn.addEventListener('click', () => Wallet.toggleStats(true));
    if (closeStatsBtn) closeStatsBtn.addEventListener('click', () => Wallet.toggleStats(false));

    if (guideBtn) guideBtn.addEventListener('click', () => guideModal.classList.add('active'));
    if (closeGuideBtn) closeGuideBtn.addEventListener('click', () => guideModal.classList.remove('active'));

    // 모달 외각 클릭 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === guideModal) guideModal.classList.remove('active');
    });

    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            if (confirm("통계 기록을 모두 지우시겠습니까?")) {
                Wallet.resetStats();
            }
        });
    }

    // Reset 버튼 연결
    const resetBtn = document.getElementById('btn-reset-wallet');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => Wallet.resetWallet());
    }

    console.log("Welcome to Terry's Deluxe Casino");
});
