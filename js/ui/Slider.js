class Slider {
    constructor(maxInterval, nValues, options) {
        this.maxInterval = maxInterval;
        this.range = document.createElement("input");
        this.range.setAttribute("type", "range");
        this.range.setAttribute("min", 1);
        this.range.setAttribute("max", nValues);
        this.range.setAttribute("step", 1);
        this.range.style.width=options.width || "96px";
        if(options) {
            if(options.onchange) {
                this.range.addEventListener("change", (function(e) {
                 options.onchange ( this.maxInterval / e.target.value);
                }).bind(this));
            }
            if(options.parent) {
                var span = document.createElement("span");
                span.style.fontSize = "10pt";
                span.appendChild(document.createTextNode("Speed:"));
                options.parent.appendChild(span);
                options.parent.appendChild(this.range);
            }
        }
    }

    setValue(interval) {
        this.range.setAttribute("value", this.maxInterval / interval);
    }
}

module.exports = Slider;
