var NoForceHttps = false;//false;//true;//false;// false;

//----------------
(function (history) {
    var pushState = history.pushState;
    var replaceState = history.replaceState;

    history.pushState = function (state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }

        console.log('pushstate called');
        //  return pushState.apply(history, arguments);
    }


    history.replaceState = function (state, title, url) {
        // if (typeof history.onpushstate == "function") {
        //    history.onpushstate({state: state});
        //  }

        console.log('replaceState called');
        //  return pushState.apply(history, arguments);
    }


})(window.history);


//----------------


if (false) {

    var url = window.location.href;//new URL(window.location.href);


    var loc = url.substring(url.indexOf("q=") + 2);
    loc = decodeURIComponent(loc);

    var locurl = new URL(loc);


    var _NoForceHttps = locurl.searchParams.get("NoForceHttps");


    if (NoForceHttps != null)
        NoForceHttps = true;

}


//------------------------

setTimeout(function () {
    InitErr()
}, 100);


setTimeout(function () {
    InitErr()
}, 1);


setTimeout(function () {
    InitErr()
}, 1000);


//----------------------------------
function InitErr() {
    var anchors = document.getElementsByTagName('link');
    for (var i = 0; i < anchors.length; i++) {
        try {
            anchors[i].onerror = LoadErr_;


        } catch (e) {
        }
    }


//////script//////

    var anchors = document.getElementsByTagName('script');
    for (var i = 0; i < anchors.length; i++) {
        try {
            anchors[i].onerror = LoadScriptErr_;


            var src = anchors[i].src;

            if (oo.startsWith("http://") || src.startsWith("http://"))
                if (!src.includes('app.gazerecorder.com')) {
                    src = ProxyfiUrl(src);

                    anchors[i].src = src;


                }


        } catch (e) {
        }
    }
////////

}


///////////////////////


if (false)//force proxy css
    window.addEventListener('DOMContentLoaded', function (event) {


        setTimeout(function () {

            var anchors = document.getElementsByTagName('link');
            for (var i = 0; i < anchors.length; i++) {
                try {

                    var url = anchors[i].href;
                    if (!url.includes('app.gazerecorder.com'))
                        anchors[i].href = ProxyfiUrl(url);


                } catch (e) {
                }
            }


        }, 1000);


    });

//////////////////////////////

if (false)
    window.addEventListener('DOMContentLoaded', function (event) {

        var anchors = document.getElementsByTagName('script');
        for (var i = 0; i < anchors.length; i++) {
            try {


                var src = anchors[i].src;

                if (oo.startsWith("http://") || src.startsWith("http://"))
                    if (!src.includes('app.gazerecorder.com')) {
                        src = ProxyfiUrl(src);


                        var head = document.getElementsByTagName('head')[0];
                        var script = document.createElement('script');
                        script.src = src;
                        head.appendChild(script);
                    }


            } catch (e) {
            }
        }

    });


///////////////////

function LoadScriptErr_(o) {
    o.currentTarget.onerror = null;


    var url = o.currentTarget.src;


    if (url.startsWith('https://app.gazerecorder.com')) {


        var loc = url.substring(url.indexOf("q=") + 2);
        loc = decodeURIComponent(loc);

        if (loc.startsWith("https://")) {
            loc = "http://" + loc.substring(8);


            o.currentTarget.src = proxyUrl + loc;
            return;
        }


    }


    o.currentTarget.src = ProxyfiUrl(url);


}

//==================================


const fetch = window.fetch;


var url = new URL(window.location.href);
var xhrProxy = url.searchParams.get("xhrProxy");

if (xhrProxy != null)


//if(false)
    window.fetch = function () {
        //var url = ProxyfiUrlFF(arguments[0].url);
        //arguments[0].url = url; //ProxyfiUrl(arguments[0]);


        var url = ProxyfiUrlFF(arguments[0]);
        arguments[0] = url; //ProxyfiUrl(arguments[0]);


        //console.log("fetch " + arguments);
        console.log("fetch " + arguments[0] + " url " + url);
        return Promise.resolve(fetch.apply(window, arguments))
    }
if (false) {
}

String.prototype.url = function () {
    const a = $('<a />').attr('href', this)[0];
    // or if you are not using jQuery ????
    // const a = document.createElement('a'); a.setAttribute('href', this);
    let origin = a.protocol + '//' + a.hostname;
    if (a.port.length > 0) {
        origin = `${origin}:${a.port}`;
    }
    const {
        host,
        hostname,
        pathname,
        port,
        protocol,
        search,
        hash
    } = a;
    return {
        origin,
        host,
        hostname,
        pathname,
        port,
        protocol,
        search,
        hash
    };
}
const parseUrl = (string, prop) => {
    const a = document.createElement('a');
    a.setAttribute('href', string);
    const {
        host,
        hostname,
        pathname,
        port,
        protocol,
        search,
        hash
    } = a;
    const origin = `${protocol}//${hostname}${port.length ? `:${port}` : ''}`;
    return prop ? eval(prop) : {
        origin,
        host,
        hostname,
        pathname,
        port,
        protocol,
        search,
        hash
    }
}
const proxyUrl = 'https://app.gazerecorder.com/proxyrec/index.php?q=';
//const proxyUrl = 'http://localhost/proxyrec/index.php?q='; //tmp v2
const proxyUrlBase = 'https://app.gazerecorder.com';
const proxyUrlContatin = 'proxyrec';
var h = window.location.href;
var loc = h.substring(h.indexOf("q=") + 2);
loc = decodeURIComponent(loc);
var oo = parseUrl(loc, 'origin');
//var basehref =proxyUrl + oo;
//var basehref = proxyUrl + encodeURIComponent(oo);
var basehref = oo;
//if(false)
//  window.location.hostname=oo;
//document.head.innerHTML = document.head.innerHTML + "<base href='" +basehref + "' />";
//if (true) {
//	document.head.innerHTML = document.head.innerHTML + '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"> ';
//}


