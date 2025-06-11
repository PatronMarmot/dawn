        // Debug panel güncelleme - FIXED
        function updateDebugPanel() {
            const debugPanel = document.getElementById('debugPanel');
            if (!debugPanel || debugPanel.style.display === 'none') return;
            
            // Gerçek durumları kontrol et
            const serverOK = multiplayer?.connected || false;
            const socketIOOK = typeof io !== 'undefined';
            const socketConnected = multiplayer?.socket?.connected || false;
            
            document.getElementById('debugServer').textContent = serverOK ? '✅' : '❌';
            document.getElementById('debugSocketIO').textContent = socketIOOK ? '✅' : '❌';
            document.getElementById('debugConnected').textContent = socketConnected ? '✅' : '❌';
            document.getElementById('debugGameId').textContent = multiplayer?.gameId || '-';
            document.getElementById('debugPlayerId').textContent = multiplayer?.playerId || '-';
            
            // Eğer multiplayer başarılı ama socket.connected false ise, polling mode
            if (serverOK && !socketConnected) {
                document.getElementById('debugConnected').textContent = '🟡 POLLING';
                document.getElementById('debugConnected').style.color = '#f59e0b';
            }
        }