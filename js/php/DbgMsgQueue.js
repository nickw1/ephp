class DbgMsgQueue {
    constructor(dbgMsgHandler, interval, callbacks) {
        this.dbgMsgHandler = dbgMsgHandler;
           this.messages = [];
        this.activeQueue = [];
        this.handle = null;
        this.interval = interval;
        this.callbacks = callbacks || {};
        this.fileuri = '';
    }

    add(msg) {
        this.messages.push(msg);
        this.activeQueue.push(msg);
        this.start();
    }

    start() {
        if(this.handle == null) {
            this.handle=setInterval (this.processNextMsg.bind(this), this.interval);
            if(this.callbacks.onStart) {
                this.callbacks.onStart();
            }
        }
    }

    stop() {
        if(this.handle != null) {
            clearInterval(this.handle);
            this.handle=null;
            if(this.callbacks.onStop) {
                this.callbacks.onStop();
            }
        }
    }

    setInterval(interval) {
        this.stop();
        this.interval = interval;
        this.start();
    }

    getInterval() {
        return this.interval;
    } 

    processNextMsg () {
        if(this.activeQueue.length > 0) {
            var msg = this.activeQueue.shift();
            switch(msg.cmd)    {
                case 'init':
                    this.fileuri = msg.data;
                    this.dbgMsgHandler.handleInit(msg.data);
                    break;

                case 'line':
                    this.dbgMsgHandler.handleLine(msg.data);
                    break;

                case 'stdout':
                    this.dbgMsgHandler.handleStdout(msg.data);
                    break;
                
                case 'dbresults':
                    this.dbgMsgHandler.handleDBResults(msg.data);
                    break;

                case 'dberror':
                    this.dbgMsgHandler.handleDBError(msg.data);
                    break;
            }
        } else {
            this.stop();
        }
    }

    isRunning() {
        return this.handle != null;
    }

    clear() {
        this.stop();
        this.messages = [];
        this.activeQueue = [];
    }

    rewind() {
        this.stop();
        this.activeQueue = this.messages.slice(0);
    }
}

module.exports = DbgMsgQueue;