function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else {
        var expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

if (true) {
    createCookie('baseorgin', oo, 1);

}


if (false) document.head.innerHTML = "<base href='" + basehref + "' />" + document.head.innerHTML;
const schemes = ['data:', 'magnet:', 'about:', 'javascript:', 'mailto:', 'tel:', 'ios-app:', 'android-app:'];

function containsAny(str) {
    var substrings = schemes;
    for (var i = 0; i != substrings.length; i++) {
        var substring = substrings[i];
        if (str.indexOf(substring) != -1) {
            return substring;
        }
    }
    return null;
}

//--------------------------

function ProxyfiUrlHash(url, hash) {
    if (hash == "")
        return ProxyfiUrl(url);
    else {
        try {
            if (true) {
                if (url.length < 1)
                    return url


                if (url.startsWith(basehref) & url.length <= url.basehref + 1)
                    return url;
            }


            if (!url.includes(proxyUrlContatin)) {
                if (url.includes(proxyUrlBase)) {
                    url = url.replace(proxyUrlBase, basehref);
                    console.log(' include proxyUrlBase' + url);
                }
                if (containsAny(url) == null) {
                    if (url.startsWith("//")) url = "https:" + url;
                    if (url.startsWith("/")) {
                        ; //
                    } else {

                        if (!NoForceHttps)
                            if (true) //force https
                            {
                                if (url.startsWith("http://")) url = "https://" + url.substring(7);
                            }
                        // if(true)
                        // url = decodeURIComponent(url);
                        if (window.location.href.includes("&_noscripts_=1"))
                            return proxyUrl + encodeURIComponent(url) + "&_noscripts_=1";
                        else
                            return proxyUrl + encodeURIComponent(url);
                    }
                }
            } else {
                var a = url;
            }
            return url;
        } catch (e) {
            return url;
        }

    }
}

//--------------------------
function _encodeURI(url) {
    out = url;
    if (out.includes("#"))
        out = out.replace('#', '__hash__');


    var out = encodeURIComponent(out);
    if (true) // hash
//if( out.includes('%23')
        out = out.replace("__hash__", "#");
    return out;

}

//--------------------------
function ProxyfiUrl(url) {
    try {
        if (true) {
            if (url.length < 1)
                return url


            if (url.startsWith(basehref) & url.length <= url.basehref + 1)
                return url;
        }


        if (!url.includes(proxyUrlContatin)) {
            if (url.includes(proxyUrlBase)) {
                url = url.replace(proxyUrlBase, basehref);
                console.log(' include proxyUrlBase' + url);
            }
            if (containsAny(url) == null) {
                if (url.startsWith("//")) url = "https:" + url;
                if (url.startsWith("/")) {
                    ; //
                } else {

                    if (!NoForceHttps)
                        if (true) //force https
                        {
                            if (url.startsWith("http://")) url = "https://" + url.substring(7);
                        }
                    // if(true)
                    // url = decodeURIComponent(url);
                    if (window.location.href.includes("&_noscripts_=1")) return proxyUrl + _encodeURI(url) + "&_noscripts_=1";
                    else return proxyUrl + _encodeURI(url);
                }
            }
        } else {
            var a = url;
        }
        return url;
    } catch (e) {
        return url;
    }
}

//--------------------------------
var _LinkClicked_ = false;

function _onClickLink_() {
    var t = this;
    _LinkClicked_ = true;
}

//--------------------------------

if (false) //tmp
    window.addEventListener("beforeunload", function (e) {
        try {
            if (!_LinkClicked_) {
                parent.postMessage("badLocChange", "*");
                // if(false)
                window.stop();
                ;
            }
        } catch (e) {
        }
    }, false);

//--------------------------------
function StartMutation() {
    if (document.body) {
        if (true) //--------mutation-------------
        {
            const targetNode = document.body;
            // Options for the observer (which mutations to observe)
            const config = {
                attributes: true,
                childList: true,
                subtree: true
            };
            // Callback function to execute when mutations are observed
            const callback = function (mutationsList, observer) {
                // Use traditional 'for loops' for IE 11
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        for (i = 0; i < mutation.addedNodes.length; i++) {
                            var node = mutation.addedNodes[i];
                            if (node.nodeName == 'A' || node.nodeName == 'a')
                                if (typeof node.href !== 'undefined')
                                    if (node.href != null) {
                                        var nn = ProxyfiUrl(node.href);
                                        if (nn != node.href) {
                                            console.log(node.href + ' add ' + nn);
                                            node.href = nn;
                                        }
                                    }
                        }
                    } else if (mutation.type === 'attributes') {
                        if (mutation.attributeName == "href")
                            if (mutation.target.nodeName == 'A' || mutation.target.nodeName == 'a') var nn = ProxyfiUrl(mutation.target.href);
                        if (nn != mutation.target.href) {
                            console.log(mutation.target.href + ' change ' + nn);
                            mutation.target.href = nn;
                        }
                    }
                }
            }
            // Create an observer instance linked to the callback function
            const observer = new MutationObserver(callback);
            // Start observing the target node for configured mutations
            observer.observe(targetNode, config);
        } //------------mutation---------
    } else window.requestAnimationFrame(StartMutation);
};
////////////
//alert("set base " + basehref);
if (true) window.addEventListener('DOMContentLoaded', function (event) {
    if (false) //force https
    {
        try {
            document.head.innerHTML = document.head.innerHTML.replace("http:", "https:");
            document.body.innerHTML = document.body.innerHTML.replace("http:", "https:");
        } catch (e) {
        }
    }
    //if(false)
    {
        var anchors = document.getElementsByTagName('a');
        for (var i = 0; i < anchors.length; i++) {
            if (typeof anchors[i].href !== 'undefined')
                if (anchors[i].href != null) {


                    anchors[i].href = ProxyfiUrl(anchors[i].href);
                    anchors[i].onclick = _onClickLink_;
                }
        }
    }
    //if(  window.location.href.includes("&_iframeproxyfi_=1"))
    if (false) //---iframe-----
    {
        var anchors = document.getElementsByTagName('iframe');
        for (var i = 0; i < anchors.length; i++) {
            if (typeof anchors[i].src !== 'undefined')
                if (anchors[i].src != null) anchors[i].src = ProxyfiUrl(anchors[i].src);
        }
    }
    //---iframe-----
    if (true) //---img-----
    {
        var anchors = document.getElementsByTagName('img');
        for (var i = 0; i < anchors.length; i++) {
            try {
                anchors[i].onerror = LoadErrImg;
                if (false) {
                    if (anchors[i].src.startsWith("//")) anchors[i].src = "https:" + anchors[i].src;
                    if (anchors[i].src.startsWith("http://")) anchors[i].src = "https:" + anchors[i].src.substring(7);
                    ;
                }
            } catch (e) {
            }
        }
    } //---end img-----
    //////////////////////////////////////////
    if (false) {
        var anchors = document.getElementsByTagName('link');
        for (var i = 0; i < anchors.length; i++) {
            onload = "handle404Error(this)"
            onerror = "handle404Error(this, true)"
        }
    }
    ////////////////////////////

//if(false)
    if (true) //---css no proxy-----
    {
        var anchors = document.getElementsByTagName('link');

        var cc = 0;
        for (var i = 0; i < anchors.length; i++) {

            if (cc > 10)
                break;
            try {
                if (anchors[i].rel.toLowerCase() == "stylesheet") {


                    cc++;
                    var el = anchors[i];
                    var cln = el.cloneNode(true);


                    if (false)//tmp v2
                        if (anchors[i].href.includes('proxyrec')) {
                            var a = 1;
                            a++;
                            if (true) {
                                const proxyUrlContatin = 'proxyrec';
                                var h = anchors[i].href;
                                var loc = h.substring(h.indexOf("q=") + 2);
                                loc = decodeURIComponent(loc);


                                if (loc.startsWith("http://"))
                                    loc = ProxyfiUrl(loc);


                                cln.href = loc;
                            } else
                                cln.href = ProxyfiUrl(anchors[i].href);

                            document.body.appendChild(cln);
                        }


                    if (!anchors[i].href.includes('proxyrec')) {//tmp v2
                        cln.href = ProxyfiUrl(anchors[i].href);
                        document.body.appendChild(cln);
                    }
                    // anchors[i].href = ProxyfiUrl(  anchors[i].href );
                } else // if(   anchors[i].href.includes('proxyrec'))
                {
                    //cln.href =  ProxyfiUrl( anchors[i].href);
                    //document.body.appendChild(cln);
                }
            } catch (e) {
            }
        }
    }
    if (false) //---css-----
    {
        var anchors = document.getElementsByTagName('link');
        for (var i = 0; i < anchors.length; i++) {
            try {
                if (anchors[i].rel.toLowerCase() == "stylesheet") anchors[i].href = ProxyfiUrl(anchors[i].href);
            } catch (e) {
            }
        }
    }
    //---css-----
    if (true) //again
        _InitClick();


    if (true)//tmp
        setTimeout(function () {
            StartWebRec();
        }, 300);

});


