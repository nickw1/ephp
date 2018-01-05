
function DbgMsgQueue(dbgMsgHandler, interval, callbacks) {
    this.dbgMsgHandler = dbgMsgHandler;
    this.messages = [];
    this.activeQueue = [];
    this.handle = null;
    this.interval = interval;
	this.callbacks = callbacks || {};
}

DbgMsgQueue.prototype.add = function(msg) {
    this.messages.push(msg);
    this.activeQueue.push(msg);
    this.start();
}

DbgMsgQueue.prototype.start = function() {
    if(this.handle == null) {
        this.handle=setInterval (this.processNextMsg.bind(this), this.interval);
		if(this.callbacks.onStart) {
			this.callbacks.onStart();
		}
    }
}

DbgMsgQueue.prototype.stop = function() {
    if(this.handle != null) {
        clearInterval(this.handle);
        this.handle=null;
		if(this.callbacks.onStop) {
			this.callbacks.onStop();
		}
    }
}

DbgMsgQueue.prototype.setInterval = function(interval) {
    this.stop();
    this.interval = interval;
    this.start();
}

DbgMsgQueue.prototype.getInterval = function() {
    return this.interval;
} 

DbgMsgQueue.prototype.processNextMsg = function() {
    if(this.activeQueue.length > 0) {
        var msg = this.activeQueue.shift();
		console.log("DbgMsgQueue: processing command: " + msg.cmd);
        switch(msg.cmd)    {
            case 'line':
                this.dbgMsgHandler.handleLine(msg.data);
                break;

            case 'newrow':
                this.dbgMsgHandler.handleNewRow(msg.data);
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

DbgMsgQueue.prototype.isRunning = function() {
    return this.handle != null;
}

DbgMsgQueue.prototype.clear = function() {
    this.stop();
    this.messages = [];
	this.activeQueue = [];
}

DbgMsgQueue.prototype.rewind = function() {
    this.stop();
    this.activeQueue = this.messages.slice(0);
}
