
function ComponentAnimator (totalTime, interval, minWidth,
        clientId, networkId, serverId){
    this.interval = interval;
    this.nSteps = totalTime / this.interval;


    this.client = document.getElementById(clientId);
    this.network = document.getElementById(networkId);
    this.server = document.getElementById(serverId);

	// noete canvas doesn't exist here yet
	// does exist on doAnim though
    this.minWidth = minWidth;
    this.recalculateDimensions();

    this.timer = null;
}

ComponentAnimator.prototype.startForwardAnim = function(cb) {
    if(this.timer == null) {
        this.timer = setInterval(this.doAnim.bind(this, 1, cb), this.interval);
    }
}

ComponentAnimator.prototype.startReverseAnim = function(cb) {
    if(this.timer == null) {
        this.timer = setInterval(this.doAnim.bind(this, -1, cb), this.interval);
        this.client.style.display = this.network.style.display = this.server.style.display = 'inline-block';
    }    
}

// offseWidth includes border; without this the animation won't work
// correctly
ComponentAnimator.prototype.doAnim = function (direction, cb) {

    var grower = direction==-1 ? this.client : this.server;
    var shrinker = direction==-1 ? this.server: this.client;

    shrinker.style.width = (shrinker.offsetWidth-this.csStep)+"px";
	this.networkCanvas = this.network.querySelector("canvas");
    this.setNetworkWidth(this.network.offsetWidth- (this.netStep*direction));
 //   console.log("network width (componentAnimator)="+this.network.offsetWidth);
    this.networkCanvas.width = this.network.offsetWidth; 
//    console.log("canvas width (ComponentAnimator)=" + this.networkCanvas.width);
    grower.style.width =  (grower.offsetWidth+this.csStep+this.netStep)+"px"; 

    document.getElementById("client_img").width = 
        (shrinker.offsetWidth> 75 ? 75: shrinker.offsetWidth);
    document.getElementById("network_img").width = 
        (this.network.offsetWidth> 75 ? 75: this.network.offsetWidth);

    if(direction==1 && this.client.offsetWidth<this.minWidth) {
        this.client.style.width = this.minWidth + 'px';
        this.setNetworkWidth(this.minWidth* 
			(this.origNetworkWidth/this.origClientWidth));
        this.finishAnim(cb);
    } else if (direction==-1 && this.client.offsetWidth> this.origClientWidth) {
        this.client.style.width = this.origClientWidth+'px';
        this.setNetworkWidth(this.origNetworkWidth);
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

ComponentAnimator.prototype.recalculateDimensions = function() {
    this.origClientWidth = this.client.offsetWidth;
    this.origNetworkWidth = this.network.offsetWidth;
    this.origServerWidth = this.server.offsetWidth;
    this.csStep = Math.round((this.client.offsetWidth-this.minWidth) / 
            this.nSteps);
    this.netStep=this.csStep*(this.network.offsetWidth/this.client.offsetWidth);
}

ComponentAnimator.prototype.setNetworkWidth = function(width) {
	this.network.style.width = width + 'px';
	this.networkCanvas.width = width;
}