//----------------------------------


function _LoadErr_() {
    var a = 1;
    a++;
}

function LoadErr_(o) {
    o.currentTarget.onerror = null;


    var url = o.currentTarget.href;


    if (url.startsWith('https://app.gazerecorder.com')) {


        var loc = url.substring(url.indexOf("q=") + 2);
        loc = decodeURIComponent(loc);

        if (loc.startsWith("https://")) {
            loc = "http://" + loc.substring(8);


            o.currentTarget.href = proxyUrl + loc;
            return;
        }


    }


    o.currentTarget.href = ProxyfiUrl(url);

    console.log('LoadErr_');
}

function LoadErrImg(o) {
    o.currentTarget.onerror = null;
    o.currentTarget.src = ProxyfiUrl(o.currentTarget.src);
}

///////////////////////
function RedirectProxy(elem) {
    if (typeof elem.href !== 'undefined')
        if (elem.href != null) {
            var url = ProxyfiUrl(elem.href);
            window.location.href = url;
            if (true) parent.postMessage("go: " + url, "*");
            //elem.href = window.location.href ;
            return false;
        }
    return true;
}

//==================================
function _InitClick() {
    //return;
    document.onclick = function (e) {
        if (false) // tmp
        {
            var anchors = document.getElementsByTagName('a');
            for (var i = 0; i < anchors.length; i++) {
                if (typeof anchors[i].href !== 'undefined')
                    if (anchors[i].href != null) {
                        anchors[i].href = ProxyfiUrl(anchors[i].href);
                        anchors[i].onclick = _onClickLink_;
                    }
            }
        }
        e = e || window.event;
        var element = e.target || e.srcElement;
        try {
            if (true) ///////////////
            {
                var parent = element;

                if (true) // v2
                {
                    var anchors = document.getElementsByTagName('a');
                    for (var i = 0; i < anchors.length; i++) {
                        if (typeof anchors[i].href !== 'undefined')
                            if (anchors[i].href != null) {


                                if (!anchors[i].href.includes('proxyrec/index.php?q=')) {
                                    anchors[i].href = ProxyfiUrl(anchors[i].href);
                                    anchors[i].onclick = _onClickLink_;
                                }
                            }
                    }

                    if (true)//forms
                    {
                        var anchors = document.getElementsByTagName('form');
                        for (var i = 0; i < anchors.length; i++) {
                            if (typeof anchors[i].action !== 'undefined') {


                                if (!anchors[i].action.includes('proxyrec/index.php?q=')) {
                                    anchors[i].action = ProxyfiUrl(anchors[i].action);
                                    anchors[i].method = "POST";

                                    var newInput = document.createElement('input');


                                    // Set some properties for the new input element
                                    newInput.type = 'hidden';
                                    newInput.value = '1';
                                    newInput.name = 'convertGET';


                                    // Append the new input element to the form
                                    anchors[i].appendChild(newInput);
                                }
                            }
                        }

                    }

                }

                for (var k = 0; k < 6; k++) {
                    parent = parent.parentNode;
                    if (parent) {
                        var children = parent.childNodes;
                        for (var i = 0; i < children.length; i++) {
                            try {
                                if (children[i].tagName == 'A' || children[i].tagName == 'a')
                                    //if(children[i].hash == "") //tmp v1.2
                                    children[i].href = ProxyfiUrl(children[i].href);
                            } catch (ee) {
                            }
                        }
                    }
                }
            } ///////////////////
        } catch (e) {
        }
        ;
        //for(i = 0 ;) todo check dynami href !!! up parent nodes
        if (element.tagName == 'A' || element.tagName == 'a')
            //if(element.hash == "") //tmp v1.2

        {
            // if(  !url.includes(proxyUrlContatin))
            return RedirectProxy(element);
            // return false; // prevent default action and stop event propagation
        }
    };
    document.onmousedown = document.onclick;
}

_InitClick();
/////////////////////
//$('img').one('error', function(err) {
// console.log(JSON.stringify(err, null, 4))
//  $(this).remove()
//   console.clear()
//})


/////////////////////////////


function ProxyfiAjaxe(url) {
    try {

        if (url.includes(proxyUrlContatin)) return url;


        if (true)
            url.replace("https://app.gazerecorder.com", oo);


        if (true) {
            if (url.includes(proxyUrlBase)) {
                url = url.replace(proxyUrlBase, basehref);
                console.log(' include proxyUrlBase' + url);
            }
            if (containsAny(url) == null) {
                if (url.startsWith("//")) url = "https:" + url;
                if (url.startsWith("/")) {
                    url = oo + url;
                }
                {


                    //return proxyUrl + encodeURIComponent(url);
                    return 'https://app.gazerecorder.com/ajaxproxy/proxy.php?route=' + encodeURIComponent(url);

                }
            }
        } else {
            var a = url;
        }
        return url;
    } catch (e) {
        return url;
    }
}


//----------------------------


if (true) {

    var url = new URL(window.location.href);
    var xhrProxy = url.searchParams.get("xhrProxy");

    if (xhrProxy != null)


//if(false)

        (function (open, send) {

            // Closure/state var's
            var xhrOpenRequestUrl;  // captured in open override/monkey patch
            var xhrSendResponseUrl; // captured in send override/monkey patch
            var responseData;       // captured in send override/monkey patch

            //...overrides of the XHR open and send methods are now encapsulated within a closure

            XMLHttpRequest.prototype.open = function (method, url, async, user, password) {


                url = ProxyfiUrlFF(url);

//url = ProxyfiAjaxe(url);


                xhrOpenRequestUrl = url;     // update request url, closure variable
                open.apply(this, arguments); // reset/reapply original open method
            };

            XMLHttpRequest.prototype.send = function (data) {

                //...what ever code you need, i.e. capture response, etc.
                if (this.readyState == 4 && this.status >= 200 && this.status < 300) {
                    xhrSendResponseUrl = this.responseURL;
                    responseData = this.data;  // now you have the data, JSON or whatever, hehehe!
                }
                send.apply(this, arguments); // reset/reapply original send method
            }

        })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.send)


}
//--------------------------


if (false) {
    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {


        url = ProxyfiAjaxe(url);//'https://app.gazerecorder.com/ajaxproxy/proxy.php?route=' +url ;


//arguments[1] = ProxyfiUrlFF(arguments[1]);


        console.log("XMLHttpRequest open: " + url + " method " + method);
        xhrOpenRequestUrl = url; // update request url, closure variable
        open.apply(this, arguments); // reset/reapply original open method
    };
}


///////////////////////


