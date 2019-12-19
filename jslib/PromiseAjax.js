// PromiseAjax
// AJAX using Promises

var http = { 
    send: function (method, url, formData) {

        var p = new Promise(
            function(resolve,reject) {
                method = method ? method.toLowerCase() : 'get';
                var xhr2 = new XMLHttpRequest();
                xhr2.open(method, url);
                xhr2.addEventListener("load", function(e) {
                        if(e.target.status>=200 && e.target.status<300) {
                            resolve(e.target);
                        } else {
                            reject(e.target.status);
                        }
                    } );
                xhr2.send(formData);
            }
        );

        return p;
    },

    get: function(url) {
        return this.send('get', url);
    },

    post: function(url, formData) {
        return this.send('post', url, formData);
    }
};
