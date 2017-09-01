
function Slider(maxInterval, nValues, options) {
    this.maxInterval = maxInterval;
    this.range = document.createElement("input");
    this.range.setAttribute("type", "range");
    this.range.setAttribute("min", 1);
    this.range.setAttribute("max", nValues);
    this.range.setAttribute("step", 1);
    if(options) {
        if(options.onchange) {
            this.range.addEventListener("change", (e)=> {
                 options.onchange ( this.maxInterval / e.target.value);
            });
        }
        if(options.parent) {
            options.parent.appendChild(document.createTextNode("Speed:"));
            options.parent.appendChild(this.range);
        }
    }
}

Slider.prototype.setValue = function(interval) {
    console.log("Slider.setValue(): interval=" + interval);
    console.log("setting attribute of range to " +
        this.maxInterval/interval);
    this.range.setAttribute("value", this.maxInterval / interval);
}