if (false) {

    var url = new URL(window.location.href);
    var xhrProxy = url.searchParams.get("xhrProxy");

    if (xhrProxy != null)


        if (false) {
            XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
                //return;

                if (false)

                    if (true) {
                        if (method == "POST" || method == "post") return;
                    }


                //url = ProxyfiUrl(url);
                url = ProxyfiUrlFF(url);

                if (false)//tmp
                    method = "GET";


                arguments[1] = ProxyfiUrlFF(arguments[1]);


                if (false) {


                    arguments[1] = arguments[1].replace("https://app.gazerecorder.com/proxyrec/index.php?q=", "https://app.gazerecorder.com/xhrproxy/proxy.php?csurl=");

                }


                console.log("XMLHttpRequest open: " + url + " method " + method);
                xhrOpenRequestUrl = url; // update request url, closure variable
                open.apply(this, arguments); // reset/reapply original open method
            };
        }


}

//================================================
function ProxyfiUrlFF(url) {
    try {

        if (url.includes(proxyUrlContatin)) return url;


        if (true)
            url.replace("https://app.gazerecorder.com", oo);


        if (true) {
            if (url.includes(proxyUrlBase)) {
                url = url.replace(proxyUrlBase, basehref);
                console.log(' include proxyUrlBase' + url);
            }
            if (containsAny(url) == null) {
                if (url.startsWith("//")) url = "https:" + url;
                if (url.startsWith("/")) {
                    url = oo + url;
                }
                {
                    // if(true)
                    // url = decodeURIComponent(url);
                    if (window.location.href.includes("&_noscripts_=1")) return proxyUrl + encodeURIComponent(url) + "&_noscripts_=1";
                    else return proxyUrl + encodeURIComponent(url);
                }
            }
        } else {
            var a = url;
        }
        return url;
    } catch (e) {
        return url;
    }
}

/*
const fetch = window.fetch;
window.fetch = function() {
	var url = ProxyfiUrlFF(arguments[0]);
	arguments[0] = url; //ProxyfiUrl(arguments[0]);
	//console.log("fetch " + arguments);
	console.log("fetch " + arguments[0] + " url " + url);
	return Promise.resolve(fetch.apply(window, arguments))
}
*/


function xhrproxy() {


    try {

        if ($.ajaxPrefilter !== 'undefined') {
            $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                if (options.url.match(/^https?:/)) {
                    // options.headers['X-Proxy-URL'] = options.url;
                    //options.url = 'https://app.gazerecorder.com/xhrproxy/proxy.php';
                    options.url = ProxyfiUrlFF(options.url);
                }
            });


            $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                if (options.url.match(/^http?:/)) {
                    // options.headers['X-Proxy-URL'] = options.url;
                    //options.url = 'https://app.gazerecorder.com/xhrproxy/proxy.php';
                    options.url = ProxyfiUrlFF(options.url);
                }
            });
        }


    } catch (e) {

    }
}

//xhrproxy();

if (false) {


    if (true)
        setTimeout(function () {
            xhrproxy()
        }, 2000);


    if (true)
        setTimeout(function () {
            xhrproxy()
        }, 1000);

    if (true)
        setTimeout(function () {
            xhrproxy()
        }, 100);

}


//////////////

