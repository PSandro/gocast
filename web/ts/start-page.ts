const WS_INITIAL_RETRY_DELAY = 5000;
const PAGE_LOADED = new Date();

export const liveUpdateListener = {
    ws: WebSocket,

    init() {
        this.connect(WS_INITIAL_RETRY_DELAY);
    },

    connect(retryDelay: number) {
        const wsProto = window.location.protocol === "https:" ? `wss://` : `ws://`;
        this.ws = new WebSocket(`${wsProto}${window.location.host}/api/live-update/ws`);
        this.ws.onopen = function (e) {
            window.dispatchEvent(new CustomEvent("connected"));
        };

        this.ws.onmessage = function (m) {
            const data = JSON.parse(m.data);
            window.dispatchEvent(new CustomEvent("liveupdate", { detail: { data: data } }));
        };

        this.ws.onclose = () => {
            // connection closed, discard old websocket and create a new one after backoff
            // don't recreate new connection if page has been loaded more than 12 hours ago
            if (new Date().valueOf() - PAGE_LOADED.valueOf() > 1000 * 60 * 60 * 12) {
                return;
            }
            window.dispatchEvent(new CustomEvent("disconnected"));
            this.ws = null;
            setTimeout(
                () => this.connect(retryDelay * 2), // Exponential Backoff
                retryDelay,
            );
        };

        this.ws.onerror = function (err) {
            window.dispatchEvent(new CustomEvent("disconnected"));
        };
    },
};