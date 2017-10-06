
function ComponentAnimator (totalTime, interval, minWidth,
		clientId, networkId, serverId){
    this.interval = interval;
    var nSteps = totalTime / this.interval;

	this.client = document.getElementById(clientId);
	this.network = document.getElementById(networkId);
	this.server = document.getElementById(serverId);

    this.csStep = Math.round(this.client.offsetWidth / nSteps);
    this.netStep = Math.round(this.network.offsetWidth / nSteps);

    this.origClientWidth = this.client.offsetWidth;
    this.origNetworkWidth = this.network.offsetWidth;
    this.origServerWidth = this.server.offsetWidth;

	this.minWidth = minWidth;

    this.timer = null;
}

ComponentAnimator.prototype.setCanvas = function(canvas) {
	this.networkCanvas = canvas;
}

ComponentAnimator.prototype.startForwardAnim = function(cb) {
    if(this.timer == null) {
        this.timer = setInterval(this.doAnim.bind(this, 1, cb), this.interval);
    }
}

ComponentAnimator.prototype.startReverseAnim = function(cb) {
    if(this.timer == null) {
        this.timer = setInterval(this.doAnim.bind(this, -1, cb), this.interval);
        this.client.style.display = 'inline-block';
        this.network.style.display = 'inline-block';
        this.server.style.display = 'inline-block';
    }    
}

// offseWidth includes border; without this the animation won't work
// correctly
ComponentAnimator.prototype.doAnim = function (direction, cb) {

    var grower = direction==-1 ? this.client : this.server;
    var shrinker = direction==-1 ? this.server: this.client;

    shrinker.style.width = (shrinker.offsetWidth-this.csStep)+"px";
    this.network.style.width = (this.network.offsetWidth-
			(this.netStep*direction))+"px";
    this.networkCanvas.width = (this.network.offsetWidth-
			(this.netStep*direction))+"px";
    grower.style.width =  (grower.offsetWidth+this.csStep+this.netStep)+"px"; 

	document.getElementById("client_img").width = 
		(shrinker.offsetWidth> 75 ? 75: shrinker.offsetWidth);
	document.getElementById("network_img").width = 
		(this.network.offsetWidth> 75 ? 75: this.network.offsetWidth);

    if(direction==1 && this.client.offsetWidth<this.minWidth+this.csStep) {
		this.client.style.width = this.minWidth + 'px';
		this.network.style.width = this.minWidth*
			(this.origNetworkWidth/this.origClientWidth)+"px";
		this.finishAnim(cb);
    } else if (direction==-1 && this.client.offsetWidth>
                this.origClientWidth-this.csStep) {
        this.client.style.width = this.origClientWidth+'px';
        this.network.style.width = this.origNetworkWidth+'px';
        this.server.style.width = this.origServerWidth+'px';
		this.finishAnim(cb);
    }
}

ComponentAnimator.prototype.finishAnim = function (cb) {
	clearTimeout(this.timer);
	this.timer = null;
	if(cb) {
		cb();
	}
}