var rrwebRecord = function () {
    "use strict";
    var e, t = function () {
        return (t = Object.assign || function (e) {
            for (var t, n = 1, r = arguments.length; n < r; n++)
                for (var o in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
            return e
        }).apply(this, arguments)
    };

    function n(e) {
        var t = "function" == typeof Symbol && e[Symbol.iterator],
            n = 0;
        return t ? t.call(e) :
            {
                next: function () {
                    return e && n >= e.length && (e = void 0),
                        {
                            value: e && e[n++],
                            done: !e
                        }
                }
            }
    }

    function r(e, t) {
        var n = "function" == typeof Symbol && e[Symbol.iterator];
        if (!n) return e;
        var r, o, a = n.call(e),
            i = [];
        try {
            for (;
                (void 0 === t || t-- > 0) && !(r = a.next()).done;) i.push(r.value)
        } catch (e) {
            o = {
                error: e
            }
        } finally {
            try {
                r && !r.done && (n = a.return) && n.call(a)
            } finally {
                if (o) throw o.error
            }
        }
        return i
    }

    function o() {
        for (var e = [], t = 0; t < arguments.length; t++) e = e.concat(r(arguments[t]));
        return e
    }

    !function (e) {
        e[e.Document = 0] = "Document", e[e.DocumentType = 1] = "DocumentType", e[e.Element = 2] = "Element", e[e.Text = 3] = "Text", e[e.CDATA = 4] = "CDATA", e[e.Comment = 5] = "Comment"
    }(e || (e = {}));
    var a = 1;

    function i(e) {
        try {
            var t = e.rules || e.cssRules;
            return t ? Array.from(t).reduce(function (e, t) {
                return e + (function (e) {
                    return "styleSheet" in e
                }(n = t) ? i(n.styleSheet) || "" : n.cssText);
                var n
            }, "") : null
        } catch (e) {
            return null
        }
    }

    var u = /url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/gm,
        c = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/,
        s = /^(data:)([\w\/\+\-]+);(charset=[\w-]+|base64).*,(.*)/i;

    function l(e, t) {
        if (true)////tmp !!!!!!!!!
            t = basehref;


        return e.replace(u, function (e, n, r, o) {
            var a, i = n || r || o;
            if (!i) return e;
            if (!c.test(i)) return "url('" + i + "')";
            if (s.test(i)) return "url(" + i + ")";
            //tmp src set
            if (i.includes(",")) {
                var a = 1;
                a++;
            }
            if ("/" === i[0]) {
                var aa = "url('" + (((a = t).indexOf("//") > -1 ? a.split("/").slice(0, 3).join("/") : a.split("/")[0]).split("?")[0] + i) + "')";
                if (basehref != null) {
                    aa = aa.replace("https://app.gazerecorder.com", basehref);
                }
                return aa; // "url('" + (((a = t).indexOf("//") > -1 ? a.split("/").slice(0, 3).join("/") : a.split("/")[0]).split("?")[0] + i) + "')";
            }
            var u = t.split("/"),
                l = i.split("/");
            u.pop();
            for (var d = 0, f = l; d < f.length; d++) {
                var p = f[d];
                "." !== p && (".." === p ? u.pop() : u.push(p))
            }
            return "url('" + u.join("/") + "')"
        })
    }

    function d(e, t) {
        //TODO cur base href !!!!!!!!!!!!!
        if ("" === t.trim()) return t;
        var n = e.createElement("a");
        //return n.href = t, n.href
        n.href = t;

        if (n.href.includes(",")) {
            var a = 1;
            a++;
        }


        if (n.href.includes('https://app.gazerecorder.com'))
            if (!n.href.includes('proxyrec/index.php?q=')) {
                var a = 1;
                a++;
            }
        return n.href;
    }

    function f(e, t, n) {
        return "src" === t || "href" === t ? d(e, n) : "srcset" === t ? function (e, t) {


            if (true)////////tmp//////
            {
                t = t.trim();
                t = t.split(",")[0];
            }
            /////end tmp///////

            return "" === t.trim() ? t : t.split(",").map(function (t) {
                var n = t.trimLeft().trimRight().split(" ");
                return 2 === n.length ? d(e, n[0]) + " " + n[1] : 1 === n.length ? "" + d(e, n[0]) : ""
            }).join(",")
        }(e, n) : "style" === t ? l(n, location.href) : n
    }

    function p(t, n, r, o, u, c, s) {
        void 0 === u && (u = !1), void 0 === c && (c = !0), void 0 === s && (s = !1);
        var d, m = function (t, n, r, o, a) {
            switch (t.nodeType) {
                case t.DOCUMENT_NODE:
                    return {
                        type: e.Document, childNodes: []
                    };
                case t.DOCUMENT_TYPE_NODE:
                    return {
                        type: e.DocumentType, name: t.name, publicId: t.publicId, systemId: t.systemId
                    };
                case t.ELEMENT_NODE:
                    var u = !1;
                    "string" == typeof r ? u = t.classList.contains(r) : t.classList.forEach(function (e) {
                        r.test(e) && (u = !0)
                    });
                    for (var c = t.tagName.toLowerCase(), s = {}, d = 0, p = Array.from(t.attributes); d < p.length; d++) {
                        var m = p[d],
                            h = m.name,
                            v = m.value;
                        s[h] = f(n, h, v)
                    }
                    if ("link" === c && o) {
                        var y, g = Array.from(n.styleSheets).find(function (e) {
                            return e.href === t.href
                        });
                        (y = i(g)) && (delete s.rel, delete s.href, s._cssText = l(y, g.href))
                    }
                    if ("style" === c && t.sheet && !(t.innerText || t.textContent || "").trim().length && (y = i(t.sheet)) && (s._cssText = l(y, location.href)), "input" !== c && "textarea" !== c && "select" !== c || (v = t.value, "radio" !== s.type && "checkbox" !== s.type && v ? s.value = a ? "*".repeat(v.length) : v : t.checked && (s.checked = t.checked)), "option" === c) {
                        var b = t.parentElement;
                        s.value === b.value && (s.selected = t.selected)
                    }
                    if ("canvas" === c && (s.rr_dataURL = t.toDataURL()), u) {
                        var E = t.getBoundingClientRect(),
                            C = E.width,
                            w = E.height;
                        s.rr_width = C + "px", s.rr_height = w + "px"
                    }
                    return {
                        type: e.Element,
                        tagName: c,
                        attributes: s,
                        childNodes: [],
                        isSVG: (S = t, "svg" === S.tagName || S instanceof SVGElement || void 0),
                        needBlock: u
                    };
                case t.TEXT_NODE:
                    var N = t.parentNode && t.parentNode.tagName,
                        T = t.textContent,
                        I = "STYLE" === N || void 0;
                    return I && T && (T = l(T, location.href)), "SCRIPT" === N && (T = "SCRIPT_PLACEHOLDER"),
                        {
                            type: e.Text,
                            textContent: T || "",
                            isStyle: I
                        };
                case t.CDATA_SECTION_NODE:
                    return {
                        type: e.CDATA, textContent: ""
                    };
                case t.COMMENT_NODE:
                    return {
                        type: e.Comment, textContent: t.textContent || ""
                    };
                default:
                    return !1
            }
            var S
        }(t, n, o, c, s);
        if (!m) return console.warn(t, "not serialized"), null;
        d = "__sn" in t ? t.__sn.id : a++;
        var h = Object.assign(m,
            {
                id: d
            });
        t.__sn = h, r[d] = t;
        var v = !u;
        if (h.type === e.Element && (v = v && !h.needBlock, delete h.needBlock), (h.type === e.Document || h.type === e.Element) && v)
            for (var y = 0, g = Array.from(t.childNodes); y < g.length; y++) {
                var b = p(g[y], n, r, o, u, c, s);
                b && h.childNodes.push(b)
            }
        return h
    }

    function m(e, t, n) {
        void 0 === n && (n = document);
        var r = {
            capture: !0,
            passive: !0
        };
        return n.addEventListener(e, t, r),
            function () {
                return n.removeEventListener(e, t, r)
            }
    }

    var h, v, y, g, b = {
        map:
            {},
        getId: function (e) {
            return e.__sn ? e.__sn.id : -1
        },
        getNode: function (e) {
            return b.map[e] || null
        },
        removeNodeFromMap: function (e) {
            var t = e.__sn && e.__sn.id;
            delete b.map[t], e.childNodes && e.childNodes.forEach(function (e) {
                return b.removeNodeFromMap(e)
            })
        },
        has: function (e) {
            return b.map.hasOwnProperty(e)
        }
    };

    function E(e, t, n) {
        void 0 === n && (n = {});
        var r = null,
            o = 0;
        return function (a) {
            var i = Date.now();
            o || !1 !== n.leading || (o = i);
            var u = t - (i - o),
                c = this,
                s = arguments;
            u <= 0 || u > t ? (r && (window.clearTimeout(r), r = null), o = i, e.apply(c, s)) : r || !1 === n.trailing || (r = window.setTimeout(function () {
                o = !1 === n.leading ? 0 : Date.now(), r = null, e.apply(c, s)
            }, u))
        }
    }

    function C() {
        return window.innerHeight || document.documentElement && document.documentElement.clientHeight || document.body && document.body.clientHeight
    }

    function w() {
        return window.innerWidth || document.documentElement && document.documentElement.clientWidth || document.body && document.body.clientWidth
    }

    function N(e, t) {
        if (!e) return !1;
        if (e.nodeType === e.ELEMENT_NODE) {
            var n = !1;
            return "string" == typeof t ? n = e.classList.contains(t) : e.classList.forEach(function (e) {
                t.test(e) && (n = !0)
            }), n || N(e.parentNode, t)
        }
        return N(e.parentNode, t)
    }

    function T(e) {
        return Boolean(e.changedTouches)
    }

    function I(e, t) {
        e.delete(t), t.childNodes.forEach(function (t) {
            return I(e, t)
        })
    }

    function S(e, t) {
        var n = t.parentNode;
        if (!n) return !1;
        var r = b.getId(n);
        return !!e.some(function (e) {
            return e.id === r
        }) || S(e, n)
    }

    function D(e, t) {
        var n = t.parentNode;
        return !!n && (!!e.has(n) || D(e, n))
    }

    !function (e) {
        e[e.DomContentLoaded = 0] = "DomContentLoaded", e[e.Load = 1] = "Load", e[e.FullSnapshot = 2] = "FullSnapshot", e[e.IncrementalSnapshot = 3] = "IncrementalSnapshot", e[e.Meta = 4] = "Meta", e[e.Custom = 5] = "Custom"
    }(h || (h = {})),
        function (e) {
            e[e.Mutation = 0] = "Mutation", e[e.MouseMove = 1] = "MouseMove", e[e.MouseInteraction = 2] = "MouseInteraction", e[e.Scroll = 3] = "Scroll", e[e.ViewportResize = 4] = "ViewportResize", e[e.Input = 5] = "Input", e[e.TouchMove = 6] = "TouchMove"
        }(v || (v = {})),
        function (e) {
            e[e.MouseUp = 0] = "MouseUp", e[e.MouseDown = 1] = "MouseDown", e[e.Click = 2] = "Click", e[e.ContextMenu = 3] = "ContextMenu", e[e.DblClick = 4] = "DblClick", e[e.Focus = 5] = "Focus", e[e.Blur = 6] = "Blur", e[e.TouchStart = 7] = "TouchStart", e[e.TouchMove_Departed = 8] = "TouchMove_Departed", e[e.TouchEnd = 9] = "TouchEnd"
        }(y || (y = {})),
        function (e) {
            e.Start = "start", e.Pause = "pause", e.Resume = "resume", e.Resize = "resize", e.Finish = "finish", e.FullsnapshotRebuilded = "fullsnapshot-rebuilded", e.LoadStylesheetStart = "load-stylesheet-start", e.LoadStylesheetEnd = "load-stylesheet-end", e.SkipStart = "skip-start", e.SkipEnd = "skip-end", e.MouseInteraction = "mouse-interaction"
        }(g || (g = {}));
    var x = function (e, t) {
        return e + "@" + t
    };

    function M(e) {
        return "__sn" in e
    }

    function k(e, t, r, o) {
        var a = new MutationObserver(function (a) {
            var i, u, c, s, l = [],
                d = [],
                m = [],
                h = [],
                v = new Set,
                y = new Set,
                g = new Set,
                E = {},
                C = function (e, n) {
                    if (!N(e, t)) {
                        if (M(e)) {
                            y.add(e);
                            var r = null;
                            n && M(n) && (r = n.__sn.id), r && (E[x(e.__sn.id, r)] = !0)
                        } else v.add(e), g.delete(e);
                        e.childNodes.forEach(function (e) {
                            return C(e)
                        })
                    }
                };
            a.forEach(function (e) {
                var n = e.type,
                    r = e.target,
                    o = e.oldValue,
                    a = e.addedNodes,
                    i = e.removedNodes,
                    u = e.attributeName;
                switch (n) {
                    case "characterData":
                        var c = r.textContent;
                        N(r, t) || c === o || l.push(
                            {
                                value: c,
                                node: r
                            });
                        break;
                    case "attributes":
                        c = r.getAttribute(u);
                        if (N(r, t) || c === o) return;
                        var s = d.find(function (e) {
                            return e.node === r
                        });
                        s || (s = {
                            node: r,
                            attributes:
                                {}
                        }, d.push(s)), s.attributes[u] = f(document, u, c);
                        break;
                    case "childList":
                        a.forEach(function (e) {
                            return C(e, r)
                        }), i.forEach(function (e) {
                            var n = b.getId(e),
                                o = b.getId(r);
                            N(e, t) || (v.has(e) ? (I(v, e), g.add(e)) : v.has(r) && -1 === n || function e(t) {
                                var n = b.getId(t);
                                return !b.has(n) || (!t.parentNode || t.parentNode.nodeType !== t.DOCUMENT_NODE) && (!t.parentNode || e(t.parentNode))
                            }(r) || (y.has(e) && E[x(n, o)] ? I(y, e) : m.push(
                                {
                                    parentId: o,
                                    id: n
                                })), b.removeNodeFromMap(e))
                        })
                }
            });
            var w = [],
                T = function (e) {
                    var n = b.getId(e.parentNode);
                    if (-1 === n) return w.push(e);
                    h.push(
                        {
                            parentId: n,
                            previousId: e.previousSibling ? b.getId(e.previousSibling) : e.previousSibling,
                            nextId: e.nextSibling ? b.getId(e.nextSibling) : e.nextSibling,
                            node: p(e, document, b.map, t, !0, r, o)
                        })
                };
            try {
                for (var k = n(y), L = k.next(); !L.done; L = k.next()) {
                    T(A = L.value)
                }
            } catch (e) {
                i = {
                    error: e
                }
            } finally {
                try {
                    L && !L.done && (u = k.return) && u.call(k)
                } finally {
                    if (i) throw i.error
                }
            }
            try {
                for (var _ = n(v), O = _.next(); !O.done; O = _.next()) {
                    var A = O.value;
                    D(g, A) || S(m, A) ? D(y, A) ? T(A) : g.add(A) : T(A)
                }
            } catch (e) {
                c = {
                    error: e
                }
            } finally {
                try {
                    O && !O.done && (s = _.return) && s.call(_)
                } finally {
                    if (c) throw c.error
                }
            }
            for (; w.length && !w.every(function (e) {
                return -1 === b.getId(e.parentNode)
            });) T(w.shift());
            var R = {
                texts: l.map(function (e) {
                    return {
                        id: b.getId(e.node),
                        value: e.value
                    }
                }).filter(function (e) {
                    return b.has(e.id)
                }),
                attributes: d.map(function (e) {
                    return {
                        id: b.getId(e.node),
                        attributes: e.attributes
                    }
                }).filter(function (e) {
                    return b.has(e.id)
                }),
                removes: m,
                adds: h
            };
            (R.texts.length || R.attributes.length || R.removes.length || R.adds.length) && e(R)
        });
        return a.observe(document,
            {
                attributes: !0,
                attributeOldValue: !0,
                characterData: !0,
                characterDataOldValue: !0,
                childList: !0,
                subtree: !0
            }), a
    }

    function L(e, t) {
        var n = [];
        return Object.keys(y).filter(function (e) {
            return Number.isNaN(Number(e)) && !e.endsWith("_Departed")
        }).forEach(function (r) {
            var o = r.toLowerCase(),
                a = function (n) {
                    return function (r) {
                        if (!N(r.target, t)) {
                            var o = b.getId(r.target),
                                a = T(r) ? r.changedTouches[0] : r,
                                i = a.clientX,
                                u = a.clientY;
                            e(
                                {
                                    type: y[n],
                                    id: o,
                                    x: i,
                                    y: u
                                })
                        }
                    }
                }(r);
            n.push(m(o, a))
        }),
            function () {
                n.forEach(function (e) {
                    return e()
                })
            }
    }

    var _, O = ["INPUT", "TEXTAREA", "SELECT"],
        A = ["color", "date", "datetime-local", "email", "month", "number", "range", "search", "tel", "text", "time", "url", "week"],
        R = new WeakMap;

    function z(e, n, r, a) {
        function i(e) {
            var t = e.target;
            if (t && t.tagName && !(O.indexOf(t.tagName) < 0) && !N(t, n)) {
                var o = t.type;
                if ("password" !== o && !t.classList.contains(r)) {
                    var i = t.value,
                        c = !1,
                        s = A.includes(o) || "TEXTAREA" === t.tagName;
                    "radio" === o || "checkbox" === o ? c = t.checked : s && a && (i = "*".repeat(i.length)), u(t,
                        {
                            text: i,
                            isChecked: c
                        });
                    var l = t.name;
                    "radio" === o && l && c && document.querySelectorAll('input[type="radio"][name="' + l + '"]').forEach(function (e) {
                        e !== t && u(e,
                            {
                                text: e.value,
                                isChecked: !c
                            })
                    })
                }
            }
        }

        function u(n, r) {
            var o = R.get(n);
            if (!o || o.text !== r.text || o.isChecked !== r.isChecked) {
                R.set(n, r);
                var a = b.getId(n);
                e(t(
                    {}, r,
                    {
                        id: a
                    }))
            }
        }

        var c = ["input", "change"].map(function (e) {
                return m(e, i)
            }),
            s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value"),
            l = [
                [HTMLInputElement.prototype, "value"],
                [HTMLInputElement.prototype, "checked"],
                [HTMLSelectElement.prototype, "value"],
                [HTMLTextAreaElement.prototype, "value"]
            ];
        return s && s.set && c.push.apply(c, o(l.map(function (e) {
            return function e(t, n, r, o) {
                var a = Object.getOwnPropertyDescriptor(t, n);
                return Object.defineProperty(t, n, o ? r :
                    {
                        set: function (e) {
                            var t = this;
                            setTimeout(function () {
                                r.set.call(t, e)
                            }, 0), a && a.set && a.set.call(this, e)
                        }
                    }),
                    function () {
                        return e(t, n, a ||
                            {}, !0)
                    }
            }(e[0], e[1],
                {
                    set: function () {
                        i(
                            {
                                target: this
                            })
                    }
                })
        }))),
            function () {
                c.forEach(function (e) {
                    return e()
                })
            }
    }

    function F(e, t) {
        void 0 === t && (t = {}),
            function (e, t) {
                var n = e.mutationCb,
                    r = e.mousemoveCb,
                    a = e.mouseInteractionCb,
                    i = e.scrollCb,
                    u = e.viewportResizeCb,
                    c = e.inputCb;
                e.mutationCb = function () {
                    for (var e = [], r = 0; r < arguments.length; r++) e[r] = arguments[r];
                    t.mutation && t.mutation.apply(t, o(e)), n.apply(void 0, o(e))
                }, e.mousemoveCb = function () {
                    for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
                    t.mousemove && t.mousemove.apply(t, o(e)), r.apply(void 0, o(e))
                }, e.mouseInteractionCb = function () {
                    for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
                    t.mouseInteraction && t.mouseInteraction.apply(t, o(e)), a.apply(void 0, o(e))
                }, e.scrollCb = function () {
                    for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
                    t.scroll && t.scroll.apply(t, o(e)), i.apply(void 0, o(e))
                }, e.viewportResizeCb = function () {
                    for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
                    t.viewportResize && t.viewportResize.apply(t, o(e)), u.apply(void 0, o(e))
                }, e.inputCb = function () {
                    for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
                    t.input && t.input.apply(t, o(e)), c.apply(void 0, o(e))
                }
            }(e, t);
        var n, r, a, i, u, c, s, l = k(e.mutationCb, e.blockClass, e.inlineStylesheet, e.maskAllInputs),
            d = (n = e.mousemoveCb, r = e.mousemoveWait, i = [], u = E(function (e) {
                var t = Date.now() - a;
                n(i.map(function (e) {
                    return e.timeOffset -= t, e
                }), e ? v.TouchMove : v.MouseMove), i = [], a = null
            }, 500), c = E(function (e) {
                    var t = e.target,
                        n = T(e) ? e.changedTouches[0] : e,
                        r = n.clientX,
                        o = n.clientY;
                    a || (a = Date.now()), i.push(
                        {
                            x: r,
                            y: o,
                            id: b.getId(t),
                            timeOffset: Date.now() - a
                        }), u(T(e))
                }, r,
                {
                    trailing: !1
                }), s = [m("mousemove", c), m("touchmove", c)], function () {
                s.forEach(function (e) {
                    return e()
                })
            }),
            f = L(e.mouseInteractionCb, e.blockClass),
            p = function (e, t) {
                return m("scroll", E(function (n) {
                    if (n.target && !N(n.target, t)) {
                        var r = b.getId(n.target);
                        if (n.target === document) {
                            var o = document.scrollingElement || document.documentElement;
                            e(
                                {
                                    id: r,
                                    x: o.scrollLeft,
                                    y: o.scrollTop
                                })
                        } else e(
                            {
                                id: r,
                                x: n.target.scrollLeft,
                                y: n.target.scrollTop
                            })
                    }
                }, 100))
            }(e.scrollCb, e.blockClass),
            h = function (e) {
                return m("resize", E(function () {
                    var t = C(),
                        n = w();
                    e(
                        {
                            width: Number(n),
                            height: Number(t)
                        })
                }, 200), window)
            }(e.viewportResizeCb),
            y = z(e.inputCb, e.blockClass, e.ignoreClass, e.maskAllInputs);
        return function () {
            l.disconnect(), d(), f(), p(), h(), y()
        }
    }

    function P(e) {
        return t(
            {}, e,
            {
                timestamp: Date.now()
            })
    }

    function j(e) {
        void 0 === e && (e = {});
        var n, o = e.emit,
            a = e.checkoutEveryNms,
            i = e.checkoutEveryNth,
            u = e.blockClass,
            c = void 0 === u ? "rr-block" : u,
            s = e.ignoreClass,
            l = void 0 === s ? "rr-ignore" : s,
            d = e.inlineStylesheet,
            f = void 0 === d || d,
            y = e.maskAllInputs,
            g = void 0 !== y && y,
            E = e.hooks,
            N = e.mousemoveWait,
            T = void 0 === N ? 50 : N;
        if (!o) throw new Error("emit function is required");
        "NodeList" in window && !NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach);
        var I = 0;

        function S(e) {
            void 0 === e && (e = !1), _(P(
                {
                    type: h.Meta,
                    data:
                        {
                            href: window.location.href,
                            width: w(),
                            height: C()
                        }
                }), e);
            var t = r(function (e, t, n, r) {
                    void 0 === t && (t = "rr-block"), void 0 === n && (n = !0), void 0 === r && (r = !1);
                    var o = {};
                    return [p(e, e, o, t, !1, n, r), o]
                }(document, c, f, g), 2),
                n = t[0],
                o = t[1];
            if (!n) return console.warn("Failed to snapshot the document");
            b.map = o, _(P(
                {
                    type: h.FullSnapshot,
                    data:
                        {
                            node: n,
                            initialOffset:
                                {
                                    left: document.documentElement.scrollLeft,
                                    top: document.documentElement.scrollTop
                                }
                        }
                }))
        }

        _ = function (e, t) {
            if (o(e, t), e.type === h.FullSnapshot) n = e, I = 0;
            else if (e.type === h.IncrementalSnapshot) {
                I++;
                var r = i && I >= i,
                    u = a && e.timestamp - n.timestamp > a;
                (r || u) && S(!0)
            }
        };
        try {
            var D = [];
            D.push(m("DOMContentLoaded", function () {
                _(P(
                    {
                        type: h.DomContentLoaded,
                        data:
                            {}
                    }))
            }));
            var x = function () {
                S(), D.push(F(
                    {
                        mutationCb: function (e) {
                            return _(P(
                                {
                                    type: h.IncrementalSnapshot,
                                    data: t(
                                        {
                                            source: v.Mutation
                                        }, e)
                                }))
                        },
                        mousemoveCb: function (e, t) {
                            return _(P(
                                {
                                    type: h.IncrementalSnapshot,
                                    data:
                                        {
                                            source: t,
                                            positions: e
                                        }
                                }))
                        },
                        mouseInteractionCb: function (e) {
                            return _(P(
                                {
                                    type: h.IncrementalSnapshot,
                                    data: t(
                                        {
                                            source: v.MouseInteraction
                                        }, e)
                                }))
                        },
                        scrollCb: function (e) {
                            return _(P(
                                {
                                    type: h.IncrementalSnapshot,
                                    data: t(
                                        {
                                            source: v.Scroll
                                        }, e)
                                }))
                        },
                        viewportResizeCb: function (e) {
                            return _(P(
                                {
                                    type: h.IncrementalSnapshot,
                                    data: t(
                                        {
                                            source: v.ViewportResize
                                        }, e)
                                }))
                        },
                        inputCb: function (e) {
                            return _(P(
                                {
                                    type: h.IncrementalSnapshot,
                                    data: t(
                                        {
                                            source: v.Input
                                        }, e)
                                }))
                        },
                        blockClass: c,
                        ignoreClass: l,
                        maskAllInputs: g,
                        inlineStylesheet: f,
                        mousemoveWait: T
                    }, E))
            };
            return "interactive" === document.readyState || "complete" === document.readyState ? x() : D.push(m("load", function () {
                _(P(
                    {
                        type: h.Load,
                        data:
                            {}
                    })), x()
            }, window)),
                function () {
                    D.forEach(function (e) {
                        return e()
                    })
                }
        } catch (e) {
            console.warn(e)
        }
    }

    return j.addCustomEvent = function (e, t) {
        if (!_) throw new Error("please add custom event after start recording");
        _(P(
            {
                type: h.Custom,
                data:
                    {
                        tag: e,
                        payload: t
                    }
            }))
    }, j
}();

