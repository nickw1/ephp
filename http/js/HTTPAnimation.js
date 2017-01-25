
function HTTPAnimation(options) {

	// Specific HTTPAnimation stuff
	this.fileExplorer = options.fileExplorer;
	this.phpAnimation = options.phpAnimation;

	options.onrequestend = function() {
		var urlParts = this.message.url.split("/");    

		var sa = new ServerAnimation(
			{fileExplorer: this.fileExplorer,
			urlParts: urlParts,
			repeat:2, 
			interval:500, 
			callback: 
				(function() {
					// TODO go in own object - seems poor cohesion to
					// put here, particularly error checking
					this.message.send((function(analyserInfo) {
						var startResponseNow=true;
						if(analyserInfo) {
							if(analyserInfo.errors) {
								var errMsg="";
								for(var i=0; i<analyserInfo.errors.length;i++){
									if(analyserInfo.errors[i].syntaxError) {
										errMsg += "There was a " +
											"syntax error in your "+
											"PHP code on line number "+
											analyserInfo.errors[i].
												syntaxError.lineNumber +
											".\nThe reason is " +
											analyserInfo.errors[i].
												syntaxError.reason +
											"\n. If you cannot see a "+
											"problem with this line, "+
											"look at the preceding "+
											"two or three lines.\n";
									} else if (analyserInfo.errors[i].
										sqlError) {
										errMsg += "There was an " +
											"error in your "+
											"SQL on line number "+
											analyserInfo.errors[i].
												sqlError.lineNumber +
											".\n("+
											analyserInfo.errors[i].
												sqlError.query +
											")\nThe reason is " +
											analyserInfo.errors[i].
												sqlError.error +
											"\n.";
									} else {
										errMsg += 
											analyserInfo.errors[i] +
										"\n";
									}
								}
								alert(errMsg);
								startResponseNow = false;
							} else {
								startResponseNow=
									!this.phpAnimation.animate
										(analyserInfo);
							}
						}

						if(startResponseNow) {
							this.startResponse();
						}
					}).bind(this));    
				}).bind(this)
			});
		sa.animate();
	}

	GenericAnimation.prototype.constructor.apply(this,options);
}