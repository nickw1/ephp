class Eventable {
    constructor() {
        this.eventHandlers = {};
    }

    on(evType, handler) {
        this.eventHandlers[evType] = handler;
    }
}