///////////////////////
let eventsWebRec = [];
var bStopR = false;
var isWaitForSendRec = null;

function StopWebRec() {
    parent.postMessage("stop rec: " + window.location.href, "*");
    if (false)
        bStopR = true;
}

var bIsRecording = false;
var bStartedWebRec = false;

function StartWebRec() {

    if (bStartedWebRec)
        return;

    bStartedWebRec = true;
    //parent.postMessage("start rec: "+ window.location.href ,"*");
    bStopR = false;
    let stopFn = rrwebRecord(
        {
            emit(event) {
                // push event into the events array
                if (!bStopR) {
                    if (!bIsRecording) {
                        //parent.postMessage("start rec: "+ window.location.href ,"*");
                        setTimeout(function () {
                            parent.postMessage("start rec: " + window.location.href, "*");
                        }, 100);
                    }
                    bIsRecording = true;
                    var json = JSON.stringify(event);
                    parent.postMessage(json, "*");
                    // parent.postMessage(event);
                    //events.push(event);
                } else {
                    stopFn();
                }
            },
        });
}

parent.postMessage("recinit: " + window.location.href, "*");
//StartWebRec();
//if(false)
//window.addEventListener('DOMContentLoaded', function(event)
window.addEventListener('load', function (event) {

    _ScrollE();

    setTimeout(function () {

        StartWebRec();


    }, 500);


});
window.addEventListener("beforeunload", function (e) {
    StopWebRec();
}, false);
window.addEventListener("mousedown", function (e) {
    var event = {
        screenX: e.screenX,
        screenY: e.screenY
    }
    // var json = "click: " + JSON.stringify(e);
    var json = "click: " + JSON.stringify(event);
    parent.postMessage(json, "*");
});


