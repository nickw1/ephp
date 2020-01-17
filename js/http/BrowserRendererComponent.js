const css = require('css');

class BrowserRendererComponent extends HTMLElement {

    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.webDir = ''; 
        this.boundOnFormSubmit = this.onFormSubmit.bind(this);
    }

    showHTMLMsg (msg) {
        this.showContent('text/html', msg);
    }

    showContent (mimetype, responseText) {
        this.shadow.innerHTML = "";
        if (mimetype=='text/plain') {
 
            var pre = document.createElement("pre");
            pre.appendChild
                    (document.createTextNode(responseText));
            this.shadow.appendChild(pre);
        } else {
            this.shadow.innerHTML = `<div>${responseText}</div>`;
            this.loadExternalCSS().then( result => {
                this.fixImages();
                this.doFormEventListeners();
                this.doLinkEventListeners();
            });
        }
    }

    showImage(url) {
        this.shadow.innerHTML = "";
        const img = new Image();
        img.onerror = this.showHTMLMsg.bind(this, `${url} could not be loaded as it is an invalid image.`);
        img.src = url;
        image.onload = this.shadow.appendChild.bind(this.shadow, img);
        
    }

    loadExternalCSS() {
        var match = Array.from(this.shadow.querySelectorAll('link'));
        const fetches = match.map (cssLink => fetch(`${this.webDir}/${cssLink.getAttribute('href')}`).then(response => response.text()));
        if(fetches.length>0) {
            match.forEach( cssLink=>  {
                this.shadow.querySelector(":host > div").removeChild(cssLink);
            });
            return Promise.all(fetches)
                .then(results => {
                    results.forEach(text => {
                        const parsedCss = css.parse(text);
                        parsedCss.stylesheet.rules.forEach ( rule => {
                            const body = rule.selectors.indexOf('body');
                            if(body >= 0) {
                                rule.selectors[body] = ':host > div';
                            }
                        });
                        this.shadow.innerHTML += `<style>${css.stringify(parsedCss)}</style>`;
                    });
                    this.shadow.innerHTML += '<style>:host > div {  height:100% }</style>';
                    return results.length;
            });
        } else {
            return Promise.resolve(0); 
        }
      } 
    

    doFormEventListeners() {
        var forms = this.shadow.querySelectorAll("form");

        for(var i=0; i<forms.length; i++) {    
            forms[i].addEventListener("submit", this.boundOnFormSubmit);
        }
    }

    doLinkEventListeners() {
        var links = this.shadow.querySelectorAll("a");
        for(var i=0; i<links.length; i++) {
            links[i].addEventListener("click", (e)=> {
                e.preventDefault();
                var href=e.target.getAttribute("href");
                console.log(`HREF=${href}`);
                this.onSendRequest('GET', href.substr(0,7)=="http://" ? href: this.webDir+"/"+href);
            });
        }
    }

    fixImages() {
        const images = this.shadow.querySelectorAll("img");
        const regexp=/^https?:\/\//;
        images.forEach(img=> {
            const srcAttr = img.getAttribute("src");
            img.src = (srcAttr.match(regexp) || srcAttr.substr(0, this.webDir.length) == this.webDir) ? img.src: `${this.webDir}/${srcAttr}`;
            console.log(`Img src now ${img.src}`)
        });
    }

    setWebDir(dir) {
        this.webDir = dir;
    }

    onFormSubmit(e) {
        console.log('form submit');
        e.preventDefault();
        var actionLocalUrl = e.target.action.substring (e.target.action.lastIndexOf("/")+1);
        var formData = new FormData();
        var qs="";
        switch(e.target.method.toUpperCase()) {
            case 'POST':
                for(var j=0; j<e.target.elements.length; j++) {
                    if(e.target.elements[j].type!="submit") {
                        formData.append(e.target.elements[j].name, 
                            e.target.elements[j].value);    
                    }
                }
                break;

            case 'GET':
                for(var j=0; j<e.target.elements.length; j++) {
                    var el = e.target.elements[j];
                    if(e.target.elements[j].type!="submit") {
                        qs+= (qs=="" ? "?":"&");
                        qs += e.target.elements[j].name+ "="+e.target.elements[j].value;
                    }
                }
                break;
            }
        actionLocalUrl+=qs;
        console.log(actionLocalUrl);
        this.onSendRequest(e.target.method, this.webDir+"/"+actionLocalUrl,formData);
    }
}

customElements.define('browser-renderer', BrowserRendererComponent);

module.exports = BrowserRendererComponent;
