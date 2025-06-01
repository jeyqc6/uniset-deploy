class WebSocketManager {
    constructor(url, options={}) {
        this.url = url;
        this.options = {
            maxRetries: 3,
            initialDelay: 1000,
            maxRetryDelay:3000,
            ...options
        }

        this.ws = null;
        this.retryCount = 0;
        this.retryTimeout = null;
        this.isConnecting = false;
        this.messageQueue = [];
        this.listeners = new Map()

    }
// Connect to WebSocket
    connect() {
        console.log('Attempting to connect WebSocket...', this.url);
        if (this.isConnected()) {
            console.log('WebSocket already connected');
            return;
        }
        this.isConnecting = true;

        try {
            console.log('Creating new WebSocket connection...');
            this.ws = new WebSocket(this.url);
            this.setupEventListeners();
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.handleError(error);
        }
    }

    setupEventListeners() {
        this.ws.onopen = () => {
            console.log('WebSocket connected successfully');
            this.retryCount = 0;
            this.isConnecting = false;
            this.flushMessageQueue();
            this.emit('open');
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
            this.isConnecting = false;
            this.handleDisconnect(event);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleError(error);
        };

        this.ws.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('Parsed message data:', data);
                this.emit('message', data);
            } catch (error) {
                console.error('Failed to parse message:', error);
                this.emit('message', event.data);
            }
        };
    }

    //deal with disconnect
    handleDisconnect(event) {
        if (event.code !== 1000) {
            this.retry();
        }
        this.emit('close',event);
    }

    handleError(error) {
        this.isConnecting = false;
        this.emit('error', error);
        this.retry();
    }

    retry() {
        if (this.retryCount >= this.options.maxRetries) {
            console.error('Max retries reached');
            this.emit('maxRetriesReached');
            return;
        }

        // clear previous timeout
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }

        //calculate delay
        const delay = Math.min(
            this.options.initialDelay * Math.pow(2, this.retryCount),
            this.options.maxRetryDelay
        );

        this.retryTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect (${this.retryCount + 1}/${this.options.maxRetries})...`);
            this.retryCount++;
            this.connect();
        }, delay);
    }

    send(message) {
        console.warn('Direct WebSocket message sending is disabled. Use HTTP API instead.');
    }

    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    close() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }

        if (this.ws) {
            this.ws.close(1000, 'Normal closure');
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

export default WebSocketManager;