//////////////////////////////////
function _ScrollE() {

    document.addEventListener('scroll', function (e) {

        try {
            var scrollY = Math.max(document.body.scrollTop, window.scrollY);
            var scrollX = Math.max(document.body.scrollLeft, window.scrollX);

            var event = {
                x: scrollX,
                y: scrollY
            }

            var json = "_scroll: " + JSON.stringify(event);
            parent.postMessage(json, "*");

        } catch (ee) {
        }
    });


    try//size
    {


        var body = document.body,
            html = document.documentElement;

        var height = Math.max(body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight);
        var width = Math.max(body.scrollWidth, body.offsetWidth,
            html.clientWidth, html.scrollWidth, html.offsetWidth);

        var event = {
            w: width,
            h: height
        }
        var json = "_winSize: " + JSON.stringify(event);
        parent.postMessage(json, "*");

    } catch (aa) {
    }


}


if (false)//////////////////////new/////////////
{


// After all fonts have been checked, log the list of failed fonts


    async function reloadFontFiles(newServer) {
        // Get a FontFaceSet object representing the document's fonts
        let fonts = await document.fonts.ready;
        // Loop through the fonts and log their source and status
        for (let font of fonts) {

            console.log(font.src, font.status);


            // Check if the font is loaded from a remote resource
            if (false)
                if (font.status === "loaded" && font.display === "swap") {
                    console.log(font.src, font.status);


                }
        }
    }


    setTimeout(function () {

        reloadFontFiles();

        let resources = performance.getEntriesByType("resource");
        // Filter the resources that have a font MIME type
        let fonts = resources.filter(
            (res) => res.initiatorType === "css" && res.nextHopProtocol !== "data"
        );

//////////////


///////////

        var failedFonts = [];

// Check each font in the document
        document.fonts.forEach(function (font) {
            font.load().then(function () {
                console.log(font.family + " loaded successfully.");
            }).catch(function () {
                console.log(font.family + " failed to load.");
                failedFonts.push(font.family);
            });
        });


        if (true) {

            var fontSrcArray = [];

            // Iterate over each stylesheet
            Array.from(document.styleSheets).forEach((styleSheet) => {
                // Use try-catch to handle cross-origin restrictions
                try {
                    // Iterate over each rule in the stylesheet
                    Array.from(styleSheet.cssRules).forEach((rule) => {
                        // Check if the rule is a @font-face rule
                        if (rule instanceof CSSFontFaceRule) {
                            // Add the src of the font to the array
                            fontSrcArray.push(rule.style.getPropertyValue('src'));
                        }
                    });
                } catch (e) {
                    console.log('Cannot access stylesheet due to cross-origin restrictions.');
                }
            });

            // Log the src of each font
            console.log(fontSrcArray);

        }


        console.log("Failed to load the following fonts: ", failedFonts);
    }, 5000);
}


