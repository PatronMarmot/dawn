            }
        });
    }
}

// CSS Styles
const renderMultiplayerCSS = `
.multiplayer-submenu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    animation: slideDown 0.3s ease-out;
}

.multiplayer-sub-btn {
    font-size: 0.9rem !important;
    padding: 0.75rem 1.5rem !important;
    min-height: auto !important;
}

.multiplayer-sub-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.multiplayer-status {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0,0,0,0.1);
    border-radius: 8px;
    text-align: center;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(99, 102, 241, 0.2);
    border-left-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 1rem auto;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.game-id-display {
    font-family: 'Courier New', monospace;
    background: rgba(99, 102, 241, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #6366f1;
    color: #6366f1;
    font-size: 1.2rem;
    letter-spacing: 2px;
    margin: 0.5rem;
}

.copy-btn {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid #6366f1;
    color: #6366f1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    margin: 0.5rem;
    transition: all 0.3s ease;
}

.copy-btn:hover {
    background: #6366f1;
    color: white;
}

.waiting-content {
    text-align: center;
    padding: 2rem;
}

.game-id-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1rem 0;
}

.join-game-content {
    text-align: center;
    padding: 1rem;
}

.modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}
`;

// Error Modal ve Connection Status için ek CSS
const additionalCSS = `
.error-content {
    text-align: center;
    padding: 1rem;
}

.error-suggestions {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    text-align: left;
}

.error-suggestions h3 {
    margin: 0 0 0.5rem 0;
    color: #ef4444;
}

.error-suggestions ul {
    margin: 0;
    padding-left: 1.5rem;
}

.error-suggestions li {
    margin: 0.25rem 0;
    color: #374151;
}

.connection-status {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    z-index: 1000;
    transition: all 0.3s ease;
}

.connection-status.connected {
    background: rgba(16, 185, 129, 0.9);
}

.connection-status.disconnected {
    background: rgba(239, 68, 68, 0.9);
}

.connection-status.connecting {
    background: rgba(245, 158, 11, 0.9);
}
`;

// CSS'i head'e ekle
if (!document.querySelector('#render-multiplayer-css')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'render-multiplayer-css';
    styleElement.textContent = renderMultiplayerCSS;
    document.head.appendChild(styleElement);
}

if (!document.querySelector('#additional-multiplayer-css')) {
    const additionalStyleElement = document.createElement('style');
    additionalStyleElement.id = 'additional-multiplayer-css';
    additionalStyleElement.textContent = additionalCSS;
    document.head.appendChild(additionalStyleElement);
}

// DOMContentLoaded event'inde menü event'lerini kur
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMultiplayerMenuEvents);
} else {
    setupMultiplayerMenuEvents();
}

// Global export
window.renderMultiplayer = renderMultiplayer;
window.showJoinGameModal = showJoinGameModal;
window.hideJoinGameModal = hideJoinGameModal;

console.log('🚀 Epic Card Battle - Render + WebSocket Multiplayer System Ready!');
