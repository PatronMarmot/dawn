// Socket.io client CDN import
if (!window.io) {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    script.onload = () => {
        console.log('✅ Socket.io client loaded');
    };
    document.head.appendChild(script);
}