if (false)
    window.addEventListener('error', function (event) {
        if (event.target.nodeName == 'IMG' || event.target.nodeName == 'SCRIPT') {
            console.log('Failed to load resource: ' + event.target.src);
            console.log('CORS error occurred');

            if (event.target.nodeName === 'IMG' || event.target.nodeName === 'SCRIPT') {
                console.log('Resource load failed due to CORS: ', event.target.src);


                if (!event.target.src.includes('proxyrec/index.php?q=')) {
                    var newElement = event.target.cloneNode(true);
                    //newElement.src = event.target.src.replace('oldAddress', 'newAddress');
                    newElement.src = ProxyfiUrl(event.target.src);
                    ;
                    newElement.baseURI = ProxyfiUrl(event.target.baseURI);
                    ;

                    document.body.appendChild(newElement);
                    event.target.remove();
                }
            }


            if (false)
                if (!event.target.src.includes('proxyrec/index.php?q=')) {

                    var newResource = event.target.cloneNode(true);

                    // Set the new src
                    newResource.src = ProxyfiUrl(event.target.src);
                    ;

                    // Append the new resource to the body
                    //document.body.appendChild(newResource);
                    //document.head.appendChild(newResource);
                    event.target.parentNode.appendChild(newResource, event.target);
                }


        }
    }, true);


if (false)
    window.addEventListener('error', function (event) {

        console.log(' error occurred' + event.message);

        if (event.target.nodeName == 'LINK') {
            console.log('Failed to load resource: ' + event.target.src);

            var url = event.target.href;
            if (!url.includes('proxyrec/index.php?q=')) {

                event.target.href = ProxyfiUrl(url);
                ;
            }


        }
    }, true);