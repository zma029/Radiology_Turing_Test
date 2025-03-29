/*

 * GazeCloudAPI.js v1.5.0 | JavaScript WebCam Eye-Tracking

 *

 * Copyright 2009-2020 GazeRecorder <contact@gazerecorder.com> www.gazerecorder.com- All rights reserved.

 *

 */
var GazeCloudAPI = new function GazeCloudAPIInit() {
    this.APIKey = "AppKeyDemo";
    //////Callback//////
    this.CalibrationType = 0;
    this.UseClickRecalibration = true;
    this.OnResult = null;


    this.OnInitializing = null;

    this.OnCalibrationStart = null;

    this.OnCalibrationProcessing = null;

    this.OnCalibrationComplete = null;
    this.OnCalibrationFail = null;
    this.OnStopGazeFlow = null;
    this.OnCamDenied = null;
    this.OnError = null;


    this.OnDemoLimit = null;

    this.OnCalibrationAbort = null;

    this.ShowCalibration = ShowCalibration;
    this.OnGazeEvent = null;
    this.beforeunloadNoCloseWs = false;
    this.StartEyeTracking = function (ServerUrl = "", Port = -1) {


        if (ServerUrl != "") {
            ForeceCloudServerAdress = true;
            GazeCloudServerAdress = ServerUrl;
            if (Port > 0)
                GazeCloudServerPort = Port;
            StartGazeFlow();
        } else {

            StartGazeFlow();


            /*
            	GetCloudAdressWait();
                        //   GetCloudAdress();
                        if (!GetCloudAdressReady) {
                            _WaitForGetCloudAdress = setInterval(() => {
                                clearInterval(_WaitForGetCloudAdress);
                                if (!GetCloudAdressReady)
                                    if (Logg) Logg("GetCloudAdress too long", 2);
                                StartGazeFlow();
                            }, 2000);
                        } else {
                            StartGazeFlow();
                        }

            */

        }
        /////////Version 1.0.0///////////
        if (true)
            InitOldAPI();
        /////////end Version 1.0.0///////////
    }
    this.StopEyeTracking = function () {
        StopGazeFlow();
    }
    this.RestartEyeTracking = function () {
        GetCloudAdress();
        StopGazeFlow();
        StartGazeFlow();
        if (Logg) Logg("RestartEyeTracking", 2);
    }

    this.GetSessionId = function () {
        return GazeFlowSesionID;
    }

    //////Callback//////
    var dict;
    var code = 256;
    var codeInit = 256;
    var bUseUnicode = true; // false;
    //var out = [];
    var WebEventStringStream = null;
    var WebEventStringStreamIx = 0;
    var WebEventStringPending = "";

    function RestlzwStream() {
        WebEventStringPending = "";
        WebEventStringStreamIx = 0;
        WebEventStringStream = "";
        dict = new Map();
        code = codeInit;
        // out = [];
    }

    RestlzwStream();

    function lzw_encode_stream(s) {
        try {
            if (!s) return s;
            var out = [];
            var data = (s + "").split("");
            // var data = (s ).split("");
            if (bUseUnicode) {
                var uint8array = new TextEncoder("utf-8").encode(s);
                //s = new TextDecoder().decode(uint8array);
                data = [];
                for (var i = 0; i < uint8array.length; i++)
                    data[i] = String.fromCodePoint(uint8array[i]);
            }
            var currChar;
            var phrase = data[0];
            for (var i = 1; i < data.length; i++) {
                currChar = data[i];
                if (dict.has(phrase + currChar)) {
                    phrase += currChar;
                } else {
                    if (phrase.length > 0) {
                        out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
                        dict.set(phrase + currChar, code);
                        code++;
                        if (code === 0xd800) {
                            code = 0xe000;
                        }
                    }
                    phrase = currChar;
                }
            }
            out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
            code++;
            for (var i = 0; i < out.length; i++) {
                out[i] = String.fromCodePoint(out[i]);
            }
            //console.log ("LZW MAP SIZE", dict.size, out.slice (-50), out.length, out.join("").length);
            return out.join("");
        } catch (e) {
            var a = 1;
            a++;
        }
    }

    function lzw_encode(s) {
        if (!s) return s;
        var dict = new Map(); // Use a Map!
        var data = (s + "").split("");
        var out = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dict.has(phrase + currChar)) {
                phrase += currChar;
            } else {
                out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
                dict.set(phrase + currChar, code);
                code++;
                if (code === 0xd800) {
                    code = 0xe000;
                }
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
        for (var i = 0; i < out.length; i++) {
            out[i] = String.fromCodePoint(out[i]);
        }
        //console.log ("LZW MAP SIZE", dict.size, out.slice (-50), out.length, out.join("").length);
        return out.join("");
    }

    function lzw_decode(s) {
        var dict = new Map(); // Use a Map!
        var data = Array.from(s + "");
        //var data = (s + "").split("");
        var currChar = data[0];
        var oldPhrase = currChar;
        var out = [currChar];
        var code = codeInit;
        var phrase;
        for (var i = 1; i < data.length; i++) {
            var currCode = data[i].codePointAt(0);
            if (currCode < 256) {
                phrase = data[i];
            } else {
                phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
            }
            out.push(phrase);
            var cp = phrase.codePointAt(0);
            currChar = String.fromCodePoint(cp); //phrase.charAt(0);
            dict.set(code, oldPhrase + currChar);
            code++;
            if (code === 0xd800) {
                code = 0xe000;
            }
            oldPhrase = phrase;
        }
        //if(false)
        if (bUseUnicode) //decode
        {
            var ss = out.join("");
            var data = (ss + "").split("");
            //var  data = out;//Array.from(back + "");
            var uint8array = new Uint8Array(data.length); //[];// new TextEncoder("utf-8").encode(s);
            for (var i = 0; i < data.length; i++)
                //uint8array.push(data[i].codePointAt(0));
                uint8array[i] = data[i].codePointAt(0);
            var back = new TextDecoder().decode(uint8array);
            return back;
        }
        return out.join("");
    }


    //--------------------------------------------------

    function __lzw_encode(s) {
        var bUseUnicode = true;

        if (!s) return s;
        var dict = new Map(); // Use a Map!
        var code = 256;
        var codeInit = 256;


        try {
            if (!s) return s;
            var out = [];
            var data = (s + "").split("");

            if (bUseUnicode) {
                var uint8array = new TextEncoder("utf-8").encode(s);
                //s = new TextDecoder().decode(uint8array);
                data = [];
                for (var i = 0; i < uint8array.length; i++) data[i] = String.fromCodePoint(uint8array[i]);
            }
            var currChar;
            var phrase = data[0];
            for (var i = 1; i < data.length; i++) {
                currChar = data[i];
                if (dict.has(phrase + currChar)) {
                    phrase += currChar;
                } else {
                    if (phrase.length > 0) {
                        out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
                        dict.set(phrase + currChar, code);
                        code++;
                        if (code === 0xd800) {
                            code = 0xe000;
                        }
                    }
                    phrase = currChar;
                }
            }
            out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
            code++;
            for (var i = 0; i < out.length; i++) {
                out[i] = String.fromCodePoint(out[i]);
            }
            //console.log ("LZW MAP SIZE", dict.size, out.slice (-50), out.length, out.join("").length);
            return out.join("");
        } catch (e) {
            var a = 1;
            a++;
        }
    }

    this.GetEventsCompress = function () {

        var s = JSON.stringify(eventsWebRec);
        var out = __lzw_encode(s);

        return out;

        //eventsWebRec
        //__lzw_encode
    }

    //--------------------------------------------------

    //////////////////
    function SendBinary(s) {
        var uint8array = new TextEncoder("utf-8").encode(s);
        ws.send(uint8array);
    }

    /////////////////
    /////////////////webrc/////////////////
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
            return t ? t.call(e) : {
                next: function () {
                    return e && n >= e.length && (e = void 0), {
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
            return e.replace(u, function (e, n, r, o) {
                var a, i = n || r || o;
                if (!i) return e;
                if (!c.test(i)) return "url('" + i + "')";
                if (s.test(i)) return "url(" + i + ")";
                if ("/" === i[0]) return "url('" + (((a = t).indexOf("//") > -1 ? a.split("/").slice(0, 3).join("/") : a.split("/")[0]).split("?")[0] + i) + "')";
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
            if ("" === t.trim()) return t;
            var n = e.createElement("a");
            return n.href = t, n.href
        }

        function f(e, t, n) {
            return "src" === t || "href" === t ? d(e, n) : "srcset" === t ? function (e, t) {
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
                        return I && T && (T = l(T, location.href)), "SCRIPT" === N && (T = "SCRIPT_PLACEHOLDER"), {
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
            var h = Object.assign(m, {
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
            map: {},
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
                            N(r, t) || c === o || l.push({
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
                                attributes: {}
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
                                }(r) || (y.has(e) && E[x(n, o)] ? I(y, e) : m.push({
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
                        h.push({
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
            return a.observe(document, {
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
                                e({
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
                        "radio" === o || "checkbox" === o ? c = t.checked : s && a && (i = "*".repeat(i.length)), u(t, {
                            text: i,
                            isChecked: c
                        });
                        var l = t.name;
                        "radio" === o && l && c && document.querySelectorAll('input[type="radio"][name="' + l + '"]').forEach(function (e) {
                            e !== t && u(e, {
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
                    e(t({}, r, {
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
                    return Object.defineProperty(t, n, o ? r : {
                        set: function (e) {
                            var t = this;
                            setTimeout(function () {
                                r.set.call(t, e)
                            }, 0), a && a.set && a.set.call(this, e)
                        }
                    }),
                        function () {
                            return e(t, n, a || {}, !0)
                        }
                }(e[0], e[1], {
                    set: function () {
                        i({
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
                    a || (a = Date.now()), i.push({
                        x: r,
                        y: o,
                        id: b.getId(t),
                        timeOffset: Date.now() - a
                    }), u(T(e))
                }, r, {
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
                                e({
                                    id: r,
                                    x: o.scrollLeft,
                                    y: o.scrollTop
                                })
                            } else e({
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
                        e({
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
            return t({}, e, {
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
                void 0 === e && (e = !1), _(P({
                    type: h.Meta,
                    data: {
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
                b.map = o, _(P({
                    type: h.FullSnapshot,
                    data: {
                        node: n,
                        initialOffset: {
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
                    _(P({
                        type: h.DomContentLoaded,
                        data: {}
                    }))
                }));
                var x = function () {
                    S(), D.push(F({
                        mutationCb: function (e) {
                            return _(P({
                                type: h.IncrementalSnapshot,
                                data: t({
                                    source: v.Mutation
                                }, e)
                            }))
                        },
                        mousemoveCb: function (e, t) {
                            return _(P({
                                type: h.IncrementalSnapshot,
                                data: {
                                    source: t,
                                    positions: e
                                }
                            }))
                        },
                        mouseInteractionCb: function (e) {
                            return _(P({
                                type: h.IncrementalSnapshot,
                                data: t({
                                    source: v.MouseInteraction
                                }, e)
                            }))
                        },
                        scrollCb: function (e) {
                            return _(P({
                                type: h.IncrementalSnapshot,
                                data: t({
                                    source: v.Scroll
                                }, e)
                            }))
                        },
                        viewportResizeCb: function (e) {
                            return _(P({
                                type: h.IncrementalSnapshot,
                                data: t({
                                    source: v.ViewportResize
                                }, e)
                            }))
                        },
                        inputCb: function (e) {
                            return _(P({
                                type: h.IncrementalSnapshot,
                                data: t({
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
                    _(P({
                        type: h.Load,
                        data: {}
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
            _(P({
                type: h.Custom,
                data: {
                    tag: e,
                    payload: t
                }
            }))
        }, j
    }();

    //-----------------
    this.AddIFrameEvent = function (event) {
        //df
        try {
            if (stopFn != null) {
                StopWebRec();
            }
            eventsWebRec.push(event);
        } catch (e) {
        }
    }
    //-----------------
    let eventsWebRec = [];
    var bStopR = false;
    var WebRecFinished = false;

    function StopWebRec() {
        bStopR = true;
        //if(false)
        if (stopFn != null) {
            stopFn();
        }
        //if(stopFn !=null)
        if (false) {
            while (true) {
                if (WebRecFinished)
                    break;
            }
        }
    }

    let stopFn = null;
    var WebRecIx = 0;

    function StartWebRec() {
        WebRecFinished = false;
        RestlzwStream();
        eventsWebRec = [];
        bStopR = false;
        stopFn = rrwebRecord({
            emit(event) {
                if (!bStopR)
                    eventsWebRec.push(event);
                else {
                    stopFn();
                    WebRecFinished = true;
                }
            },
        });
    }

    function ProcessWebRec() {
        return;
        if (CurFrameNr > 5) {
            try {
                if (eventsWebRec.length > WebRecIx) {
                    if (false) {
                        var eventsToSend = eventsWebRec.slice(WebRecIx, eventsWebRec.length); //tmp one blob
                        WebRecIx = eventsWebRec.length;
                        var json_data = JSON.stringify(eventsToSend);
                        //var myJSON = JSON.stringify(json_data);
                        ws.send(json_data);
                    } else {
                        var s = 0;
                        while (WebRecIx < eventsWebRec.length) {
                            var json_data = JSON.stringify(eventsWebRec[WebRecIx]);
                            ws.send(json_data);
                            s += json_data.length;
                            WebRecIx++;
                            if (s > 1000)
                                break;
                        }
                    }
                }
            } catch (e) {
            }
        }
    }

    function _ProcessWebRecStream() {
        try {
            if (eventsWebRec.length > WebRecIx) {
                var s = 0;
                var SendTxt = "";
                while (WebRecIx < eventsWebRec.length) {
                    var json_data = JSON.stringify(eventsWebRec[WebRecIx]) + " , ";
                    var compres = lzw_encode_stream(json_data);
                    SendTxt += compres;
                    WebEventStringStream += compres;
                    WebRecIx++;
                    if (SendTxt.length > 2000)
                        break;
                }
                SendTxt = "we:" + SendTxt;
                ws.send(SendTxt);
                if (false) //test
                {
                    var back = lzw_decode(WebEventStringStream);
                    back += " ";
                }
            }
        } catch (e) {
        }
    }

    var bsWebRecStreamRunig = false;

    function ProcessWebRecStream__(bend = false) {
        if (bsWebRecStreamRunig) {
            var a = 1;
            a++;
        }
        bsWebRecStreamRunig = true;
        if (bend) // bo exit zle nadpisuje
        {
            if (WebEventStringStreamIx < 3)
                return;
        }
        try {
            if (eventsWebRec.length > WebRecIx) {
                var s = 0;
                var SendTxt = "";
                var ll = eventsWebRec.length;
                if (!bend)
                    ll--;
                //if(  WebEventStringStream.length -WebEventStringStreamIx ==0)
                while (WebRecIx < ll) {
                    var json_data = JSON.stringify(eventsWebRec[WebRecIx]) + " , ";
                    // var json_data = JSON.stringify(eventsWebRec[WebRecIx]) + "   ,    ";
                    var compres = lzw_encode_stream(json_data);
                    SendTxt += compres;
                    // if(WebRecIx ==0)
                    //  WebEventStringStream = compres;
                    // else
                    WebEventStringStream += compres;
                    WebRecIx++;
                    if (!bend)
                        if (SendTxt.length > 1000)
                            break;
                }
                SendTxt = "we:" + SendTxt;
                ws.send(SendTxt);
                if (false) {
                    var size = WebEventStringStream.length - WebEventStringStreamIx;
                    // if(false)
                    if (!bend) {
                        if (size > 1000)
                            size = 1000;
                        //if(size < 100)
                        // size = 0;
                    }
                    if (size > 0) {
                        SendTxt = WebEventStringStream.substr(WebEventStringStreamIx, size);
                        //SendTxt =  WebEventStringStream.substr(WebEventStringStreamIx,  size-1);
                        WebEventStringStreamIx += size;
                        if (SendTxt.length > 0) {
                            SendTxt = "we:" + SendTxt;
                            ws.send(SendTxt);
                        } else {
                            var a = 1;
                            a++;
                        }
                    }
                }
            }
        } catch (e) {
            var a = 1;
            a++;
        }
        bsWebRecStreamRunig = false;
    }


    var bRecStreamLock = false;


    var bIsIdle = true;//false;
    this.SetIdle = function (idle = false) {
        bIsIdle = idle;

        if (bIsIdle)
            ProcessWebRecStream(true);
    }


    this.flush = function () {
        ProcessWebRecStream(true);
        if (false)
            for (var i = 0; i < 100; i++) {
                if (!bRecStreamLock)
                    //ProcessWebRecStream(true);
                    ProcessWebRecStream();

            }
    }


    // function ProcessWebRecStream(bend = false)
    function ProcessWebRecStream(bend = false, isDelay = false) {
        if (bend) // bo exit
        {

            if (WebEventStringStreamIx < 3)
                return;
        } else {
            if (bRecStreamLock)
                return;
        }
        try {
            if (eventsWebRec.length > WebRecIx) {
                bRecStreamLock = true;
                var s = 0;
                var SendTxt = "";
                var ll = eventsWebRec.length;
                if (!bend)
                    ll--;

                var MaxD = 1000;
                var FrameCountDelayAck = CurFrameNr - CurFrameAckNr;

                if (FrameCountDelayAck < 5)
                    MaxD = 2000;

                if (isDelay)
                    MaxD = 300;


                //if(  WebEventStringStream.length -WebEventStringStreamIx ==0)
                while (WebRecIx < ll) {
                    var json_data = JSON.stringify(eventsWebRec[WebRecIx]) + " , ";
                    var compres = json_data; //lzw_encode_stream(json_data);
                    SendTxt += compres;
                    WebEventStringStream += compres;
                    WebRecIx++;
                    if (!bend) {
                        if (SendTxt.length > MaxD)
                            break;
                    }
                }
                //SendTxt = "we:"+ SendTxt;
                // ws.send(SendTxt);
                if (true) {
                    var size = WebEventStringStream.length - WebEventStringStreamIx;
                    // if(false)
                    if (!bend) {
                        if (size > MaxD)
                            size = MaxD;
                        //if(size < 100)
                        // size = 0;
                    }
                    if (size > 0) {
                        SendTxt = WebEventStringStream.substr(WebEventStringStreamIx, size);
                        SendTxt = lzw_encode_stream(SendTxt);
                        WebEventStringStreamIx += size;
                        if (SendTxt.length > 0) {
                            SendTxt = "we:" + SendTxt;
                            ws.send(SendTxt);
                        } else {
                            var a = 1;
                            a++;
                        }
                    }
                }
            }
        } catch (e) {
            var a = 1;
            a++;
            bRecStreamLock = false;
        }
        bRecStreamLock = false;
    }


    window.addEventListener("DOMContentLoaded", function () {


        if (typeof GazeRecorderAPI === 'undefined')
            StartWebRec();
    });
    //StartWebRec();


    /////////////////endwebrc/////////////////
    ////////////////////////HtmlGUI/////////////////////////
    var _GuiHtml = '<div id="CamAccessid" style="height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 0.8; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;">Please, Allow Camera Access</h1> </div> <div id="errid" style="height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 0.9; background-color: black;z-index: 99999;" > <h1 id="errmsgid" align="center" style="color: white;">Err</h1>    <p align="center"> <button class= "buttonRecalibrate" onclick=" GazeCloudAPI.RestartEyeTracking();"  type="button">Try again</button> </p>  </div> <div id="loadid" style="height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 0.93; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> Loading...</h1> <div class="loader"></div> </div> <div id="demoid" style="height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 0.8; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;">You have reached demo time limit</h1> </div> <div id="waitslotid" style="height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 0.93; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;">Waiting for free slot...</h1> <h1 id = "waitslottimeid" align="center" style="color: white;">30</h1> </div> <div id="infoWaitForCalibration" style="height: 100%; width: 100%; position: fixed;left: 0px;top: 0%; display: none ;opacity: 0.9;background-color: black;z-index: 999; "> <h1 align="center" style="color: white;"> Please Wait, Calibration processing...</h1> <div id ="clickinfoid" style="position: fixed; height:100%; width:100%; left: 0%;top: 50%;text-align: center; display:block" > <p> Every time you click anywhere on the screen your eyesight accuracy continue improve </p> </div> <div class="loader"></div> </div> <div id="dpimm" style="height: 10cm; width: 10cm; left: 0%; position: fixed; top: 0%; z-index:-1"></div> <div id="CalDivId" style="display: none; z-index: 999;background-color:white; position:fixed; left:0px; top:0px ;width: 100%; height: 100% " > <h1 id = "calinfoid"   style = " text-align: center; position: fixed;margin-left:auto; color:black; z-index: 999;top:25% ; width:100%" >Look at Dot</h1><h1 id = "calinfoWaitid"   style = " text-align: center; position: fixed;margin-left:auto; color:black; z-index: 999;top:60% ; width:100%" >3</h1> <canvas id="CalCanvasId" style="background-color:white ;display: block;  left:0px; top:0px; width: 100%; height: 100%"> </canvas> </div > <div id="initializingid" style="text-align: center; height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 0.6; background-color: black;z-index: 9999;"> <h1 style="color: white;" >Please wait, Initializing...</h1> <div class="loader"></div> </div > <div id="camid" style=" z-index: 1000;position:absolute; left:50%; top:2% ; margin-left: -160px; " >  <video id ="showvideoid" autoplay width="320" height="240" style=" display: block ;border-radius: 16px;background-color:black;"> </video><img height="240" width="320" id="facemaskimgok" src="https://api.gazerecorder.com/FaceMaskok.png" style=" position:absolute; left:0%; top:0%; opacity: 0.6; display: none; border-radius: 16px;"> <img height="240" width="320" id="facemaskimgno" src="https://api.gazerecorder.com/FaceMaskno.png" style=" position:absolute; left:0%; top:0%; opacity: 0.6; display: block; border-radius: 16px;">  <div id="showinit" style="text-align: center;"> <br> <div> <button class = "buttonCal" disabled id="_ButtonCalibrateId" type="button" onclick="GazeCloudAPI.ShowCalibration()"> <img src="https://api.gazerecorder.com/calibrate.png" width="40" height="40" > <p style = " left:0%; top:0%; margin : 0"> Start Gaze Calibration </p> </button> <p id = "corectpositionid" style = " color: red;margin : 0; display:none"> Please, Corect your head position! </p> </div> <br> Make sure that : <ul style="list-style-type:disc; text-align: left;""> <li>Your face is visible</li> <li>You have good light in your room</li> <li>There is no strong light behind your back</li> <li>There is no light reflections on your glasses</li> </ul> </div > </div> <img id="calimgid" src="https://api.gazerecorder.com/calibrate.png" width="300" height="227" style = "display: none;" > <img id="arrowright" src="https://api.gazerecorder.com/arrow-right.png" style = "display: none;" > <img id="arrowleft" src="https://api.gazerecorder.com/arrow-left.png" style = "display: none;" ><img id="arrowdown" src="https://api.gazerecorder.com/arrow-down.png" style = "display: none;" ><img id="arrowup" src="https://api.gazerecorder.com/arrow-up.png" style = "display: none;" ><img id="arrowimgid" src="https://api.gazerecorder.com/arrow-right.png" width="300" height="227" style = "display: none;" > <canvas id="bgcanvas" width="640" height="480" style="display:none"></canvas> <div id="GazeFlowContainer" style=" background-color: white ;height:100%; width:100%; left: 0px; position: fixed; top: 0%;display:none;opacity: 1.0;z-index: 99;" > </div > <div style = "display:none" ><p id= "calinfolook">Look at dot</p><p id= "calinfohead">Turn your head in the direction of the arrow</p></div>';
    //////////////////////////
    ////////////////////////endHTMLGUI////////////////////////////////
    var video = null; // document.querySelector('video');showvideoid
    var videoOrginal = null;
    var _GazeData = {
        state: -1
    };
    var _LastGazeData = null;
    var LastPixData;
    //====================================
    var PrevDif = 0;
    var _LastROI;
    var CurPixDataFull;
    var LastPixDataFull;
    var LastPixDataFull1;
    var LastPixDataFull2;

    function IsNewFrame(_video, GazeD) {
        return true;
    }

    //==============================
    function GetPix() {
        const __canvas = document.createElement('canvas');
        var __canvasContext = __canvas.getContext('2d');
        __canvas.width = video.videoWidth;
        __canvas.height = video.videoHeight;
        __canvasContext.drawImage(video, 0, 0, __canvas.width, __canvas.height);
        var imgPixels = __canvasContext.getImageData(0, 0, __canvas.width, __canvas.height);
        return imgPixels;
    }

    //------------------------------
    function PixDif(p1, p2) {
        var dif = 0;
        for (var y = 0; y < p1.height; y += 2) {
            for (var x = 0; x < p1.width; x += 2) {
                var i = (y * 4) * p1.width + x * 4;
                var d = Math.abs(p1.data[i] - p2.data[i]);
                dif += d;
                if (d > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    //------------------------------
    var pix = null;
    var pixPrev = null;

    function IsNewFrame() {
        if (video.videoWidth == 0 || video.videoHeight == 0) return false;
        if (pixPrev == null) {
            pix = GetPix();
            pixPrev = GetPix();
            return true;
        } else {
            pixPrev = pix;
            pix = GetPix();
            return PixDif(pix, pixPrev);
        }
    }

    //------------------------------
    /////////////////end GetFPS/////////////////
    var CurCalPoint = null;
    //localStorage.CurCalPoint ="null";
    var bIsRunCalibration = false;
    var bIsProcesingCalibration = false;
    var bIsCalibrated = false;

    //===========================================
    function doKeyDown(e) {
        // alert( "doKeyDown"   );
        if (e.keyCode == 27) {


            try {
                if (GazeCloudAPI.OnCalibrationAbort != null)
                    GazeCloudAPI.OnCalibrationAbort();
            } catch (ee) {
            }


            if (bIsRunCalibration) FinishCalibration();
        }
    }

    //===========================================
    var _LoopCalibration;

    function AbortCalibration() {
        bIsCalibrated = false;
        CurCalPoint = null;
        bIsProcesingCalibration = false;
        bIsRunCalibration = false;
        clearInterval(_LoopCalibration);
        document.getElementById("CalCanvasId").style.backgroundColor = 'white';
        document.getElementById("CalDivId").style.display = "none";
        document.getElementById("infoWaitForCalibration").style.display = "none";
        closeFullscreen();
        if (false)
            if (GazeCloudAPI.OnCalibrationFail != null) GazeCloudAPI.OnCalibrationFail();
        GUIState = 'InvalidCalibration';
        if (true) UpdateGUI(_GazeData);
    }

    //===========================================
    function FinishCalibration() {


        Info.RunCalStat = GetStat();


        if (true) SendStat();
        if (true) // update gui
        {
            camid.style = ' z-index: 1000;position:fixed; left:0%; top:0%; opacity: 0.7; display:none ';
            //camid.style=' z-index: 1000;position:fixed;  opacity: 0.7; display:none ';
        }
        CurCalPoint = null;
        bIsProcesingCalibration = true;
        bIsRunCalibration = false;
        clearInterval(_LoopCalibration);
        document.getElementById("CalCanvasId").style.backgroundColor = 'white';
        document.getElementById("CalDivId").style.display = "none";
        ws.send("cmd:FinishCalibration");
        bIsRunCalibration = false;
        //if(false)
        closeFullscreen();
        if (false) InitClickCalibration();
        document.getElementById("infoWaitForCalibration").style.display = "block";
        GUIState = 'WaitForCalibrationComplete';
        camid.style.position = "fixed";
        camid.style.left = "0%";
        camid.style.top = "0%";
        camid.style.opacity = 0.7;
        /////
        if (true) UpdateGUI(_GazeData);
        if (true) RePlayVideo();


        try {
            if (GazeCloudAPI.OnCalibrationProcessing != null) GazeCloudAPI.OnCalibrationProcessing();
        } catch (eee) {
        }


        try {
            GazeCloudAPI.flush();
        } catch (eeee) {
        }
        ;

    }

    //////////////////////Calibration///////////////////////
    var ctx = null;

    function InitCalibration() {
        var canvas = document.getElementById("CalCanvasId");
        canvas.width = window.innerWidth; // 2;
        canvas.height = window.innerHeight;
        //canvas.width = window.screen.width ;///2 ;
        //canvas.height = window.screen.height;///2;
        //canvas.style.display = "block";
        ctx = canvas.getContext("2d");
        canvas.style.backgroundColor = "white";
        canvas.style.cursor = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
    }

    var CalDeviceRation = window.devicePixelRatio;

    function etmp() {
    }

    function ShowCalibration() {
        if (Logg) Logg("ShowCalibration", 2);

        openFullscreen(etmp);

        setTimeout(_ShowCalibration, 200);
    }

    //---------------------
    function _ShowCalibration() {
        if (true) // update gui
        {
            camid.style = ' z-index: 1000;position:fixed; left:0%; top:0%; opacity: 0.7; display:none ';
        }


        try {
            if (GazeCloudAPI.OnCalibrationStart != null) GazeCloudAPI.OnCalibrationStart();
        } catch (eee) {
        }

        bIsIdle = false;

        var InfoPlot = document.getElementById('calinfoid');
        var InfoWaitPlot = document.getElementById('calinfoWaitid');
        if (true) UpdateGUI(_GazeData);
        GUIState = 'RunCalibration';
        if (true) showinit.style.display = 'none';
        const imagearrow = document.getElementById('arrowimgid');
        const imagecal = document.getElementById('calimgid');
        CalDeviceRation = devicePixelRatio;
        CalDeviceRation = (window.innerWidth * window.devicePixelRatio) / window.screen.width;
        bIsCalibrated = false;
        bIsRunCalibration = true;
        document.getElementById("CalDivId").style.display = "block";
        //if(false)
        var canvas = document.getElementById("CalCanvasId");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (true) UpdateGUI(_GazeData);
        document.addEventListener('keydown', doKeyDown);
        var vPoints = [];
        var mx = .03;
        var my = .05;
        var step = 3; //3;//3;//2;//3;
        var stepx = step;
        var stepy = step;
        var isMobile = window.orientation > -1;
        if (isMobile) {
            stepx = 2;
            stepy = 2;
        }
        if (window.innerWidth < window.innerHeight) {
            stepx = stepy - 1;
        }

        var bColors = true;
        var bHeadMove = true;

        if (GazeCloudAPI.CalibrationType == 1) {
            stepx = 1;
            stepy = 1;
            bHeadMove = false;

            //stepx = 2;
            //       stepy = 2;
        }


        //////////init///////////////
        var calinfolook = document.getElementById('calinfolook').innerHTML;
        var calinfohead = document.getElementById('calinfohead').innerHTML;
        var SizeF = 1.0
        if (isMobile) SizeF = .7;
        var minSize = 16; // 6
        var AddSize = 20;
        var showtime = 1200; //800;// 1500.0;
        var infotime = 2500;
        //  minSize = 16;
        AddSize = 20 * SizeF;
        minSize = 10 * SizeF;
        var MainColor = "#777777"; // "gray";//"#101010"; "gray";//"#646C7F";
        // var MainColor ="#555555";
        vPoints.push({
            x: .5,
            y: .5,
            color: MainColor,
            txt: calinfolook, //"Look at Dot!",
            type: -1,
            time: infotime
        });
        vPoints.push({
            x: .5,
            y: .5,
            color: MainColor,
            type: 0,
            time: showtime
        });
        //for (var y = my; y <= 1.0 - my; y += (1.0 - 2 * my) / stepy)
        for (var y = my; y <= 1.0; y += (1.0 - 2 * my) / stepy)
            for (var x = mx; x <= 1.0 - mx; x += (1.0 - 2 * mx) / stepx) {
                if (true) //move point
                {
                    px = vPoints[vPoints.length + -1].x;
                    py = vPoints[vPoints.length + -1].y;
                    var d = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
                    var MoveTime = 200 + (600.0 * d);
                    var pp = {
                        x: x,
                        y: y,
                        color: MainColor,
                        type: 1,
                        time: MoveTime
                    };
                    vPoints.push(pp);
                }
                var p = {
                    x: x,
                    y: y,
                    color: MainColor,
                    type: 0,
                    time: showtime
                };
                vPoints.push(p);
            }
        if (true) {
            var x = .5;
            var y = .5;
            px = vPoints[vPoints.length + -1].x;
            py = vPoints[vPoints.length + -1].y;
            var d = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
            var MoveTime = 200 + (600.0 * d);
            var pp = {
                x: x,
                y: y,
                color: MainColor,
                type: 1,
                time: MoveTime
            };
            vPoints.push(pp);
        }


        //	if (true) //head move
        //      if (GazeCloudAPI.CalibrationType == 0) {
        if (bHeadMove) {

            var headmove = .3;
            vPoints.push({
                x: .5,
                y: .5,
                color: "white",
                txt: calinfohead, //"Turn your head in the direction of the arrow",
                type: -1,
                time: infotime,
                head: document.getElementById('arrowleft')
            });
            vPoints.push({
                x: .5 - headmove,
                y: .5,
                color: "white",
                type: 1,
                time: showtime,
                head: document.getElementById('arrowleft')
            });
            vPoints.push({
                x: .5 - headmove,
                y: .5,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5,
                y: .5,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5 + headmove,
                y: .5,
                color: "white",
                type: 1,
                time: showtime,
                head: document.getElementById('arrowright')
            });
            vPoints.push({
                x: .5 + headmove,
                y: .5,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5,
                y: .5,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5,
                y: .5 - headmove,
                color: "white",
                type: 1,
                time: showtime,
                head: document.getElementById('arrowup')
            });
            vPoints.push({
                x: .5,
                y: .5 - headmove,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5,
                y: .5,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5,
                y: .5 + headmove,
                color: "white",
                type: 1,
                time: showtime,
                head: document.getElementById('arrowdown')
            });
            vPoints.push({
                x: .5,
                y: .5 + headmove,
                color: "white",
                type: 0,
                time: showtime
            });
            vPoints.push({
                x: .5,
                y: .5,
                color: "white",
                type: 0,
                time: showtime
            });


        } ///end head move


        ///////////////colors////////////


        //    if (GazeCloudAPI.CalibrationType == 0)
        if (bColors) {

            ///////////////white//////////////////////
            if (true) {
                var MoveTime = 1000;

                if (!bHeadMove) {
                    vPoints.push({
                        x: .5,
                        y: .5,
                        color: "white",
                        type: 0,
                        time: showtime
                    });

                    vPoints.push({
                        x: .5,
                        y: .1,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move


                    vPoints.push({
                        x: .5,
                        y: .1,
                        color: "white",
                        type: 0,
                        time: showtime
                    });
                    vPoints.push({
                        x: .9,
                        y: .5,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                    vPoints.push({
                        x: .9,
                        y: .5,
                        color: "white",
                        type: 0,
                        time: showtime
                    });
                    vPoints.push({
                        x: .5,
                        y: .9,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                    vPoints.push({
                        x: .5,
                        y: .9,
                        color: "white",
                        type: 0,
                        time: showtime
                    });
                    vPoints.push({
                        x: .1,
                        y: .5,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                    vPoints.push({
                        x: .1,
                        y: .5,
                        color: "white",
                        type: 0,
                        time: showtime
                    });


                    vPoints.push({
                        x: .5,
                        y: .5,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move

                } else {

                    vPoints.push({
                        x: .1,
                        y: .1,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move


                    vPoints.push({
                        x: .1,
                        y: .1,
                        color: "white",
                        type: 0,
                        time: showtime
                    });
                    vPoints.push({
                        x: .9,
                        y: .1,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                    vPoints.push({
                        x: .9,
                        y: .1,
                        color: "white",
                        type: 0,
                        time: showtime
                    });
                    vPoints.push({
                        x: .9,
                        y: .9,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                    vPoints.push({
                        x: .9,
                        y: .9,
                        color: "white",
                        type: 0,
                        time: showtime
                    });
                    vPoints.push({
                        x: .1,
                        y: .9,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                    vPoints.push({
                        x: .1,
                        y: .9,
                        color: "white",
                        type: 0,
                        time: showtime
                    });


                    vPoints.push({
                        x: .5,
                        y: .5,
                        color: "white",
                        type: 1,
                        time: MoveTime
                    }); // move
                }


            }


            ///////////////dark//////////////////////
            if (true) {
                var MoveTime = 1000;
                vPoints.push({
                    x: .5,
                    y: .5,
                    color: "play",
                    type: 0,
                    time: 1.5 * showtime
                });
                vPoints.push({
                    x: .1,
                    y: .1,
                    color: "black",
                    type: 1,
                    time: MoveTime
                }); // move
                vPoints.push({
                    x: .1,
                    y: .1,
                    color: "black",
                    type: 0,
                    time: showtime
                });
                vPoints.push({
                    x: .9,
                    y: .1,
                    color: "black",
                    type: 1,
                    time: MoveTime
                }); // move
                vPoints.push({
                    x: .9,
                    y: .1,
                    color: "black",
                    type: 0,
                    time: showtime
                });
                vPoints.push({
                    x: .9,
                    y: .9,
                    color: "black",
                    type: 1,
                    time: MoveTime
                }); // move
                vPoints.push({
                    x: .9,
                    y: .9,
                    color: "black",
                    type: 0,
                    time: showtime
                });
                vPoints.push({
                    x: .1,
                    y: .9,
                    color: "black",
                    type: 1,
                    time: MoveTime
                }); // move
                vPoints.push({
                    x: .1,
                    y: .9,
                    color: "black",
                    type: 0,
                    time: showtime
                });
            }
        } ///////end colors///////
        //////////end init///////////////
        var Ix = 0;
        var x = 0;
        var y = .3;
        var size = 1.0;
        var startTime = Date.now();
        size = -1;
        Ix = -1;
        Ix = 0;
        size = 1.0;
        if (true) {
            ws.send(sendScreensize());
            ws.send("cmd:StartCalibration");
        }
        if (true) UpdateGUI(_GazeData);
        if (true) {
            RePlayVideo();
            //setTimeout(RePlayVideo, 1000);
        }
        var StartPointFrameNr = CurFrameNr;
        _LoopCalibration = setInterval(() => {
            //if(_GazeData.state ==-1) // tracking lost puse
            if (TrackingLostShow) {
                return;
            }
            if (!bIsRunCalibration) return;
            var duration = Date.now() - startTime;
            try {
                if (Ix > -1)
                    if (vPoints[Ix].color == "play") showtime *= 1.5;
                var _conf = duration / vPoints[Ix].time;
                if (_conf > 1) _conf = 1;
                size = 1.0 - _conf;
                //if(size < .1 || Ix < 0)///next point
                var FrameCountOk = true;
                if (vPoints[Ix].type == 0) {
                    if (CurFrameNr - StartPointFrameNr < 15) FrameCountOk = false;
                    if (duration / vPoints[Ix].time > 2.5) FrameCountOk = true
                }
                if (FrameCountOk)
                    if (size < .01 || Ix < 0) ///next point
                    {
                        Ix++;
                        size = 1.0;
                        startTime = Date.now();
                        StartPointFrameNr = CurFrameNr;
                    }
                //////////////////////finish cal////////////
                if (Ix > vPoints.length - 1) // stop
                {
                    FinishCalibration();
                    return;
                }
                //////////////////////end finish cal////////////
                if (vPoints[Ix].color == "play")
                    //if(true)
                {
                    var c = size * 255;
                    var color = 'rgb(' + c + ' , ' + c + ' , ' + c + ' )';
                    canvas.style.backgroundColor = color;
                } else canvas.style.backgroundColor = vPoints[Ix].color;
                x = vPoints[Ix].x;
                y = vPoints[Ix].y;
                if (Ix > 0 && vPoints[Ix].type == 1) // move point
                {
                    ////////////////// move animation/////////////////
                    var f = 1.0 - size;
                    //f = .5;
                    f = 1.0 - Math.sin(f * (3.14 / 2.0));
                    x = (vPoints[Ix - 1].x * f + (1.0 - f) * vPoints[Ix].x);
                    y = (vPoints[Ix - 1].y * f + (1.0 - f) * vPoints[Ix].y);
                    size = 1.0 - size;
                }
                if (false) ctx.globalCompositeOperation = 'destination-over';
                if (false) {
                    ctx.fillStyle = "#646C7F"; // Specify black as the fill color.
                    ctx.fillRect(0, 0, canvas.width, canvas.height); // Create a filled rectangle.
                } else ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
                // color: #646C7F;
                if (true) // show info
                {
                    if (typeof vPoints[Ix].txt !== 'undefined') {
                        InfoPlot.innerHTML = vPoints[Ix].txt;
                        InfoWaitPlot.innerHTML = Math.round(size * 3.0);
                        // ctx.font = "30px Arial";
                        // ctx.fillStyle = "black";
                        //ctx.textAlign = "center";
                        // ctx.fillText(vPoints[Ix].txt, canvas.width/2, canvas.height/2.3);
                        size = 1;
                    } else {
                        InfoPlot.innerHTML = "";
                        InfoWaitPlot.innerHTML = "";
                    }
                }
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(x * canvas.width, y * canvas.height, (minSize + AddSize * size), 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                if (typeof vPoints[Ix].head !== 'undefined') {
                    var ss = 2 * (minSize + AddSize) + 3; //+ 10;
                    ctx.drawImage(vPoints[Ix].head, x * canvas.width - ss / 2, y * canvas.height - ss / 2, ss, ss);
                } else
                    //if(true)
                {
                    var ss = 2 * (minSize + AddSize) + 3; //+ 10;
                    ctx.drawImage(imagecal, x * canvas.width - ss / 2, y * canvas.height - ss / 2, ss, ss);
                }
            } catch (ee) //drawing exeption
            {
            }
            if (_GazeData.state == -1) // tracking lost puse
            {
                if (vPoints[Ix].type == 1) //move point
                {
                    Ix++;
                }
                //startTime= Date.now();
                CurCalPoint = null;
            } else {
                // if( vPoints[Ix].type == 0)
                if (true) {
                    if (vPoints[Ix].type != 0) _conf = 0;
                    var isMobile = window.orientation > -1;
                    // if(!isMobile)
                    if (true) {
                        CurCalPoint = {
                            x: x * window.innerWidth * window.devicePixelRatio / CalDeviceRation + window.screenX,
                            y: y * window.innerHeight * window.devicePixelRatio / CalDeviceRation + window.screenY + (window.outerHeight - window.innerHeight * window.devicePixelRatio / CalDeviceRation),
                            conf: _conf,
                            type: 0
                        };
                    } else {
                        CurCalPoint = {
                            x: x * window.screen.width,
                            y: y * window.screen.height,
                            conf: _conf,
                            type: 0
                        };
                    }
                    if (false) //old
                    {
                        CurCalPoint = {
                            x: x * window.innerWidth + window.screenX,
                            y: y * window.innerHeight + window.screenY + (window.outerHeight - window.innerHeight),
                            conf: _conf,
                            type: 0
                        };
                    }
                } else CurCalPoint = null;
            }
        }, 30);
        if (true) UpdateGUI(_GazeData);
    }

    //------------------------------
    function isFullscreen() {
        //  if($.browser.opera){
        // var fs=$('<div class="fullscreen"></div>');
        //  $('body').append(fs);
        // var check=fs.css('display')=='block';
        // fs.remove();
        //  return check;
        // }
        var st = screen.top || screen.availTop || window.screenTop;
        if (st != window.screenY) {
            return false;
        }
        return window.fullScreen == true || screen.height - document.documentElement.clientHeight <= 30;
    }

    //------------------------------
    function InitClickCalibration() {
        //console.log("InitClickCalibration click document.onmousedown ");
        document.onmousedown = processClick;
        return;
        var cursorX;
        var cursorY;
        document.onmousedown = function (e) {
            cursorX = e.screenX;
            cursorY = e.screenY;
            console.log("InitClickCalibration click document.onmousedown ");
            if (!bIsRunCalibration) {
                CurCalPoint = {
                    x: cursorX,
                    y: cursorY,
                    conf: 1.0,
                    type: 10
                };
            }
        }
    }

    //------------------------------
    this.processClick = function (e) {
        if (!GazeCloudAPI.UseClickRecalibration)
            return;
        var cursorX;
        var cursorY;
        cursorX = e.screenX;
        cursorY = e.screenY;
        //console.log("processClick click document.onmousedown ");
        if (!bIsRunCalibration) {
            CurCalPoint = {
                x: cursorX,
                y: cursorY,
                conf: 1.0,
                type: 10
            };
        }
    }
    //------------------------------
    //////////////////////end Calibration///////////////////////
    /////////////////////BeginCam///////////////////////
    //====================================
    var _LastGazeD;
    var _OnlyEyesC = 0;
    var _OnlyEyesCount = 0;
    var ctx = null;
    var ctxL = null;
    var ctxR = null;
    var _canvas = null;
    var canvasContext = null;
    var bLastUseLowQuality = false;

    function getGrayFrameROIResize(_video, GazeD, bOnlyEyes = false, quality = .9) {
        try {
            if (_canvas == null) {
                _canvas = document.createElement('canvas');
                canvasContext = _canvas.getContext('2d');
            }
            var rx = 0;
            var ry = 0;
            var rw = _video.videoWidth;
            var rh = _video.videoHeight;
            if (typeof GazeD === 'undefined' || GazeD.state == -1) {
                ;
            } else {
                // if(GazeD.rw >= 0 && GazeD.rh >= 0)
                {
                    rx = GazeD.rx;
                    ry = GazeD.ry;
                    rw = GazeD.rw;
                    rh = GazeD.rh;
                }
            }
            _canvas.width = 80; //120;//120;//150;
            // _canvas.width =40;//tmp
            //  _canvas.width =180;//tmp
            var fff = .5;
            if (bLastUseLowQuality) fff *= .7;
            if (false) {
                if (SkipFactor < fff) {
                    _canvas.width = 40;
                    //     canvasContext.filter = 'blur(2px)';
                    //canvasContext.filter = 'grayscale(50%) brightness(50%) ';
                    bLastUseLowQuality = true;
                } else {
                    // canvasContext.filter = '';
                    bLastUseLowQuality = false;
                }
            }
            //   _canvas.width =180;//tmp
            if (GazeD.state == -1) _canvas.width = 160; //200;// 160;
            _canvas.height = _canvas.width;
            LastVideoTime = video.currentTime;
            canvasContext.drawImage(_video, rx, ry, rw, rh, 0, 0, _canvas.width, _canvas.height);
            ///////////
            quality = .9;
            // quality = .97;
            if (true)
                if (GazeD.state == -1) quality = .8;
            //   quality = .92;
            const datagray = _canvas.toDataURL('image/jpeg', quality);
            var r;
            r = {
                'imgdata': datagray,
                'w': _video.videoWidth,
                'h': _video.videoHeight,
                'rx': rx,
                'ry': ry,
                'rw': rw,
                'rh': rh,
                's': _canvas.width
            };
            return r;
        } catch (ee) {
            if (Logg) Logg("getFrame exeption : " + ee.message, -2);
        }
    }

    //--------------------------------------
    function dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0) byteString = atob(dataURI.split(',')[1]);
        else byteString = unescape(dataURI.split(',')[1]);
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return ia;
        return new Blob([ia], {
            type: mimeString
        });
    }

    /////////////////GetFPS/////////////////
    // sleep time expects milliseconds
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    var _LoopFPS;

    function GetFrameFPS() {
        return 30;
    }

    //------------------------------
    ////////stat////////
    var minNetworkDelay = 999999;
    var maxNetworkDelay = 0;
    var avrNetworkDelay = 0;
    var networkDelay = 0;
    var processkDelay = 0;
    var skipProcessCount = 0;
    var CamFPS = 0;


    function GetStat() {
        var stat = "CamFPS:" + CamFPS + " minNetworkDelay: " + minNetworkDelay + " maxNetworkDelay: " + maxNetworkDelay + " avrNetworkDelay: " + avrNetworkDelay + " skipProcessCount: " + skipProcessCount + " skipF: " + skipProcessCount / CurFrameNr;
        return stat;
    }

    function SendStat() {
        try {
            var stat = "CamFPS:" + CamFPS + " minNetworkDelay: " + minNetworkDelay + " maxNetworkDelay: " + maxNetworkDelay + " avrNetworkDelay: " + avrNetworkDelay + " skipProcessCount: " + skipProcessCount + " kipF: " + skipProcessCount / CurFrameNr;
            if (CamFPS > 0)
                if (Logg) Logg("stat : " + stat, 5);
            ws.send(stat);
        } catch (e) {
        }
    }

    //////end stat/////////
    ///////fps///////
    var fpsstartTime = -1;
    var fpst = 0
    var fpscout = 0

    function UpdateCamFPS() {
        if (fpsstartTime == -1) fpsstartTime = Date.now();
        var t = video.currentTime;
        if (t > fpst) {
            fpscout++;
        }
        var tt = Date.now();
        if (tt - fpsstartTime > 1000 * 2) {
            CamFPS = 1000.0 * fpscout / (tt - fpsstartTime);
            //console.log(" CamFPS" + CamFPS);
            if (true) {
                clearInterval(_LoopCamSend);
                var interval = 1000 / CamFPS;
                _CamLoopInterval = interval;
                interval += 3;
                if (interval < 33) // max 30 fps
                    interval = 33;
                //if(interval < 17)// max 60 fps
                //interval = 17;
                if (false) {
                    _CamLoopInterval = interval;
                    _LoopCamSend = setInterval(CamSend, _CamLoopInterval);
                }
            }
        } else {
            fpst = t;
            setTimeout(UpdateCamFPS, 2);
        }
    }

    //////end fps//////
    var _delaySendC = 0;
    var ConnectionAuthorizationStatus;
    var bCamOk = false;
    var ws = null;
    var _delaySendC = 0;
    var curTimeStap = 0;
    var CurFrameNr = 0;
    var CurFrameReciveNr = 0;
    var CurFrameReciveTime = 0;
    var CurFrameAckNr = 0;
    var CurFrameAckTime = 0;
    /////////////////Init Cam Send/////////////////
    var _fps = -1;
    var _LoopCamSend = null;
    //-------------------------------------
    var oCamSendFPS = 30; //15;//30;//15;//30;
    this.SetFps = function (fps) {
        if (Logg) Logg("SetFps : " + fps, 5);
        if (fps > 30) fps = 30;
        if (fps < 3) fps = 3;
        oCamSendFPS = fps;
    }
    var bGazeCloundLowFpsSend = false;
    this.SetLowFps = function (bval = false) {
        bGazeCloundLowFpsSend = bval;
    }
    //-------------------------------------
    var SendFrameCountDelay = 0;
    var SkipCount = 0;
    var SkipFactor = 1;
    var CheckFpsDelayIter = 0;
    var ZoomCanvas = null;
    var ZoomCanvasStream = null;
    var ZoomCanvasCtx = null;
    var LastCamFrameNr = 0;
    var SkipCamFrameCount = 0;
    var LastVideoTime = 0;
    var LastVideoGrabTime = 0;
    var LastSendVidoTime = 0;
    var LastSendVideoTime = 0;

    function GetWebCamFrameNr() {
        //webkit Decoded Frame Count
        return video.presentedFrames ? !0 : video.mozPaintedFrames
    };
    //-----------------------------------------
    var LastSendTime = 0;
    var FrameTime = 0; // Date.now();
    var LastWaitT = 30;
    var bExitCamSendLoop = false;

    function CamSendLoop() {
        if (bExitCamSendLoop) return;
        var videoTime = video.currentTime;
        var bNewVideoGrap = true;
        if (true) {
            var tt = Date.now();
            if (videoTime <= LastVideoTime) {
                bNewVideoGrap = false;
                if (false) video.play();
                SkipCamFrameCount++;
                var dd = tt - LastVideoGrabTime;
                //if (SkipCamFrameCount > 10 * 33.0 / _CamLoopInterval) // frozen min
                if (dd > 500) // frozen min
                {
                    video.play();
                    if (Logg) Logg("frozen video : " + SkipCamFrameCount + " dt " + dd, 2);
                    //console.log(" frozen replay " + SkipCamFrameCount +  " dt " +dd );
                    //RePlayVideo();
                    LastVideoGrabTime = tt;
                    LastVideoTime = videoTime;
                    SkipCamFrameCount = 0;
                }
                // setTimeout(CamSendLoop, 5);
                // requestAnimationFrame(CamSendLoop);
                if (true) {
                    //  console.log("  no video change  " + videoTime +  "  ; " +LastVideoTime );
                    //setTimeout(function() {
                    //	requestAnimationFrame(CamSendLoop);
                    //}, 1);


                    if (!bIsIdle)
                        requestAnimationFrame(CamSendLoop);
                    else
                        setTimeout(function () {
                            requestAnimationFrame(CamSendLoop);
                        }, 100);

                    return;
                }
            } else {
                LastVideoGrabTime = tt;
                LastVideoTime = videoTime;
                SkipCamFrameCount = 0;
            }
        }
        if (ws == null) return;
        if (ws.readyState != WebSocket.OPEN) return;
        var bSend = true;


        if (bIsIdle) {
            var FrameCountDelay = CurFrameNr - CurFrameReciveNr;
            if (FrameCountDelay > 1)
                bSend = false;
        } else {


            var bIsRT = true;


            var BuforMaxC = 6; //6; // 10;
            if (true) {
                BuforMaxC = 5 + minNetworkDelay / 33;
                if (BuforMaxC > 15)
                    BuforMaxC = 15;
                if (BuforMaxC < 5)
                    BuforMaxC = 5;
                if (true) {
                    BuforMaxC *= oCamSendFPS / 30.0;

                    if (BuforMaxC < 3) BuforMaxC = 3;
                }
            }

            var t = Date.now();
            var dif = t - LastSendTime;


            var FrameCountDelay = CurFrameNr - CurFrameReciveNr;
            var FrameCountDelayAck = CurFrameNr - CurFrameAckNr;


            if (dif > 1000)
                FrameCountDelay = FrameCountDelayAck;


            if (true) {
                if (_GazeData.state == -1) // tracking lose
                {
                    if (FrameCountDelay > 2) bSend = false;
                } else {
                    if (FrameCountDelay > BuforMaxC) bSend = false;
                }
                if (bGazeCloundLowFpsSend) {
                    if (FrameCountDelay > 1) bSend = false;
                }
                var waitT = 33; //20;//_CamLoopInterval;


                if (waitT < .8 * LastWaitT) waitT = .8 * LastWaitT;

                waitT = 30;
                waitT = 1.0 / oCamSendFPS * 1000.0 - 2;


                if (bSend)
                    if (dif < waitT) {
                        bSend = false;
                        // console.log("  wait send to hight cpu "  +dif  );
                    }
                // console.log(" waitT " + waitT);
                waitT = LastWaitT * .9 + .1 * waitT;
                LastWaitT = waitT;
                SendFrameCountDelay = FrameCountDelay;


                if (!bSend)
                    if (FrameCountDelay < 2 * BuforMaxC)
                        if (dif > 250) {
                            bSend = true;
                        }

                if (!bSend)
                    if (FrameCountDelay < 3 * BuforMaxC)
                        if (dif > 500) {
                            bSend = true;
                        }

            }
            if (bNewVideoGrap)
                SkipCount++;
            if (bSend && !bNewVideoGrap) {
                //  console.log("  no video change try resend prev " + LastSendVideoTime +  "  ; " +LastVideoTime );
            }

        }


        if (bSend) {
            SkipCount = 0;
            var OnlyEyes = false;
            if (CurCalPoint != null) ////// cal point///////
            {
                var cp = Object.assign({}, CurCalPoint);
                var json_data = JSON.stringify(cp);
                ws.send(json_data);
                if (CurCalPoint.type == 10) // reset cur click point
                    CurCalPoint = null;
            } //////end cal point///////
            FrameTime = Date.now();
            LastSendTime = FrameTime;
            var dd = getGrayFrameROIResize(video, _GazeData, OnlyEyes);
            LastSendVideoTime = LastVideoTime;
            curTimeStap = Date.now();
            dd.time = curTimeStap;
            dd.FrameNr = CurFrameNr;
            CurFrameNr++;
            var myJSON = JSON.stringify(dd);
            if (false)
                SendBinary(myJSON);
            else
                ws.send(myJSON);
            if (true) {
                //if (FrameCountDelay < BuforMaxC-1 ||  SkipFactor > .95)
                //ProcessWebRec();

                var bDelay = false;

                if (BuforMaxC > 3)
                    if (FrameCountDelay > BuforMaxC - 2)
                        bDelay = true;
                ProcessWebRecStream(false, bDelay);
            }
        } // end send


        if (!bIsIdle)
            if (bNewVideoGrap) {
                CheckFpsDelayIter++;
                if (_GazeData.state != -1) // tracking lose
                    if (!bGazeCloundLowFpsSend) {
                        if (CurFrameNr > 100) {
                            var s = 1;
                            if (!bSend) s = 0;
                            SkipFactor = .95 * SkipFactor + s * .05;
                        }
                    }
                var FrameCountDelay = CurFrameNr - CurFrameReciveNr;
                var waitT = 33;
                var processDelay = Date.now() - LastSendTime;
                waitT = _CamLoopInterval;
                waitT -= processDelay;

                if (waitT < 5) waitT = 5;

            }
        if (bSend) {
            var dd = (FrameCountDelay - BuforMaxC * .7) / BuforMaxC;
            if (dd < 0)
                dd = 0;
            var ww = 30 + 30 * dd;
            setTimeout(function () {
                requestAnimationFrame(CamSendLoop);
            }, 5); // ww);
        } else {
            if (!bIsIdle)
                requestAnimationFrame(CamSendLoop);
            else
                setTimeout(function () {
                    requestAnimationFrame(CamSendLoop);
                }, 200);

        }

    }

    //-------------------------------------
    var bIsSending = false;

    function CamSend() {
        return;
        //if(bIsSending)
        //  console.log(" !!!!!bIsSending " + bIsSending);
        bIsSending = true;
        if (true) {
            var videoTime = video.currentTime;
            if (videoTime <= LastVideoTime) {
                if (false) video.play();
                SkipCamFrameCount++;
                //console.log( " SkipCamFrameCount " +SkipCamFrameCount);
                if (SkipCamFrameCount > 10 * 33.0 / _CamLoopInterval) // frozen min
                {
                    video.play();
                    RePlayVideo();
                    if (Logg) Logg("frozen video : " + SkipCamFrameCount, 2);
                    console.log(" frozen replay " + SkipCamFrameCount);
                }
                // if(false)
                bIsSending = false;
                return;
            }
            LastVideoTime = videoTime;
            //LastCamFrameNr = frameNr;
            SkipCamFrameCount = 0;
        }
        if (false) //////////zoom////////
        {
            if (false)
                if (ZoomCanvas == null) {
                    ZoomCanvas = document.createElement("canvas");
                    ZoomCanvas.width = videoOrginal.videoWidth;
                    ZoomCanvas.height = videoOrginal.videoHeight;
                    ZoomCanvasStream = ZoomCanvas.captureStream(5);
                    video.src = ZoomCanvasStream;
                }
            if (ZoomCanvasCtx)
                //ctx.drawImage(videoOrginal,  videoOrginal.videoWidth*.25,  videoOrginal.videoHeight*.25,   videoOrginal.videoWidth/2,  videoOrginal.videoHeight/2,  0, 0, ZoomCanvas.width,   ZoomCanvas.height );
                ZoomCanvasCtx.drawImage(videoOrginal, (videoOrginal.videoWidth - ZoomCanvas.width) / 2, (videoOrginal.videoHeight - ZoomCanvas.height) / 2, ZoomCanvas.width, ZoomCanvas.height, 0, 0, ZoomCanvas.width, ZoomCanvas.height);
        } //////////end zoom////////
        if (ws == null) {
            bIsSending = false;
            return;
        }
        if (ws.readyState != WebSocket.OPEN) {
            bIsSending = false;
            return;
        }
        var bSend = true;
        if (true) {
            var FrameCountDelay = CurFrameNr - CurFrameReciveNr;
            var FrameCountDelayAck = CurFrameNr - CurFrameAckNr;
            if (FrameCountDelay > FrameCountDelayAck - 1) FrameCountDelay = FrameCountDelayAck - 1;
            if (_GazeData.state == -1) // tracking lose
            {
                if (FrameCountDelay > 2)
                    // if(FrameCountDelay > 1)
                    bSend = false;
            } else {
                if (FrameCountDelay > 6) bSend = false;
            }
            if (bGazeCloundLowFpsSend) {
                if (FrameCountDelay > 1) bSend = false;
            }
            SendFrameCountDelay = FrameCountDelay;
        }
        SkipCount++;
        if (bSend) {
            bIsSending = true;
            SkipCount = 0;
            var OnlyEyes = false;
            if (CurCalPoint != null) ////// cal point///////
            {
                var cp = Object.assign({}, CurCalPoint);
                var json_data = JSON.stringify(cp);
                ws.send(json_data);
                if (CurCalPoint.type == 10) // reset cur click point
                    CurCalPoint = null;
            } //////end cal point///////
            var dd = getGrayFrameROIResize(video, _GazeData, OnlyEyes);
            //var dd = getGrayFrameROIResize(videoOrginal, _GazeData ,OnlyEyes  );
            curTimeStap = Date.now();
            dd.time = curTimeStap;
            dd.FrameNr = CurFrameNr;
            CurFrameNr++;
            var myJSON = JSON.stringify(dd);
            ws.send(myJSON);
        } // end send
        CheckFpsDelayIter++;
        if (_GazeData.state != -1) // tracking lose
            if (!bGazeCloundLowFpsSend) {
                if (CurFrameNr > 100) {
                    var s = 1;
                    if (!bSend) s = 0;
                    SkipFactor = .95 * SkipFactor + s * .05;
                }
            }
        bIsSending = false;
    }

    //-------------------------------------
    if (false) setInterval(function () {
        try {
            ws.send(" ");
        } catch (e) {
        }
    }, 10);
    var curFps = 100;

    function SetSendFps(vfps = 29) {
        return;
        if (vfps < 10) vfps = 10;
        if (vfps > 30) vfps = 30;
        //console.log( " SetSendFps : " +vfps);
        if (curFps == vfps) return;
        curFps = vfps;
        console.log("SetSendFps : " + vfps);
        if (Logg) Logg("SetSendFps : " + vfps, 2);
        if (_LoopCamSend) clearInterval(_LoopCamSend);
        _LoopCamSend = setInterval(CamSend, 1000 / vfps);
    }

    //-------------------------------------
    var _LoopPlay = null;
    var _CamLoopInterval = 36; //15;//10;//36;//15;
    function InitCamSend() {
        //UpdateCamFPS();
        var FPS = 30;
        try {
            if (_fps < 0) {
                _fps = video.srcObject.getVideoTracks()[0].getSettings().frameRate;
                //alert("sframeRate " +_fps );
                FPS = _fps;
                FPS = 28; // tmp test
            }
        } catch (err) {
            ;
        }
        //SetSendFps(FPS);
        //_LoopCamSend =  setInterval(CamSend, 1000 / FPS);
        // _LoopCamSend = setInterval(CamSend, _CamLoopInterval);
        bExitCamSendLoop = false;
        CamSendLoop();
    }

    //--------------------------------------
    var MediaStrem = null;

    function HideGUI() {
        try {
            var GazeFlowContainer = document.getElementById("GazeFlowContainer");
            GazeFlowContainer.style.display = 'none';
            showinit.style.display = 'none';
            loadid.style.display = 'none';
            initializingid.style.display = 'none';
            CalDivId.style.display = 'none';
            infoWaitForCalibration.style.display = 'none';
            errid.style.display = 'none';
            demoid.style.display = 'none';
            CamAccessid.style.display = 'none';
            camid.style.display = 'none';
            disableStyle('GazeCloudAPI.css', true);
        } catch (ee) {
        }
    }

    //--------------------------------------
    function CloseWebCam() {
        try {
            bExitCamSendLoop = true;
            if (true) {
                LastVideoTime = 0;
                LastCamFrameNr = 0;
                SkipCamFrameCount = 0;
                curFps = 30;
                SkipFactor = 1;
                _delaySendC = 0;
                bCamOk = false;
                //ws = null;
                _delaySendC = 0;
                curTimeStap = 0;
                CurFrameNr = 0;
                CurFrameReciveNr = 0;
                CurFrameReciveTime = 0;
                CurFrameAckNr = 0;
                CurFrameAckTime = 0;
                _GazeData.FrameNr = 0;
                _GazeData.state = -1;
            }

            ForeceCloudServerAdress = false;
            RetrayCountNoSlot = 0;
            ConnectCount = 0;
            GoodFrameCount = 0;
            BadFrameCount = 0;
            bCamOk = false;
            _delaySendC = 0;
            curTimeStap = 0;
            CurFrameNr = 0;
            CurFrameReciveNr = 0;
            CurFrameAckNr = 0;
            CurFrameAckTime = 0;
            RedirectCount = 0;
            if (_LoopCamSend != null) clearInterval(_LoopCamSend);
            _LoopCamSend = null;
            if (MediaStrem != null) MediaStrem.getTracks()[0].stop();
            Disconect();
            UpdateGUI(_GazeData);

            if (false)
                LoggSend();


        } catch (a) {
            ;
        }
        try {
            if (OnStopGazeFlow != null) OnStopGazeFlow();
        } catch (e) {
        }
    }

    //======================
    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    function CheckgetUserMedia() {
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function (constraints) {
                // First get ahold of the legacy getUserMedia, if present
                var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                // Some browsers just don't implement it - return a rejected promise with an error
                // to keep a consistent interface
                if (!getUserMedia) {
                    ///
                    if (Logg) Logg("getUserMedia is not implemented in this browser! ", -2);
                    alert("Camera access is not supported by this browser! Try: Chrome 53+ | Edge 12+ | Firefox 42+ | Opera 40+ | Safari 11+  ");
                    //  if( GazeCloudAPI.OnCamDenied != null)
                    //      GazeCloudAPI.OnCamDenied();
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }
                // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
                return new Promise(function (resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }
    }

    ///////////////
    var DeneidCount = 0;

    function deniedStream(err) {
        DeneidCount++;
        // ShowErr("Please, Allow Camera Access to start Eye-Tracking!");
        //setTimeout(function () {

        if (GazeCloudAPI.OnCamDenied == null) {
            if (document.getElementById("AllowCamInfo") != null)

                alert(document.getElementById("AllowCamInfo").innerHTML);
            else {
                alert("Camera access denied! Please, Allow Camera Access to start Eye-Tracking");
            }
        }

        if (Logg) Logg("Camera access denied! " + err.message, 2);
        //if(DeneidCount == 1)
        if (DeneidCount == 0) StartCamera();
        else {
            StopGazeFlow();

            var m = '';
            try {
                m = err.message;
            } catch (ee) {
            }

            if (GazeCloudAPI.OnCamDenied != null) GazeCloudAPI.OnCamDenied(m);
        }
        //}, 3000);
    }

    function errorStream(e) {
        if (e) {
            console.error(e);
            if (Logg) Logg("errorStream " + e.name + ": " + e.message, -2);
        }
        StopGazeFlow();


        var m = '';
        try {
            m = "errorStream " + e.name + ": " + e.message;
        } catch (ee) {
        }

        if (GazeCloudAPI.OnCamDenied != null) GazeCloudAPI.OnCamDenied(m);
    }

    var backgroundCanvas = null; //document.getElementById('bgcanvas');
    var bgCanCon = null; //backgroundCanvas.getContext('2d');
    function RePlayVideo() {
        return;
        try {
            video.play();
            //  return;
            bgCanCon.drawImage(video, 0, 0);
            setTimeout(function () {
                video.play();
            }, 1000);
            //}, 1500);
        } catch (e) {
            if (Logg) Logg("RePlayVideo exeption" + e.mesage, -2);
        }
    }

    //------------------------
    function startStream(stream) {
        DeneidCount = 0;
        backgroundCanvas = document.getElementById('bgcanvas');
        bgCanCon = backgroundCanvas.getContext('2d');
        MediaStrem = stream;
        //added hidden canvas due to problems with the drawImage() function on Safari browser
        bgCanCon.drawImage(video, 0, 0);
        video.addEventListener('canplay', function DoStuff() {
            bgCanCon.drawImage(video, 0, 0);
            video.removeEventListener('canplay', DoStuff, true);
            setTimeout(function () {
                video.play();
                UpdateCamFPS();
            }, 1000);
        }, true);
        video.srcObject = stream;
        video.play();
        if (false) {
            //added hidden canvas due to problems with the drawImage() function on Safari browser
            bgCanCon.drawImage(videoOrginal, 0, 0);
            videoOrginal.addEventListener('canplay', function DoStuff() {
                bgCanCon.drawImage(videoOrginal, 0, 0);
                videoOrginal.removeEventListener('canplay', DoStuff, true);
                setTimeout(function () {
                    videoOrginal.play();
                }, 1000);
            }, true);
            videoOrginal.srcObject = stream;
            videoOrginal.play();
        }
        InitVideo(stream);
    }

    var video_constraints = {
        width: {
            min: 1920,
            max: 1920
        },
        height: {
            min: 1080,
            max: 1080
        },
        require: ["width", "height"] // needed pre-Firefox 38 (non-spec)
    };

    function StartCamera() {
        if (true) {
            try {
                CheckgetUserMedia();
            } catch (ee) {
                if (Logg) Logg("CheckgetUserMedia exeption" + ee.mesage, -2);
            }
        }
        //Here is where the stream is fetched
        try {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
                width: 480,
                height: 640
            }).then(startStream).catch(deniedStream);
        } catch (e) {
            try {
                navigator.mediaDevices.getUserMedia('video', startStream, deniedStream);
            } catch (e) {
                errorStream(e);
            }
        }
        video.loop = video.muted = true;
        video.autoplay = true;
        video.load();
        videoOrginal.loop = video.muted = true;
        videoOrginal.autoplay = true;
        videoOrginal.load();
    }

    //////////////////////
    function OpenWebCam() {
        bExitCamSendLoop = false;
        //video = document.querySelector('video');
        video = document.getElementById("showvideoid");
        videoOrginal = document.createElement('video');
        videoOrginal.width = 640;
        videoOrginal.height = 480;
        if (true) {
            video.onended = function () {
                // alert("video has ended");
                if (Logg) Logg("video has ended", -2);
            }
            video.onpause = function () {
                RePlayVideo();
                // alert("video has onpause");
                if (Logg) Logg("video has onpause", -2);
            }
        }
        try {
            if (true) //nn
            {
                video.setAttribute("playsinline", true);
                videoOrginal.setAttribute("playsinline", true);
            }
        } catch (ee) {
        }
        document.getElementById("CamAccessid").style.display = 'block';
        ;
        GUIState = 'WaitWebCam';
        var ff = .5; //.3;//.5;// 1;//.5;//1;//2;//1;
        //ff =1.0; // tmp
        var _w_ = 320.0 / ff;
        var _h_ = 240.0 / ff;
        if (false)
            if (true) // hd
            {
                _w_ = 1280;
                _h_ = 720;
            }
        var isMobile = window.orientation > -1;
        if (false) // old
        {
            try {
                //MediaDevices.getUserMedia({video: {width: _w_ , height: _h_ }}).then((stream) => InitVideo(stream))
                navigator.mediaDevices.getUserMedia({
                    video: {
                        width: _w_,
                        height: _h_
                    }
                }).then((stream) => InitVideo(stream)).catch(function (err) {
                    StopGazeFlow();
                    alert("Can not acces webcam " + err.name + ": " + err.message);
                    console.log(err.name + ": " + err.message);
                    if (Logg) Logg(err.name + ": " + err.message, -2);
                });
            } catch (error) {
                alert("init webcam fail" + error);
                if (Logg) Logg("init webcam fail" + error, -2);
            }
        } // end old
        StartCamera();
        if (false) UpdateGUI(_GazeData);
    }

    //-------------------------------------
    var MediaInfo = "";

    function InitVideo(s) {
        try {
            if (false) //nn
            {
                MediaStrem = s;
                videoOrginal = document.createElement('video');
                video.srcObject = s;
                videoOrginal.srcObject = s;
                videoOrginal.autoplay = true;
            }
            if (false) //////////zoom////////
                videoOrginal.onplay = function () {
                    if (ZoomCanvas == null) {
                        try {
                            ZoomCanvas = document.createElement("canvas");
                            ZoomCanvas.width = 640; //videoOrginal.videoWidth ;
                            ZoomCanvas.height = 480; //videoOrginal.videoHeight ;
                            ZoomCanvasStream = ZoomCanvas.captureStream(30);
                            ZoomCanvasCtx = ZoomCanvas.getContext('2d');
                            video.srcObject = ZoomCanvasStream;
                        } catch (e) {
                        }
                    }
                } //////////end zoom////////
            bCamOk = true;
            Connect();
            if (false) video.onplay = function () {
                Connect();
            }
            if (true) //_gui
                document.getElementById("CamAccessid").style.display = "none";
            if (true) //nn
                UpdateGUI(_GazeData);
            if (false)
                if (true) //info
                {
                    navigator.mediaDevices.enumerateDevices().then(function (devices) {
                        devices.forEach(function (device) {
                            MediaInfo += device.kind + ": " + device.label + " id = " + device.deviceId;
                        });
                    }).catch(function (err) {
                        console.log(err.name + ": " + err.message);
                    });
                }
        } catch (error) {
            console.log("InitVideo err " + error);
        }
    }

    function StreamReady() {
    }

    /////////////////////EndCam///////////////////////
    ////////////////connection//////////////////////
    var ForeceCloudServerAdress = false;
    var GazeFlowSesionID = null;
    var GazeCloudServerAdress = "wss://cloud.gazerecorder.com:";
    var GazeCloudServerPort = 43334;
    var isWaitForAutoryzation = null;
    var RedirectCount = 0;
    var ConnectionOk = false;
    var ConnectCount = 0;
    var GoodFrameCount = 0;
    var BadFrameCount = 0;
    var RedirectPort = 43335;
    //------------------------------
    var GetCloudAdressReady = false;
    var _WaitForGetCloudAdress = null;
    var GetCloudAdresInfo = null;


    //------------------------------
    var _WaitForGetCloudAdressReconect = null;
    var GetCloudAdressReconectCount = 0;
    var vConnectHistory = [];

    ////////////////////
    //------------------------------
    function ResetGetCloudAdressReconnect() {
        vConnectHistory = [];
        GetCloudAdressReconectCount = 0;
        if (_WaitForGetCloudAdressReconect != null) {
            clearTimeout(_WaitForGetCloudAdressReconect);
            _WaitForGetCloudAdressReconect = null;
        }
    }

    //------------------------------

    function WaitGetCloudAdressReconnect() {

        if (_WaitForGetCloudAdressReconect != null)
            _WaitForGetCloudAdressReconect = setTimeout(GetCloudAdressReconnectFail, 5000);
    }

    //------------------------------
    function GetCloudAdressReconnectFail() {

        if (_WaitForGetCloudAdressReconect != null) {
            clearTimeout(_WaitForGetCloudAdressReconect);
            _WaitForGetCloudAdressReconect = null;
        }
        if (Logg) Logg("GetCloudAdressReconnectFail  ");


        ShowErr("Can not connect to GazeFlow server!");
        return;
    }

    //------------------------------
    function GetCloudAdressReconnect() {


        Disconect();

        if (Logg) Logg("GetCloudAdressReconnect wait");

        if (GetCloudAdressReconectCount > 3) {
            GetCloudAdressReconnectFail();
            return;
        }


        GetCloudAdressReconnectReady = false;
        var myJSON = JSON.stringify(vConnectHistory);
        var url = 'https://api.gazerecorder.com/GetCloudAdress/?vConnectHistory=' + myJSON;
        ;
        let req = new XMLHttpRequest();
        let formData = new FormData();
        req.open("GET", url);

        if (_WaitForGetCloudAdressReconect != null) {
            clearTimeout(_WaitForGetCloudAdressReconect);
            _WaitForGetCloudAdressReconect = null;
        }

        req.onload = function () {

            try {
                var info = JSON.parse(req.response);
                GetCloudAdresInfo = info;
                if (typeof info.err !== 'undefined')
                    if (info.err != "") {
                        ShowErr(info.err);
                        return;
                    }

                if (info.adress == 'null') {
                    GetCloudAdressReconnectFail();
                    return;
                }
                if (Logg) Logg("GetCloudAdressReconnectFail ok");
                GazeCloudServerAdress = info.adress;
                GazeCloudServerPort = info.port;
                GetCloudAdressReconnectReady = true;
                GetCloudAdressReady = true;
                ConnectCount = 0;
                RedirectCount = 0;

                _Connect(GazeCloudServerAdress, GazeCloudServerPort);

            } catch (e) {
            }
        }
        //end onload
        req.onerror = function (e) {


            GetCloudAdressReconnectFail();


            if (Logg) Logg("GetCloudAdressReconnect err ");
        }
        req.send(null);
    }

    ////////////////////

    //----------------------------
    //------------------------------
    var GetCloudAdressWaitC = 0;

    function GetCloudAdressWait() {


        if (ForeceCloudServerAdress) {
            GetCloudAdressReady = true;
            StartGazeFlow();
            return;
        }


        document.getElementById("initializingid").style.display = 'block';

        GetCloudAdressReady = false;


        _WaitForGetCloudAdress = setInterval(() => {
            clearInterval(_WaitForGetCloudAdress);
            if (!GetCloudAdressReady)
                if (Logg) Logg("GetCloudAdress too long", 2);
            //    StartGazeFlow();
            _Connect(GazeCloudServerAdress, GazeCloudServerPort);
            //  Connect(GazeCloudServerAdress);
        }, 5000);


        var url = 'https://api.gazerecorder.com/GetCloudAdress/';
        let req = new XMLHttpRequest();
        let formData = new FormData();
        req.open("GET", url);
        req.onload = function () {
            try {
                var info = JSON.parse(req.response);
                GetCloudAdresInfo = info;
                if (typeof info.err !== 'undefined')
                    if (info.err != "") {
                        ShowErr(info.err);
                        return;
                    }


                if (GetCloudAdressWaitC < 3)
                    if (typeof info.retray !== 'undefined') {
                        GetCloudAdressWaitC++;
                        var waitT = info.retray;
                        clearInterval(_WaitForGetCloudAdress);

                        setTimeout(function () {
                            GetCloudAdressWait();
                        }, waitT);


                        return;
                    }


                clearInterval(_WaitForGetCloudAdress);

                GetCloudAdressReady = true;
                if (!ForeceCloudServerAdress) {
                    GazeCloudServerAdress = info.adress;
                    GazeCloudServerPort = info.port;
                }

                _Connect(GazeCloudServerAdress, GazeCloudServerPort);
                // Connect(GazeCloudServerAdress);
                //GazeCloudServerAdress

                StartGazeFlow();

            } catch (e) {
            }
        }
        //end onload
        req.onerror = function (e) {
            if (Logg) Logg("GetCloudAdress err ");

            clearInterval(_WaitForGetCloudAdress);

            _Connect(GazeCloudServerAdress, GazeCloudServerPort);

            //  Connect(GazeCloudServerAdress);
            //StartGazeFlow();

        }
        req.send(null);
    }

    //------------------------------
    function GetCloudAdress() {
        GetCloudAdressReady = false;
        var url = 'https://api.gazerecorder.com/GetCloudAdress/';
        let req = new XMLHttpRequest();
        let formData = new FormData();
        req.open("GET", url);
        req.onload = function () {
            try {
                var info = JSON.parse(req.response);
                GetCloudAdresInfo = info;
                if (typeof info.err !== 'undefined')
                    if (info.err != "") {
                        ShowErr("info.err");
                        return;
                    }

                if (!ForeceCloudServerAdress) {
                    GazeCloudServerAdress = info.adress;
                    GazeCloudServerPort = info.port;
                }
                GetCloudAdressReady = true;
            } catch (e) {
            }
        }
        //end onload
        req.onerror = function (e) {
            if (Logg) Logg("GetCloudAdress err ");
        }
        req.send(null);
    }

    // GetCloudAdress();

    //------------------------------
    function WaitForAutoryzation() {
        RedirectPort = GazeCloudServerPort + 1;
        // if(Logg)
        //    Logg("start WaitForAutoryzation + b:"+isWaitForAutoryzation ,2);
        if (isWaitForAutoryzation != null) {
            clearTimeout(isWaitForAutoryzation);
            isWaitForAutoryzation = null;
        }
        isWaitForAutoryzation = setTimeout(function () {
            if (true) //tmp
                if (isWaitForAutoryzation == null) return;
            if (!ConnectionOk) {
                // alert("WaitForAutoryzation fail: reconect")
                console.log("WaitForAutoryzation fail: reconect");

                if (true) {

                    // if (RedirectCount > 4) RedirectPort = GazeCloudServerPort + 2;

                    RedirectPort = GazeCloudServerPort + ConnectCount;
                    //  if (RedirectPort > GazeCloudServerPort + 8) RedirectPort = GazeCloudServerPort + 1;
                    if (RedirectPort > GazeCloudServerPort + 4) RedirectPort = GazeCloudServerPort + 1;
                    var _url = GazeCloudServerAdress + RedirectPort;
                    console.log("RedirectCount: " + RedirectCount + " url " + _url);
                    if (Logg) Logg("RedirectCount: " + RedirectCount + " url " + _url, 2);

                    RedirectCount++;


                    Connect(_url);
                } else Connect();
            }
            if (isWaitForAutoryzation != null) {
                clearTimeout(isWaitForAutoryzation);
                isWaitForAutoryzation = null;
            }
        }, 10000); // 5000);
    }

    //======================================
    var Info = {
        'RunCalStat': '',
        'RunStat': '',
        'calInfo': ''
    };
    this.GetInfo = function () {
        return Info;
    }


    function OnMessageGaze(evt) {
        if (!ConnectionOk) {
            if (evt.data.substring(0, 2) == "ws") {
                //console.log("redirect: " + evt.data);
                if (Logg) Logg("redirect: " + evt.data, 2);
                Connect(evt.data);
                return;
            }
            if (evt.data == "no free slots") {
                console.log("no free slots");
                WaitForSlot();
                //alert( evt.data   );
                ws.onclose = null;
                ws.close();
                return;
            }
            if (evt.data.substring(0, 2) == "ok")
                //if (evt.data == "ok")
            {
                GazeFlowSesionID = evt.data.substring(2);
                ConnectionOk = true;
                if (isWaitForAutoryzation != null) {
                    clearTimeout(isWaitForAutoryzation);
                    isWaitForAutoryzation = null;
                }
                ////
                //console.log("authorization ok");
                if (Logg) {
                    Logg("authorization ok", 2);
                    Logg("GazeFlowSesionID: " + GazeFlowSesionID, 2);
                }
                ws.send(sendScreensize()); // Send appKey
                InitCamSend();
                if (false) //tmp
                {
                    if (initializingid.style.display != 'none') initializingid.style.display = 'none';
                }
                return;
            }
        } // if(!ConnectionOk)
        ///////gaze data//////////
        {
            var received_msg = evt.data;
            if (evt.data.substring(2, 7) == "AckNr") {
                var ack = JSON.parse(evt.data);
                //  console.log(evt.data + " AckNr " + ack.AckNr);
                networkDelay = Date.now() - ack.time;
                if (networkDelay < minNetworkDelay) minNetworkDelay = networkDelay;
                if (networkDelay > maxNetworkDelay) maxNetworkDelay = networkDelay;
                if (networkDelay < 10 * minNetworkDelay) avrNetworkDelay = (avrNetworkDelay * ack.AckNr + networkDelay) / (ack.AckNr + 1);
                //console.log( " network delay " +networkDelay);
                CurFrameAckNr = ack.AckNr;
                CurFrameAckTime = ack.time;
                return;
            }
            if (evt.data.substring(0, 4) == "Demo") {
                console.log(evt.data);
                ShowDemoLimit();
                //alert( evt.data   );
                ws.onclose = null;
                if (false) ws.close();
                return;
            }
            ////////////Calibration complete//////////
            if (evt.data.substring(0, 4) == "Cal:") {

                Info.calInfo = evt.data;


                if (Logg) Logg("cal complete " + evt.data, 2);
                try {
                    document.getElementById("infoWaitForCalibration").style.display = "none";
                    try {
                        if (GazeCloudAPI.OnCalibrationComplete != null) GazeCloudAPI.OnCalibrationComplete();
                        if (true)
                            disableStyle('GazeCloudAPI.css', true);
                    } catch (e) {
                        ;
                    }
                } catch (e) {
                }
                ;
                bIsProcesingCalibration = false;
                bIsCalibrated = true;
                if (evt.data.substring(4, 6) == "ok") {
                    if (true) InitClickCalibration();
                    /////
                }
                if (evt.data.substring(4, 6) == "no") {


                    if (document.getElementById("InvalidCalibrationInfo") != null)
                        ShowErr(document.getElementById("InvalidCalibrationInfo").innerHTML);
                    else
                        ShowErr("Invalid Calibration!");


                }
                return;
            }
            ////////////end Calibration complete//////////
            try {
                if (_GazeData.state == -1) {
                    GoodFrameCount = 0;
                    BadFrameCount++;
                } else {
                    GoodFrameCount++;
                    BadFrameCount = 0;
                }
                _LastGazeData = Object.assign({}, _GazeData);
                var GazeData = JSON.parse(received_msg);
                var LastNr = _GazeData.FrameNr;
                _GazeData = GazeData;
                CurFrameReciveNr = GazeData.FrameNr;
                CurFrameReciveTime = GazeData.time;
                processkDelay = Date.now() - GazeData.time;
                var skipC = _GazeData.FrameNr - LastNr - 1;
                if (!isNaN(skipC))
                    if (skipC > 0)
                        skipProcessCount += skipC;
                // console.log("processkDelay" + processkDelay + " skipC " + skipC);
                PlotGazeData(GazeData);
                return;
            } catch (error) {
                console.error(error);
            }
        }
    }

    //========================
    function Disconect() {
        try {
            ConnectionOk = false;

            if (isWaitForAutoryzation != null) {

                try {
                    clearTimeout(isWaitForAutoryzation);
                    isWaitForAutoryzation = null;
                } catch (ee) {
                }

            }

            if (ws != null) {
                ws.onopen = null;
                ws.onerror = null;
                ws.onmessage = null;
                ws.onclose = null;
                try {
                    //if(false)
                    ProcessWebRecStream(true);
                    ws.send('exit');
                } catch (ee) {
                }
                ws.close();
                delete ws;
                ws = null;
            }
            // if (isWaitForAutoryzation != null) {

            //    clearTimeout(isWaitForAutoryzation);
            //    isWaitForAutoryzation = null;
            // }
            // if (Logg) Logg("Disconect", 2);
        } catch (error) {
        }
    }

    //------------------

    function _Connect(adress, port) {
        var url = GazeCloudServerAdress + GazeCloudServerPort;
        Connect(url);
    }

//--------------
    function Connect(_url = "") {
        try {


            if (_url == "") {
                GetCloudAdressWait();
                return;
            }


            bIsCalibrated = false;
            bIsRunCalibration = false;
            bIsProcesingCalibration = false;
            Disconect();

            try {
                if (GazeCloudAPI.OnInitializing != null)
                    GazeCloudAPI.OnInitializing();
            } catch (eee) {
            }

            ConnectCount++;
            if (ConnectCount > 4) {
                console.log("try connect count" + ConnectCount);
                //ShowErr("Can not connect to GazeFlow server!");
                GetCloudAdressReconnect();
                return;
            }
            AppKey = "AppKeyDemo";
            if (GazeCloudAPI.APIKey)
                AppKey = GazeCloudAPI.APIKey;
            ConnectionOk = false;
            if ("WebSocket" in window) {
                var port = GazeCloudServerPort;
                var url = GazeCloudServerAdress + port;
                if (_url == "") {
                    _url = GazeCloudServerAdress + GazeCloudServerPort; //"43334";
                    try {
                        vConnectHistory.push(_url);
                        ws = new WebSocket(_url);
                    } catch (ec) {
                        if (Logg) Logg(" connect exeption: " + ec.message, -2);
                    }
                    ;
                } else // reconect
                {
                    var _ws; //= new WebSocket(_url);
                    try {
                        vConnectHistory.push(_url);
                        _ws = new WebSocket(_url);
                    } catch (ecc) {
                        if (Logg) Logg(" reconnect exeption: " + ecc.message, -2);
                    }
                    ;
                    ws = _ws;
                } //else
                if (Logg) {
                    Logg("connecting: " + _url, 2);
                }
                //console.log("connecting: " + _url);
                //////////////////////////////////////////////////
                ws.onopen = function () {
                    //if (Logg)  Logg("Connected", -2);

                    //console.log("connected");
                    WaitForAutoryzation();
                    ws.send("AppKey:" + AppKey); // Send appKey
                } ///////////end open///////////////////
                ///////////////////////////////////////////////////
                ws.onerror = function (error) {
                    if (Logg) {
                        var myJSON = JSON.stringify(error);
                        Logg(ConnectCount + " ws.onerror  ConnectionOk: " + ConnectionOk, -2);
                    }
                    if (!ConnectionOk)
                        // if (ConnectCount < 4) {
                        if (ConnectCount < 3) {
                            var port = GazeCloudServerPort + ConnectCount
                            //if (ConnectCount == 3) port = 80; // port=443;// port = 80;
                            if (ConnectCount == 2) port = 443; // port = 80;
                            var _url = GazeCloudServerAdress + port;
                            console.log("ws.onerror  ConnectCount try again" + ConnectCount + "url " + _url);
                            Connect(_url);
                        } else {

                            GetCloudAdressReconnect();
                        }
                }
                ///////////////////////////////////////////////////
                ws.onmessage = OnMessageGaze;
                //////////////////////////////////
                ws.onclose = function (event) {
                    if (Logg) {
                        var myJSON = JSON.stringify(event);
                        Logg(" ws.onclose " + myJSON, -2);
                    }
                    if (bIsProcesingCalibration || bIsRunCalibration) {
                        AbortCalibration();
                        // ShowErr("Invalid Calibration");


                        if (document.getElementById("InvalidCalibrationInfo") != null)
                            ShowErr(document.getElementById("InvalidCalibrationInfo").innerHTML);
                        else
                            ShowErr("Invalid Calibration!");

                    } else ShowErr("GazeCloud server connection lost!");
                };
            } else {
                alert("WebSocket NOT supported by your Browser!");
                if (Logg) Logg("WebSocket NOT supported by your Browser", -2);
            }
            document.getElementById("initializingid").style.display = 'block'; //_gui
            GUIState = 'InitConnection';
        } catch (ee) {
            if (Logg) Logg(" Connect exeption " + JSON.stringify(ee), -2);
        }
    }

    //--------------------------------------
    var RetrayCount = 0;
    var RetrayCountNoSlot = 0;

    function WaitForSlot() {
        if (Logg) Logg("WaitForSlot", 2);
        GUIState = 'WaitForSlot';
        if (true) //
            initializingid.style.display = 'none';
        if (isWaitForAutoryzation != null) {
            clearTimeout(isWaitForAutoryzation);
            isWaitForAutoryzation = null;
        }
        document.getElementById("waitslotid").style.display = 'block';
        document.getElementById("waitslottimeid").innerHTML = "30";
        var start = Date.now();
        var _LoopSlotWait = setInterval(() => {
            var t = 30 - (Date.now() - start) / 1000.0;
            t = Math.round(t);
            document.getElementById("waitslottimeid").innerHTML = t;
            if (t < 0) {
                clearInterval(_LoopSlotWait);
                document.getElementById("waitslotid").style.display = 'none';
                Connect();
                RetrayCount++;
                RetrayCountNoSlot++;
            }
        }, 1000);
    }

    ////////////////end connection//////////////////////
    //======================
    /////////////Result//////////////////////
    function ScreenPixT(x, y, inv = false) {
        if (inv) {
            x = x - window.screenX;
            y = y - window.screenY; //-   ( window.outerHeight-window.innerHeight);
        } else {
            //  x: x *window.innerWidth  * window.devicePixelRatio +window.screenX ,
            //  y: y*window.innerHeight *window.devicePixelRatio +window.screenY +  ( window.outerHeight-window.innerHeight),
        }
    }

    /////////////////////////////////
    let GazeResultEvents = [];

    function GazeEvent() {
        this.docX = 0;
        this.docY = 0;
        this.time = 0;
        this.state = -1;
    }

    function GetGazeEvent(time) {
        var BestIx = 0;
        var BestDif = 99999999999999;
        var fLen = GazeResultEvents.length;
        if (fLen == 0) return null;
        if (LastGetGazeEvent == null) LastGetGazeEvent = GazeResultEvents[0];
        for (i = 0; i < fLen; i++) {
            var dif = Math.abs(GazeResultEvents[i].time - time);
            if (dif < BestDif) {
                BestDif = dif;
                BestIx = i;
            } else break;
        }
        if (BestDif > 200) return null;
        var out = GazeResultEvents[BestIx];
        LastGetGazeEvent = out;
        return out;
    }

    ////////////////////////////////
    var maxDelay = 0;
    var avrDelay = 33;
    var LastGetGazeEventIx = 0;
    var LastGetGazeEvent = null;

    function PlotGazeData(GazeData) {
        var delay = Date.now() - GazeData.time;
        var FrameCountDelay = CurFrameNr - CurFrameReciveNr;
        if (delay > maxDelay) maxDelay = delay;
        avrDelay = .99 * avrDelay + .01 * delay;
        //var x = GazeData.GazeX -window.screenX;
        //var y = GazeData.GazeY -window.screenY-   ( window.outerHeight-window.innerHeight);
        var x = GazeData.GazeX - window.screenX;
        var y = GazeData.GazeY - window.screenY - (window.outerHeight - window.innerHeight * window.devicePixelRatio / CalDeviceRation);
        x /= window.devicePixelRatio / CalDeviceRation;
        y /= window.devicePixelRatio / CalDeviceRation;
        //if(false)
        if (true) //boundary lim
        {
            var _m = 50;
            if (_m < window.innerWidth / 12.0) _m = window.innerWidth / 12.0;
            if (_m < window.innerHeight / 12.0) _m = window.innerHeight / 12.0
            var _h_ = (window.outerHeight - window.innerHeight);
            ;
            if (x < 0 && x > -_m) x = .2 * x //;x = 0;
            if (y < 0 && y > -_m) y = .2 * y; //y = 0;
            var _w = window.innerWidth;
            var _h = window.innerHeight;
            ;
            if (x > _w && x - _w < _m) x = .2 * x + .8 * _w; //  x = _w;
            if (y > _h && y - _h < _m)
                //y = _h;
                y = .2 * y + .8 * _h; //  x = _w;
        }
        if (true) {
            var scrollY = Math.max(document.body.scrollTop, window.scrollY)
            var scrollX = Math.max(document.body.scrollLeft, window.scrollX)
            x += scrollX; //document.body.scrollTop;
            y += scrollY; //document.body.scrollTop;
        }
        if (true) {
            GazeData.Xview = x / window.innerWidth;
            GazeData.Yview = y / window.innerHeight
            GazeData.docX = x;
            GazeData.docY = y;
        }
        if (GazeCloudAPI.OnResult != null) {
            var outGazeData = GazeData;
            outGazeData.docX = x;
            outGazeData.docY = y;
            GazeCloudAPI.OnResult(outGazeData);
        }
        var Gazeevent = new GazeEvent();
        Gazeevent.docX = Math.round(x);
        Gazeevent.docY = Math.round(y);
        Gazeevent.time = GazeData.time;
        Gazeevent.state = GazeData.state;
        GazeResultEvents.push(Gazeevent);
        if (true) {
            var t = Date.now();
            var webevent = {
                type: 20,
                data: Gazeevent,
                timestamp: t
            };
            eventsWebRec.push(webevent);
            try {
                if (GazeCloudAPI.OnGazeEvent != null) {
                    GazeCloudAPI.OnGazeEvent(webevent);
                }
            } catch (e) {
            }
            /* */
        }
        ///////////////////HeatMapLive//////////////
        if (typeof heatmap !== 'undefined')
            if (heatmap != null)
                if (!bIsRunCalibration && !bIsProcesingCalibration && bIsCalibrated) {
                    if (GazeData.state == 0) {
                        var Precision = 1; //5;
                        var _x = Math.round(x / Precision) * Precision + (.5 * Precision - .5);
                        var _y = Math.round(y / Precision) * Precision + (.5 * Precision - .5);
                        _x = Math.round(_x);
                        _y = Math.round(_y);
                        var timedif = _GazeData.time - _LastGazeData.time;
                        // console.log("timedif " + timedif);
                        var v = timedif / 33;
                        if (v > 5) v = 5;
                        try {
                            //AddHeatMapDataWin(_x, _y, v, 0, 0);
                            //if (false)
                            heatmap.addData({
                                x: _x,
                                y: _y,
                                value: v
                            });
                        } catch (e) {
                        }
                    }
                }
        ///////////////////end HeatMapLive//////////////
        UpdateGUI(GazeData);
    }

    /////////////////////////////////
    ///////////////////Gui//////////////////////
    var GUIState = 'none';
    var ButtonCalibrate = document.getElementById("_ButtonCalibrateId");
    //var facemaskimg = document.getElementById("facemaskimg");
    var facemaskimgOk = document.getElementById("facemaskimgok");
    var facemaskimgNo = document.getElementById("facemaskimgno");
    var showinit = document.getElementById("showinit");
    var camid = document.getElementById("camid");
    var loadid = document.getElementById("loadid");
    var initializingid = document.getElementById("initializingid");
    var DocmentLoaded = false;
    var CalDivId = document.getElementById("CalDivId");
    var infoWaitForCalibration = document.getElementById("infoWaitForCalibration");
    var waitslotid = document.getElementById("waitslotid");
    var errid = document.getElementById("errid");
    var demoid = document.getElementById("demoid");
    var CamAccessid = document.getElementById("CamAccessid");
    var GazeFlowContainer = document.getElementById("GazeFlowContainer");
    var corectpositionid = document.getElementById("corectpositionid");
    var GUIInitialized = false;
    var disableStyle = function (styleName, disabled) {
        return;
        try {
            var styles = document.styleSheets;
            var href = "";
            for (var i = 0; i < styles.length; i++) {
                href = styles[i].href.split("/");
                href = href[href.length - 1];
                if (href === styleName) {
                    styles[i].disabled = disabled;
                    break;
                }
            }
        } catch (e) {
        }
    };
    if (true) //load style
    {
        try {
            var style = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"> <link rel="stylesheet" href="https://api.gazerecorder.com/GazeCloudAPI.css" >';
            document.getElementsByTagName('head')[0].insertAdjacentHTML('afterbegin', style);
            //disableStyle('GazeCloudAPI.css',true);
        } catch (e) {
        }
    }

    function InitGUI() {

        if (document.getElementById("GazeCloudGUIid") != null) {
            document.getElementById("GazeCloudGUIid").style.display = 'block';

            GUIInitialized = true;
        }


        if (!GUIInitialized) {
            //var style = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"> <link rel="stylesheet" href="https://api.gazerecorder.com/GazeCloudAPI.css" >';
            //document.getElementsByTagName('head')[0].insertAdjacentHTML('afterbegin', style);
            document.body.insertAdjacentHTML('afterbegin', _GuiHtml);
        }
        try {
            disableStyle('GazeCloudAPI.css', false);
        } catch (e) {
        }
        GUIInitialized = true;
        ////////init gui/////
        DocmentLoaded = true;
        video = document.querySelector('video');
        ButtonCalibrate = document.getElementById("_ButtonCalibrateId");
        //facemaskimg = document.getElementById("facemaskimg");
        facemaskimgOk = document.getElementById("facemaskimgok");
        facemaskimgNo = document.getElementById("facemaskimgno");
        corectpositionid = document.getElementById("corectpositionid");
        showinit = document.getElementById("showinit");
        camid = document.getElementById("camid");
        loadid = document.getElementById("loadid");
        initializingid = document.getElementById("initializingid");
        infoWaitForCalibration = document.getElementById("infoWaitForCalibration");
        waitslotid = document.getElementById("waitslotid");
        errid = document.getElementById("errid");
        demoid = document.getElementById("demoid");
        CamAccessid = document.getElementById("CamAccessid");
        CalDivId = document.getElementById("CalDivId");
        GazeFlowContainer = document.getElementById("GazeFlowContainer");
        ////////end init gui/////
        showinit.style.display = 'block';
        GazeFlowContainer.style.display = 'block';
        if (true) // init gui
        {
            camid.style.marginLeft = -camid.scrollWidth / 2;
            if (true) {
                // facemaskimg.width =  video.width;
                // facemaskimg.height = video.height ;
                facemaskimgOk.width = video.width;
                facemaskimgOk.height = video.height;
                facemaskimgNo.width = video.width;
                facemaskimgNo.height = video.height;
            }

        }
        InitCalibration();


        if (false)
            if (true) //tmp
                setTimeout(function () {
                    LatTrackingLostShow = false;
                }, 5000);

    }

    //--------------------------------------
    var TrackingLostShow = true;
    var LatTrackingLostShow = true;

    function UpdateGUI(GazeData) {
        // 0 init
        // 1 calirate
        // 2 calibrate lost
        // 3 tracking
        // 4 racking lost
        // 5 procesing
        try {
            var GuiState = 0;
            //////////////////
            // if(true)//
            //if(false)
            {
                if (CurFrameReciveNr > 2)
                    // if( CurFrameReciveNr > 0)
                {
                    if (initializingid.style.display != 'none') {
                        initializingid.style.display = 'none';
                        if (Logg) Logg("Initialized ", 2);
                    }
                } else return;
            }
            ////////////////
            var showInit = false;
            showInit = (!bIsCalibrated && !bIsProcesingCalibration && !bIsRunCalibration);
            var delayC = 5;
            if (TrackingLostShow) {
                if (GoodFrameCount > delayC) TrackingLostShow = false;
            } else {
                if (BadFrameCount > delayC) TrackingLostShow = true;
            }
            var display = 'none';
            if (TrackingLostShow || (!bIsCalibrated && !bIsProcesingCalibration && !bIsRunCalibration)) display = 'block';
            else display = 'none';
            if (bIsProcesingCalibration) display = 'none';
            if (false) //tmp
                if (display != camid.style.display) {
                    camid.style.display = display;
                    if (true) //tmp
                        RePlayVideo();
                }
            ///
            var bHideVideo = false;
            if (display == 'none') {
                bHideVideo = true;
                camid.style.display = 'block';
            }
            ///
            var f = 1.0;
            var _w;
            var _h;
            if (false) {
                if (camid.style.display == 'none') {
                    _w = 320; // video.videoWidth;//video.height  *  video.videoWidth / video.videoHeight ;
                    _h = 240; //video.videoHeight;// 240;
                } else {
                    if (bIsCalibrated || bIsRunCalibration) {
                        if (video.videoHeight > video.videoWidth) {
                            _h = 200;
                            _w = _h * video.videoWidth / video.videoHeight;
                        } else {
                            _w = 200; //200;
                            _h = _w * video.videoHeight / video.videoWidth;
                        }
                    } else {
                        _w = 320;
                        _h = 240;
                    }
                }
            }
            if (true) {
                if (bHideVideo) {
                    _w = 1;
                    _h = 1;
                    //_w = 320/10;
                    //_h = 240/10;
                } else {
                    _w = 320;
                    _h = 240;
                }
            }
            if (video.width != _w || video.height != _h) {
                //if(false) // na ios frozen przy zmianie !!!!
                {
                    video.width = _w;
                    video.height = _h;
                }
                facemaskimgOk.width = video.width;
                facemaskimgOk.height = video.height;
                facemaskimgNo.width = video.width;
                facemaskimgNo.height = video.height;
                if (true) RePlayVideo();
            }
            if (LatTrackingLostShow != TrackingLostShow || CurFrameNr < 200) {
                // if (Logg) Logg("Face : " + TrackingLostShow, 2);
                if (!TrackingLostShow) {
                    facemaskimgOk.style.display = "block";
                    facemaskimgNo.style.display = "none";
                } else {
                    facemaskimgOk.style.display = "none";
                    facemaskimgNo.style.display = "block";
                }
                if (ButtonCalibrate.disabled != TrackingLostShow) ButtonCalibrate.disabled = TrackingLostShow;
                if (display) {
                    var d = null;
                    if (TrackingLostShow) d = 'block';
                    else d = 'none';
                    if (corectpositionid.style.display != d) corectpositionid.style.display = d;
                }
            }
            var dd = null;
            if (showinit.style.display != 'none') dd = "block";
            else dd = "none";
            if (GazeFlowContainer.style.display != dd) GazeFlowContainer.style.display = dd;
            LatTrackingLostShow = TrackingLostShow;
        } catch (e) {
            console.log("update gui exeption ");
        }
    } //-----------------------------------
    function ShowDemoLimit() {
        if (Logg) Logg("DemoLimit", 2);
        GUIState = 'DemoLimit';
        document.getElementById("demoid").style.display = "block";
        setTimeout(StopGazeFlow, 1000);
        //CloseWebCam();


        try {
            if (GazeCloudAPI.OnDemoLimit != null)
                GazeCloudAPI.OnDemoLimit();
        } catch (ee) {
        }


    }

    //--------------------------------------
    function ShowErr(txt) {
        if (document.getElementById("errid").style.display != "none") return;
        CloseWebCam();
        if (Logg) Logg("ShowErr:" + txt, 2);
        GUIState = 'Err';
        document.getElementById("errid").style.display = "block";
        //if(document.getElementById("errid").style.display == "none")// second err
        document.getElementById("errmsgid").innerHTML = txt;
        UpdateGUI(_GazeData);
        if (GazeCloudAPI.OnError != null)
            GazeCloudAPI.OnError(txt);
    }

    ////////////////////end Gui////////////////
    this.get_browser_info = get_browser_info;

    function get_browser_info() {
        var ua = navigator.userAgent,
            tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return {
                name: 'IE ',
                version: (tem[1] || '')
            };
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\bOPR\/(\d+)/)
            if (tem != null) {
                return {
                    name: 'Opera',
                    version: tem[1]
                };
            }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) {
            M.splice(1, 1, tem[1]);
        }
        return {
            name: M[0],
            version: M[1]
        };
    }

    function sendScreensize() {
        try {
            var aa = document.getElementById('dpimm');
            //var mm_x = 10.0 * document.getElementById('dpimm').offsetWidth;
            //var mm_y = 10.0 * document.getElementById('dpimm').offsetHeight;
            var mm_x = document.getElementById('dpimm').offsetWidth;
            var mm_y = document.getElementById('dpimm').offsetHeight;
            //var mm_x = 10.0 * document.getElementById('dpimm').width;
            //var mm_y = 10.0 * document.getElementById('dpimm').height;
            if (false) {
                var wmm = window.screen.width / mm_x / window.devicePixelRatio;
                var hmm = window.screen.height / mm_y / window.devicePixelRatio;
                var w = window.screen.width * window.devicePixelRatio;
                var h = window.screen.height * window.devicePixelRatio;
                var wmm = window.screen.width / mm_x;
                var hmm = window.screen.height / mm_y;
                var w = window.screen.width;
                var h = window.screen.height;
            }
            var wmm = window.screen.width / mm_x; /// window.devicePixelRatio ;
            var hmm = window.screen.height / mm_y; /// window.devicePixelRatio ;
            var w = window.screen.width; //* window.devicePixelRatio;
            var h = window.screen.height; //* window.devicePixelRatio;
            if (true) {
                wmm /= CalDeviceRation;
                hmm /= CalDeviceRation;
            }
            //var r =  {'wmm':wmm , 'hmm': hmm , 'wpx':w , 'hpx':h , 'ratio' : window.devicePixelRatio};
            var orientation = window.orientation;
            var isMobile = window.orientation > -1;
            if (typeof window.orientation === 'undefined') orientation = 10;
            var info = get_browser_info();
            info.platform = navigator.platform;
            info.userAgent = navigator.userAgent;
            info.Media = MediaInfo;
            //var r =  {'wmm':wmm , 'hmm': hmm , 'wpx':w , 'hpx':h , 'ratio' : window.devicePixelRatio, orientation: orientation, winx: window.screenX, winy: window.screenY,   aW: screen.availWidth , aH: screen.availHeight ,info: info };
            // var r =  {'wmm':wmm , 'hmm': hmm , 'wpx':w , 'hpx':h , 'ratio' : window.devicePixelRatio, orientation: orientation, winx: window.screenX, winy: window.screenY,   aW: screen.availWidth , aH: screen.availHeight ,'innerWidth':window.innerWidth , 'outerWidth':window.outerWidth,  'innerHeight':window.innerHeight , 'outerHeight':window.outerHeight,"mm_x": mm_x, "mm_y":mm_y, "CalDeviceRation":CalDeviceRation,info: info };
            //var r =  {'wmm':wmm , 'hmm': hmm , 'wpx':w , 'hpx':h , 'ratio' : window.devicePixelRatio, orientation: orientation, winx: window.screenX, winy: window.screenY,   aW: screen.availWidth , aH: screen.availHeight ,'innerWidth':window.innerWidth , 'outerWidth':window.outerWidth,  'innerHeight':window.innerHeight , 'outerHeight':window.outerHeight,"mm_x": mm_x, "mm_y":mm_y, "CalDeviceRation":CalDeviceRation,   'camw':videoOrginal.videoWidth , 'camh': videoOrginal.videoHeight ,info: info };
            var r = {
                'wmm': wmm,
                'hmm': hmm,
                'wpx': w,
                'hpx': h,
                'ratio': window.devicePixelRatio,
                orientation: orientation,
                winx: window.screenX,
                winy: window.screenY,
                aW: screen.availWidth,
                aH: screen.availHeight,
                'innerWidth': window.innerWidth,
                'outerWidth': window.outerWidth,
                'innerHeight': window.innerHeight,
                'outerHeight': window.outerHeight,
                "mm_x": mm_x,
                "mm_y": mm_y,
                "CalDeviceRation": CalDeviceRation,
                'camw': video.videoWidth,
                'camh': video.videoHeight,
                info: info
            };
            // var mm_x = document.getElementById('dpimm').offsetWidth;
            //var mm_y =  document.getElementById('dpimm').offsetHeight;
            var myJSON = JSON.stringify(r);
            if (false) alert("screen s" + myJSON);
            return myJSON;
        } catch (e) {
            console.log("sendScreensize exeption ");
        }
    }

    ////////////////////////////////////////
    function openFullscreen(callback) {
        // return;
        try {
            var elem = document.body;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().then(callback);
            } else if (elem.mozRequestFullScreen) {
                /* Firefox */
                elem.mozRequestFullScreen().then(callback);
                ;
            } else if (elem.webkitRequestFullscreen) {
                /* Chrome, Safari and Opera */
                elem.webkitRequestFullscreen().then(callback);
                ;
            } else if (elem.msRequestFullscreen) {
                /* IE/Edge */
                elem.msRequestFullscreen().then(callback);
                ;
                if (false)
                    if (callback) callback();
            }
        } catch (ee) {
            if (callback) callback();
        }
    }

    /* Close fullscreen */
    function closeFullscreen() {
        return;
        if (false) {
            var isMobile = window.orientation > -1;
            if (isMobile) {
                return;
            }
        }
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                /* Firefox */
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                /* Chrome, Safari and Opera */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                /* IE/Edge */
                document.msExitFullscreen();
            }
        } catch (error) {
            ;
        }
    }

    ////////////////////////////////////////
    /////////////////////API/////////////////////////
    function ResetIntervals() {
        try {
            if (isWaitForAutoryzation != null) {
                clearTimeout(isWaitForAutoryzation);
                isWaitForAutoryzation = null;
            }
            if (_LoopSlotWait != null) {
                clearInterval(_LoopSlotWait);
                _LoopSlotWait = null;
            }


            ResetGetCloudAdressReconnect();

        } catch (e) {
        }
    }

    //--------------------
    var bStarted = false;

    function StartGazeFlow() {
        RestlzwStream();
        if (bStarted)
            return;
        if (bStarted) CloseWebCam();
        bStarted = true;
        InitGUI();
        if (true) {
            ResetIntervals();
            document.getElementById("waitslotid").style.display = 'none';
            document.getElementById("infoWaitForCalibration").style.display = "none";
            document.getElementById("errid").style.display = "none";
            document.getElementById("errmsgid").innerHTML = "";
            camid.style = ' z-index: 1000;position:absolute; left:50%; top:2%  ; margin-left: -160px; ';
            camid.style.marginLeft = -camid.scrollWidth / 2;
        }
        GazeResultEvents = [];
        try {
            if (typeof GetCloudAdresInfo !== 'undefined')
                if (GetCloudAdresInfo != null) {
                    if (typeof GetCloudAdresInfo.err !== 'undefined')
                        if (GetCloudAdresInfo.err != null)
                            if (GetCloudAdresInfo.err != "") {
                                ShowErr(GetCloudAdresInfo.err);
                                return;
                            }
                }
        } catch (eee) {
        }
        OpenWebCam();
        //if(false ) /// connect after camera allow acess
        //  Connect();
        if (Logg) Logg("StartGazeFlow", 2);
    }

    //----------------------------------
    function StopGazeFlow() {
        try {
            SendStat();

            Info.RunStat = GetStat();

            CloseWebCam();
            HideGUI();
            if (Logg) Logg("StopGazeFlow", 2);
            bStarted = false;
        } catch (error) {
            ;
        }
    }

    //----------------------------------
    window.addEventListener("beforeunload", function (e) {
        //CloseWebCam();

        if (!GazeCloudAPI.beforeunloadNoCloseWs)
            GazeCloudAPI.StopEyeTracking();

        if (false)
            setTimeout(function () {
                GazeCloudAPI.StopEyeTracking();
            }, 1);


    }, false);

    function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }

    //---------------------------------------
    function callbackCheckiFrame(htm) {
        var out = htm;
        if (out != '200') {
            //alert('chek iframe: ' + out);
        } else {
            _opencontenet('d');
        }
    }

    //---------------------------------------
    ////////////log///////////////////
    function uuidv4() {
        return 'API:' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var LogSesionID = uuidv4();
    if (true) {
        var info = get_browser_info();
        info.platform = navigator.platform;
        info.userAgent = navigator.userAgent;
        info.Media = MediaInfo;
        var myJSON = JSON.stringify(info);
        Logg(myJSON, type = -1);
    }


    var LogTxt = '';

    function Logg(txt, type = 0) {

        LogTxt += txt + ' | ';
    }


    function LoggSend() {

        if (LogTxt == '')
            return;
        txt = LogTxt;
        LogTxt = '';
        try {
            let req = new XMLHttpRequest();
            let formData = new FormData();
            req.withCredentials = false;
            //formData.append("RecordinSesionId", RecordinSesionId);
            formData.append("RecordinSesionId", LogSesionID);
            formData.append("log", txt);
            formData.append("type", type);
            formData.append("sesionid", LogSesionID);
            req.open("POST", 'https://logs.gazerecorder.com/Logs.php');
            req.send(formData);
        } catch (e) {
        }
    }


    window.addEventListener('beforeunload', function (event) {
        LoggSend();
    });


    if (true) window.addEventListener('DOMContentLoaded', function (event) {
        if (Logg) Logg("GazeCloundAPI v:1.5.0 ", 2);
    });

    this.SendLog = function (txt, type = 0) {
        Logg(txt, type);
    }

} //end GazeCloudAPIInit
/////////Version 1.0.0///////////
var StartGazeFlow = GazeCloudAPI.StartEyeTracking;
var StopGazeFlow = GazeCloudAPI.StopEyeTracking;
var SetLowFps = GazeCloudAPI.SetLowFps;
var get_browser_info = GazeCloudAPI.get_browser_info;
var MediaInfo = "";
//var video = null;
/*

//////Callback//////

var OnResult = null;

var OnCalibrationComplete = null;

var OnCalibrationFail = null;

var OnStopGazeFlow = null;

var OnCamDenied = null;

//////Callback//////

*/
function InitOldAPI() {
    try {
        if (typeof OnResult !== 'undefined') GazeCloudAPI.OnResult = OnResult;
        if (typeof OnCalibrationComplete !== 'undefined') GazeCloudAPI.OnCalibrationComplete = OnCalibrationComplete;
        if (typeof OnCalibrationFail !== 'undefined') GazeCloudAPI.OnCalibrationFail = OnCalibrationFail;
        if (typeof OnStopGazeFlow !== 'undefined') GazeCloudAPI.OnStopGazeFlow = OnStopGazeFlow;
        if (typeof OnCamDenied !== 'undefined') GazeCloudAPI.OnCamDenied = OnCamDenied;
        if (typeof OnError !== 'undefined') GazeCloudAPI.OnError = OnError;
    } catch (e) {
    }
}

var processClick = GazeCloudAPI.processClick;
/////////end Version 1.0.0////////////*! jQuery v3.4.1 | (c) JS Foundation and other contributors | jquery.org/license */
!function (e, t) {
    "use strict";
    "object" == typeof module && "object" == typeof module.exports ? module.exports = e.document ? t(e, !0) : function (e) {
        if (!e.document) throw new Error("jQuery requires a window with a document");
        return t(e)
    } : t(e)
}("undefined" != typeof window ? window : this, function (C, e) {
    "use strict";
    var t = [], E = C.document, r = Object.getPrototypeOf, s = t.slice, g = t.concat, u = t.push, i = t.indexOf, n = {},
        o = n.toString, v = n.hasOwnProperty, a = v.toString, l = a.call(Object), y = {}, m = function (e) {
            return "function" == typeof e && "number" != typeof e.nodeType
        }, x = function (e) {
            return null != e && e === e.window
        }, c = {type: !0, src: !0, nonce: !0, noModule: !0};

    function b(e, t, n) {
        var r, i, o = (n = n || E).createElement("script");
        if (o.text = e, t) for (r in c) (i = t[r] || t.getAttribute && t.getAttribute(r)) && o.setAttribute(r, i);
        n.head.appendChild(o).parentNode.removeChild(o)
    }

    function w(e) {
        return null == e ? e + "" : "object" == typeof e || "function" == typeof e ? n[o.call(e)] || "object" : typeof e
    }

    var f = "3.4.1", k = function (e, t) {
        return new k.fn.init(e, t)
    }, p = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

    function d(e) {
        var t = !!e && "length" in e && e.length, n = w(e);
        return !m(e) && !x(e) && ("array" === n || 0 === t || "number" == typeof t && 0 < t && t - 1 in e)
    }

    k.fn = k.prototype = {
        jquery: f, constructor: k, length: 0, toArray: function () {
            return s.call(this)
        }, get: function (e) {
            return null == e ? s.call(this) : e < 0 ? this[e + this.length] : this[e]
        }, pushStack: function (e) {
            var t = k.merge(this.constructor(), e);
            return t.prevObject = this, t
        }, each: function (e) {
            return k.each(this, e)
        }, map: function (n) {
            return this.pushStack(k.map(this, function (e, t) {
                return n.call(e, t, e)
            }))
        }, slice: function () {
            return this.pushStack(s.apply(this, arguments))
        }, first: function () {
            return this.eq(0)
        }, last: function () {
            return this.eq(-1)
        }, eq: function (e) {
            var t = this.length, n = +e + (e < 0 ? t : 0);
            return this.pushStack(0 <= n && n < t ? [this[n]] : [])
        }, end: function () {
            return this.prevObject || this.constructor()
        }, push: u, sort: t.sort, splice: t.splice
    }, k.extend = k.fn.extend = function () {
        var e, t, n, r, i, o, a = arguments[0] || {}, s = 1, u = arguments.length, l = !1;
        for ("boolean" == typeof a && (l = a, a = arguments[s] || {}, s++), "object" == typeof a || m(a) || (a = {}), s === u && (a = this, s--); s < u; s++) if (null != (e = arguments[s])) for (t in e) r = e[t], "__proto__" !== t && a !== r && (l && r && (k.isPlainObject(r) || (i = Array.isArray(r))) ? (n = a[t], o = i && !Array.isArray(n) ? [] : i || k.isPlainObject(n) ? n : {}, i = !1, a[t] = k.extend(l, o, r)) : void 0 !== r && (a[t] = r));
        return a
    }, k.extend({
        expando: "jQuery" + (f + Math.random()).replace(/\D/g, ""), isReady: !0, error: function (e) {
            throw new Error(e)
        }, noop: function () {
        }, isPlainObject: function (e) {
            var t, n;
            return !(!e || "[object Object]" !== o.call(e)) && (!(t = r(e)) || "function" == typeof (n = v.call(t, "constructor") && t.constructor) && a.call(n) === l)
        }, isEmptyObject: function (e) {
            var t;
            for (t in e) return !1;
            return !0
        }, globalEval: function (e, t) {
            b(e, {nonce: t && t.nonce})
        }, each: function (e, t) {
            var n, r = 0;
            if (d(e)) {
                for (n = e.length; r < n; r++) if (!1 === t.call(e[r], r, e[r])) break
            } else for (r in e) if (!1 === t.call(e[r], r, e[r])) break;
            return e
        }, trim: function (e) {
            return null == e ? "" : (e + "").replace(p, "")
        }, makeArray: function (e, t) {
            var n = t || [];
            return null != e && (d(Object(e)) ? k.merge(n, "string" == typeof e ? [e] : e) : u.call(n, e)), n
        }, inArray: function (e, t, n) {
            return null == t ? -1 : i.call(t, e, n)
        }, merge: function (e, t) {
            for (var n = +t.length, r = 0, i = e.length; r < n; r++) e[i++] = t[r];
            return e.length = i, e
        }, grep: function (e, t, n) {
            for (var r = [], i = 0, o = e.length, a = !n; i < o; i++) !t(e[i], i) !== a && r.push(e[i]);
            return r
        }, map: function (e, t, n) {
            var r, i, o = 0, a = [];
            if (d(e)) for (r = e.length; o < r; o++) null != (i = t(e[o], o, n)) && a.push(i); else for (o in e) null != (i = t(e[o], o, n)) && a.push(i);
            return g.apply([], a)
        }, guid: 1, support: y
    }), "function" == typeof Symbol && (k.fn[Symbol.iterator] = t[Symbol.iterator]), k.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (e, t) {
        n["[object " + t + "]"] = t.toLowerCase()
    });
    var h = function (n) {
        var e, d, b, o, i, h, f, g, w, u, l, T, C, a, E, v, s, c, y, k = "sizzle" + 1 * new Date, m = n.document, S = 0,
            r = 0, p = ue(), x = ue(), N = ue(), A = ue(), D = function (e, t) {
                return e === t && (l = !0), 0
            }, j = {}.hasOwnProperty, t = [], q = t.pop, L = t.push, H = t.push, O = t.slice, P = function (e, t) {
                for (var n = 0, r = e.length; n < r; n++) if (e[n] === t) return n;
                return -1
            },
            R = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
            M = "[\\x20\\t\\r\\n\\f]", I = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
            W = "\\[" + M + "*(" + I + ")(?:" + M + "*([*^$|!~]?=)" + M + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + I + "))|)" + M + "*\\]",
            $ = ":(" + I + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + W + ")*)|.*)\\)|)",
            F = new RegExp(M + "+", "g"), B = new RegExp("^" + M + "+|((?:^|[^\\\\])(?:\\\\.)*)" + M + "+$", "g"),
            _ = new RegExp("^" + M + "*," + M + "*"), z = new RegExp("^" + M + "*([>+~]|" + M + ")" + M + "*"),
            U = new RegExp(M + "|>"), X = new RegExp($), V = new RegExp("^" + I + "$"), G = {
                ID: new RegExp("^#(" + I + ")"),
                CLASS: new RegExp("^\\.(" + I + ")"),
                TAG: new RegExp("^(" + I + "|[*])"),
                ATTR: new RegExp("^" + W),
                PSEUDO: new RegExp("^" + $),
                CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + M + "*(even|odd|(([+-]|)(\\d*)n|)" + M + "*(?:([+-]|)" + M + "*(\\d+)|))" + M + "*\\)|)", "i"),
                bool: new RegExp("^(?:" + R + ")$", "i"),
                needsContext: new RegExp("^" + M + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + M + "*((?:-\\d)?\\d*)" + M + "*\\)|)(?=[^-]|$)", "i")
            }, Y = /HTML$/i, Q = /^(?:input|select|textarea|button)$/i, J = /^h\d$/i, K = /^[^{]+\{\s*\[native \w/,
            Z = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, ee = /[+~]/,
            te = new RegExp("\\\\([\\da-f]{1,6}" + M + "?|(" + M + ")|.)", "ig"), ne = function (e, t, n) {
                var r = "0x" + t - 65536;
                return r != r || n ? t : r < 0 ? String.fromCharCode(r + 65536) : String.fromCharCode(r >> 10 | 55296, 1023 & r | 56320)
            }, re = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g, ie = function (e, t) {
                return t ? "\0" === e ? "\ufffd" : e.slice(0, -1) + "\\" + e.charCodeAt(e.length - 1).toString(16) + " " : "\\" + e
            }, oe = function () {
                T()
            }, ae = be(function (e) {
                return !0 === e.disabled && "fieldset" === e.nodeName.toLowerCase()
            }, {dir: "parentNode", next: "legend"});
        try {
            H.apply(t = O.call(m.childNodes), m.childNodes), t[m.childNodes.length].nodeType
        } catch (e) {
            H = {
                apply: t.length ? function (e, t) {
                    L.apply(e, O.call(t))
                } : function (e, t) {
                    var n = e.length, r = 0;
                    while (e[n++] = t[r++]) ;
                    e.length = n - 1
                }
            }
        }

        function se(t, e, n, r) {
            var i, o, a, s, u, l, c, f = e && e.ownerDocument, p = e ? e.nodeType : 9;
            if (n = n || [], "string" != typeof t || !t || 1 !== p && 9 !== p && 11 !== p) return n;
            if (!r && ((e ? e.ownerDocument || e : m) !== C && T(e), e = e || C, E)) {
                if (11 !== p && (u = Z.exec(t))) if (i = u[1]) {
                    if (9 === p) {
                        if (!(a = e.getElementById(i))) return n;
                        if (a.id === i) return n.push(a), n
                    } else if (f && (a = f.getElementById(i)) && y(e, a) && a.id === i) return n.push(a), n
                } else {
                    if (u[2]) return H.apply(n, e.getElementsByTagName(t)), n;
                    if ((i = u[3]) && d.getElementsByClassName && e.getElementsByClassName) return H.apply(n, e.getElementsByClassName(i)), n
                }
                if (d.qsa && !A[t + " "] && (!v || !v.test(t)) && (1 !== p || "object" !== e.nodeName.toLowerCase())) {
                    if (c = t, f = e, 1 === p && U.test(t)) {
                        (s = e.getAttribute("id")) ? s = s.replace(re, ie) : e.setAttribute("id", s = k), o = (l = h(t)).length;
                        while (o--) l[o] = "#" + s + " " + xe(l[o]);
                        c = l.join(","), f = ee.test(t) && ye(e.parentNode) || e
                    }
                    try {
                        return H.apply(n, f.querySelectorAll(c)), n
                    } catch (e) {
                        A(t, !0)
                    } finally {
                        s === k && e.removeAttribute("id")
                    }
                }
            }
            return g(t.replace(B, "$1"), e, n, r)
        }

        function ue() {
            var r = [];
            return function e(t, n) {
                return r.push(t + " ") > b.cacheLength && delete e[r.shift()], e[t + " "] = n
            }
        }

        function le(e) {
            return e[k] = !0, e
        }

        function ce(e) {
            var t = C.createElement("fieldset");
            try {
                return !!e(t)
            } catch (e) {
                return !1
            } finally {
                t.parentNode && t.parentNode.removeChild(t), t = null
            }
        }

        function fe(e, t) {
            var n = e.split("|"), r = n.length;
            while (r--) b.attrHandle[n[r]] = t
        }

        function pe(e, t) {
            var n = t && e, r = n && 1 === e.nodeType && 1 === t.nodeType && e.sourceIndex - t.sourceIndex;
            if (r) return r;
            if (n) while (n = n.nextSibling) if (n === t) return -1;
            return e ? 1 : -1
        }

        function de(t) {
            return function (e) {
                return "input" === e.nodeName.toLowerCase() && e.type === t
            }
        }

        function he(n) {
            return function (e) {
                var t = e.nodeName.toLowerCase();
                return ("input" === t || "button" === t) && e.type === n
            }
        }

        function ge(t) {
            return function (e) {
                return "form" in e ? e.parentNode && !1 === e.disabled ? "label" in e ? "label" in e.parentNode ? e.parentNode.disabled === t : e.disabled === t : e.isDisabled === t || e.isDisabled !== !t && ae(e) === t : e.disabled === t : "label" in e && e.disabled === t
            }
        }

        function ve(a) {
            return le(function (o) {
                return o = +o, le(function (e, t) {
                    var n, r = a([], e.length, o), i = r.length;
                    while (i--) e[n = r[i]] && (e[n] = !(t[n] = e[n]))
                })
            })
        }

        function ye(e) {
            return e && "undefined" != typeof e.getElementsByTagName && e
        }

        for (e in d = se.support = {}, i = se.isXML = function (e) {
            var t = e.namespaceURI, n = (e.ownerDocument || e).documentElement;
            return !Y.test(t || n && n.nodeName || "HTML")
        }, T = se.setDocument = function (e) {
            var t, n, r = e ? e.ownerDocument || e : m;
            return r !== C && 9 === r.nodeType && r.documentElement && (a = (C = r).documentElement, E = !i(C), m !== C && (n = C.defaultView) && n.top !== n && (n.addEventListener ? n.addEventListener("unload", oe, !1) : n.attachEvent && n.attachEvent("onunload", oe)), d.attributes = ce(function (e) {
                return e.className = "i", !e.getAttribute("className")
            }), d.getElementsByTagName = ce(function (e) {
                return e.appendChild(C.createComment("")), !e.getElementsByTagName("*").length
            }), d.getElementsByClassName = K.test(C.getElementsByClassName), d.getById = ce(function (e) {
                return a.appendChild(e).id = k, !C.getElementsByName || !C.getElementsByName(k).length
            }), d.getById ? (b.filter.ID = function (e) {
                var t = e.replace(te, ne);
                return function (e) {
                    return e.getAttribute("id") === t
                }
            }, b.find.ID = function (e, t) {
                if ("undefined" != typeof t.getElementById && E) {
                    var n = t.getElementById(e);
                    return n ? [n] : []
                }
            }) : (b.filter.ID = function (e) {
                var n = e.replace(te, ne);
                return function (e) {
                    var t = "undefined" != typeof e.getAttributeNode && e.getAttributeNode("id");
                    return t && t.value === n
                }
            }, b.find.ID = function (e, t) {
                if ("undefined" != typeof t.getElementById && E) {
                    var n, r, i, o = t.getElementById(e);
                    if (o) {
                        if ((n = o.getAttributeNode("id")) && n.value === e) return [o];
                        i = t.getElementsByName(e), r = 0;
                        while (o = i[r++]) if ((n = o.getAttributeNode("id")) && n.value === e) return [o]
                    }
                    return []
                }
            }), b.find.TAG = d.getElementsByTagName ? function (e, t) {
                return "undefined" != typeof t.getElementsByTagName ? t.getElementsByTagName(e) : d.qsa ? t.querySelectorAll(e) : void 0
            } : function (e, t) {
                var n, r = [], i = 0, o = t.getElementsByTagName(e);
                if ("*" === e) {
                    while (n = o[i++]) 1 === n.nodeType && r.push(n);
                    return r
                }
                return o
            }, b.find.CLASS = d.getElementsByClassName && function (e, t) {
                if ("undefined" != typeof t.getElementsByClassName && E) return t.getElementsByClassName(e)
            }, s = [], v = [], (d.qsa = K.test(C.querySelectorAll)) && (ce(function (e) {
                a.appendChild(e).innerHTML = "<a id='" + k + "'></a><select id='" + k + "-\r\\' msallowcapture=''><option selected=''></option></select>", e.querySelectorAll("[msallowcapture^='']").length && v.push("[*^$]=" + M + "*(?:''|\"\")"), e.querySelectorAll("[selected]").length || v.push("\\[" + M + "*(?:value|" + R + ")"), e.querySelectorAll("[id~=" + k + "-]").length || v.push("~="), e.querySelectorAll(":checked").length || v.push(":checked"), e.querySelectorAll("a#" + k + "+*").length || v.push(".#.+[+~]")
            }), ce(function (e) {
                e.innerHTML = "<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";
                var t = C.createElement("input");
                t.setAttribute("type", "hidden"), e.appendChild(t).setAttribute("name", "D"), e.querySelectorAll("[name=d]").length && v.push("name" + M + "*[*^$|!~]?="), 2 !== e.querySelectorAll(":enabled").length && v.push(":enabled", ":disabled"), a.appendChild(e).disabled = !0, 2 !== e.querySelectorAll(":disabled").length && v.push(":enabled", ":disabled"), e.querySelectorAll("*,"), v.push(",.*:")
            })), (d.matchesSelector = K.test(c = a.matches || a.webkitMatchesSelector || a.mozMatchesSelector || a.oMatchesSelector || a.msMatchesSelector)) && ce(function (e) {
                d.disconnectedMatch = c.call(e, "*"), c.call(e, "[s!='']:x"), s.push("!=", $)
            }), v = v.length && new RegExp(v.join("|")), s = s.length && new RegExp(s.join("|")), t = K.test(a.compareDocumentPosition), y = t || K.test(a.contains) ? function (e, t) {
                var n = 9 === e.nodeType ? e.documentElement : e, r = t && t.parentNode;
                return e === r || !(!r || 1 !== r.nodeType || !(n.contains ? n.contains(r) : e.compareDocumentPosition && 16 & e.compareDocumentPosition(r)))
            } : function (e, t) {
                if (t) while (t = t.parentNode) if (t === e) return !0;
                return !1
            }, D = t ? function (e, t) {
                if (e === t) return l = !0, 0;
                var n = !e.compareDocumentPosition - !t.compareDocumentPosition;
                return n || (1 & (n = (e.ownerDocument || e) === (t.ownerDocument || t) ? e.compareDocumentPosition(t) : 1) || !d.sortDetached && t.compareDocumentPosition(e) === n ? e === C || e.ownerDocument === m && y(m, e) ? -1 : t === C || t.ownerDocument === m && y(m, t) ? 1 : u ? P(u, e) - P(u, t) : 0 : 4 & n ? -1 : 1)
            } : function (e, t) {
                if (e === t) return l = !0, 0;
                var n, r = 0, i = e.parentNode, o = t.parentNode, a = [e], s = [t];
                if (!i || !o) return e === C ? -1 : t === C ? 1 : i ? -1 : o ? 1 : u ? P(u, e) - P(u, t) : 0;
                if (i === o) return pe(e, t);
                n = e;
                while (n = n.parentNode) a.unshift(n);
                n = t;
                while (n = n.parentNode) s.unshift(n);
                while (a[r] === s[r]) r++;
                return r ? pe(a[r], s[r]) : a[r] === m ? -1 : s[r] === m ? 1 : 0
            }), C
        }, se.matches = function (e, t) {
            return se(e, null, null, t)
        }, se.matchesSelector = function (e, t) {
            if ((e.ownerDocument || e) !== C && T(e), d.matchesSelector && E && !A[t + " "] && (!s || !s.test(t)) && (!v || !v.test(t))) try {
                var n = c.call(e, t);
                if (n || d.disconnectedMatch || e.document && 11 !== e.document.nodeType) return n
            } catch (e) {
                A(t, !0)
            }
            return 0 < se(t, C, null, [e]).length
        }, se.contains = function (e, t) {
            return (e.ownerDocument || e) !== C && T(e), y(e, t)
        }, se.attr = function (e, t) {
            (e.ownerDocument || e) !== C && T(e);
            var n = b.attrHandle[t.toLowerCase()],
                r = n && j.call(b.attrHandle, t.toLowerCase()) ? n(e, t, !E) : void 0;
            return void 0 !== r ? r : d.attributes || !E ? e.getAttribute(t) : (r = e.getAttributeNode(t)) && r.specified ? r.value : null
        }, se.escape = function (e) {
            return (e + "").replace(re, ie)
        }, se.error = function (e) {
            throw new Error("Syntax error, unrecognized expression: " + e)
        }, se.uniqueSort = function (e) {
            var t, n = [], r = 0, i = 0;
            if (l = !d.detectDuplicates, u = !d.sortStable && e.slice(0), e.sort(D), l) {
                while (t = e[i++]) t === e[i] && (r = n.push(i));
                while (r--) e.splice(n[r], 1)
            }
            return u = null, e
        }, o = se.getText = function (e) {
            var t, n = "", r = 0, i = e.nodeType;
            if (i) {
                if (1 === i || 9 === i || 11 === i) {
                    if ("string" == typeof e.textContent) return e.textContent;
                    for (e = e.firstChild; e; e = e.nextSibling) n += o(e)
                } else if (3 === i || 4 === i) return e.nodeValue
            } else while (t = e[r++]) n += o(t);
            return n
        }, (b = se.selectors = {
            cacheLength: 50,
            createPseudo: le,
            match: G,
            attrHandle: {},
            find: {},
            relative: {
                ">": {dir: "parentNode", first: !0},
                " ": {dir: "parentNode"},
                "+": {dir: "previousSibling", first: !0},
                "~": {dir: "previousSibling"}
            },
            preFilter: {
                ATTR: function (e) {
                    return e[1] = e[1].replace(te, ne), e[3] = (e[3] || e[4] || e[5] || "").replace(te, ne), "~=" === e[2] && (e[3] = " " + e[3] + " "), e.slice(0, 4)
                }, CHILD: function (e) {
                    return e[1] = e[1].toLowerCase(), "nth" === e[1].slice(0, 3) ? (e[3] || se.error(e[0]), e[4] = +(e[4] ? e[5] + (e[6] || 1) : 2 * ("even" === e[3] || "odd" === e[3])), e[5] = +(e[7] + e[8] || "odd" === e[3])) : e[3] && se.error(e[0]), e
                }, PSEUDO: function (e) {
                    var t, n = !e[6] && e[2];
                    return G.CHILD.test(e[0]) ? null : (e[3] ? e[2] = e[4] || e[5] || "" : n && X.test(n) && (t = h(n, !0)) && (t = n.indexOf(")", n.length - t) - n.length) && (e[0] = e[0].slice(0, t), e[2] = n.slice(0, t)), e.slice(0, 3))
                }
            },
            filter: {
                TAG: function (e) {
                    var t = e.replace(te, ne).toLowerCase();
                    return "*" === e ? function () {
                        return !0
                    } : function (e) {
                        return e.nodeName && e.nodeName.toLowerCase() === t
                    }
                }, CLASS: function (e) {
                    var t = p[e + " "];
                    return t || (t = new RegExp("(^|" + M + ")" + e + "(" + M + "|$)")) && p(e, function (e) {
                        return t.test("string" == typeof e.className && e.className || "undefined" != typeof e.getAttribute && e.getAttribute("class") || "")
                    })
                }, ATTR: function (n, r, i) {
                    return function (e) {
                        var t = se.attr(e, n);
                        return null == t ? "!=" === r : !r || (t += "", "=" === r ? t === i : "!=" === r ? t !== i : "^=" === r ? i && 0 === t.indexOf(i) : "*=" === r ? i && -1 < t.indexOf(i) : "$=" === r ? i && t.slice(-i.length) === i : "~=" === r ? -1 < (" " + t.replace(F, " ") + " ").indexOf(i) : "|=" === r && (t === i || t.slice(0, i.length + 1) === i + "-"))
                    }
                }, CHILD: function (h, e, t, g, v) {
                    var y = "nth" !== h.slice(0, 3), m = "last" !== h.slice(-4), x = "of-type" === e;
                    return 1 === g && 0 === v ? function (e) {
                        return !!e.parentNode
                    } : function (e, t, n) {
                        var r, i, o, a, s, u, l = y !== m ? "nextSibling" : "previousSibling", c = e.parentNode,
                            f = x && e.nodeName.toLowerCase(), p = !n && !x, d = !1;
                        if (c) {
                            if (y) {
                                while (l) {
                                    a = e;
                                    while (a = a[l]) if (x ? a.nodeName.toLowerCase() === f : 1 === a.nodeType) return !1;
                                    u = l = "only" === h && !u && "nextSibling"
                                }
                                return !0
                            }
                            if (u = [m ? c.firstChild : c.lastChild], m && p) {
                                d = (s = (r = (i = (o = (a = c)[k] || (a[k] = {}))[a.uniqueID] || (o[a.uniqueID] = {}))[h] || [])[0] === S && r[1]) && r[2], a = s && c.childNodes[s];
                                while (a = ++s && a && a[l] || (d = s = 0) || u.pop()) if (1 === a.nodeType && ++d && a === e) {
                                    i[h] = [S, s, d];
                                    break
                                }
                            } else if (p && (d = s = (r = (i = (o = (a = e)[k] || (a[k] = {}))[a.uniqueID] || (o[a.uniqueID] = {}))[h] || [])[0] === S && r[1]), !1 === d) while (a = ++s && a && a[l] || (d = s = 0) || u.pop()) if ((x ? a.nodeName.toLowerCase() === f : 1 === a.nodeType) && ++d && (p && ((i = (o = a[k] || (a[k] = {}))[a.uniqueID] || (o[a.uniqueID] = {}))[h] = [S, d]), a === e)) break;
                            return (d -= v) === g || d % g == 0 && 0 <= d / g
                        }
                    }
                }, PSEUDO: function (e, o) {
                    var t, a = b.pseudos[e] || b.setFilters[e.toLowerCase()] || se.error("unsupported pseudo: " + e);
                    return a[k] ? a(o) : 1 < a.length ? (t = [e, e, "", o], b.setFilters.hasOwnProperty(e.toLowerCase()) ? le(function (e, t) {
                        var n, r = a(e, o), i = r.length;
                        while (i--) e[n = P(e, r[i])] = !(t[n] = r[i])
                    }) : function (e) {
                        return a(e, 0, t)
                    }) : a
                }
            },
            pseudos: {
                not: le(function (e) {
                    var r = [], i = [], s = f(e.replace(B, "$1"));
                    return s[k] ? le(function (e, t, n, r) {
                        var i, o = s(e, null, r, []), a = e.length;
                        while (a--) (i = o[a]) && (e[a] = !(t[a] = i))
                    }) : function (e, t, n) {
                        return r[0] = e, s(r, null, n, i), r[0] = null, !i.pop()
                    }
                }), has: le(function (t) {
                    return function (e) {
                        return 0 < se(t, e).length
                    }
                }), contains: le(function (t) {
                    return t = t.replace(te, ne), function (e) {
                        return -1 < (e.textContent || o(e)).indexOf(t)
                    }
                }), lang: le(function (n) {
                    return V.test(n || "") || se.error("unsupported lang: " + n), n = n.replace(te, ne).toLowerCase(), function (e) {
                        var t;
                        do {
                            if (t = E ? e.lang : e.getAttribute("xml:lang") || e.getAttribute("lang")) return (t = t.toLowerCase()) === n || 0 === t.indexOf(n + "-")
                        } while ((e = e.parentNode) && 1 === e.nodeType);
                        return !1
                    }
                }), target: function (e) {
                    var t = n.location && n.location.hash;
                    return t && t.slice(1) === e.id
                }, root: function (e) {
                    return e === a
                }, focus: function (e) {
                    return e === C.activeElement && (!C.hasFocus || C.hasFocus()) && !!(e.type || e.href || ~e.tabIndex)
                }, enabled: ge(!1), disabled: ge(!0), checked: function (e) {
                    var t = e.nodeName.toLowerCase();
                    return "input" === t && !!e.checked || "option" === t && !!e.selected
                }, selected: function (e) {
                    return e.parentNode && e.parentNode.selectedIndex, !0 === e.selected
                }, empty: function (e) {
                    for (e = e.firstChild; e; e = e.nextSibling) if (e.nodeType < 6) return !1;
                    return !0
                }, parent: function (e) {
                    return !b.pseudos.empty(e)
                }, header: function (e) {
                    return J.test(e.nodeName)
                }, input: function (e) {
                    return Q.test(e.nodeName)
                }, button: function (e) {
                    var t = e.nodeName.toLowerCase();
                    return "input" === t && "button" === e.type || "button" === t
                }, text: function (e) {
                    var t;
                    return "input" === e.nodeName.toLowerCase() && "text" === e.type && (null == (t = e.getAttribute("type")) || "text" === t.toLowerCase())
                }, first: ve(function () {
                    return [0]
                }), last: ve(function (e, t) {
                    return [t - 1]
                }), eq: ve(function (e, t, n) {
                    return [n < 0 ? n + t : n]
                }), even: ve(function (e, t) {
                    for (var n = 0; n < t; n += 2) e.push(n);
                    return e
                }), odd: ve(function (e, t) {
                    for (var n = 1; n < t; n += 2) e.push(n);
                    return e
                }), lt: ve(function (e, t, n) {
                    for (var r = n < 0 ? n + t : t < n ? t : n; 0 <= --r;) e.push(r);
                    return e
                }), gt: ve(function (e, t, n) {
                    for (var r = n < 0 ? n + t : n; ++r < t;) e.push(r);
                    return e
                })
            }
        }).pseudos.nth = b.pseudos.eq, {
            radio: !0,
            checkbox: !0,
            file: !0,
            password: !0,
            image: !0
        }) b.pseudos[e] = de(e);
        for (e in {submit: !0, reset: !0}) b.pseudos[e] = he(e);

        function me() {
        }

        function xe(e) {
            for (var t = 0, n = e.length, r = ""; t < n; t++) r += e[t].value;
            return r
        }

        function be(s, e, t) {
            var u = e.dir, l = e.next, c = l || u, f = t && "parentNode" === c, p = r++;
            return e.first ? function (e, t, n) {
                while (e = e[u]) if (1 === e.nodeType || f) return s(e, t, n);
                return !1
            } : function (e, t, n) {
                var r, i, o, a = [S, p];
                if (n) {
                    while (e = e[u]) if ((1 === e.nodeType || f) && s(e, t, n)) return !0
                } else while (e = e[u]) if (1 === e.nodeType || f) if (i = (o = e[k] || (e[k] = {}))[e.uniqueID] || (o[e.uniqueID] = {}), l && l === e.nodeName.toLowerCase()) e = e[u] || e; else {
                    if ((r = i[c]) && r[0] === S && r[1] === p) return a[2] = r[2];
                    if ((i[c] = a)[2] = s(e, t, n)) return !0
                }
                return !1
            }
        }

        function we(i) {
            return 1 < i.length ? function (e, t, n) {
                var r = i.length;
                while (r--) if (!i[r](e, t, n)) return !1;
                return !0
            } : i[0]
        }

        function Te(e, t, n, r, i) {
            for (var o, a = [], s = 0, u = e.length, l = null != t; s < u; s++) (o = e[s]) && (n && !n(o, r, i) || (a.push(o), l && t.push(s)));
            return a
        }

        function Ce(d, h, g, v, y, e) {
            return v && !v[k] && (v = Ce(v)), y && !y[k] && (y = Ce(y, e)), le(function (e, t, n, r) {
                var i, o, a, s = [], u = [], l = t.length, c = e || function (e, t, n) {
                        for (var r = 0, i = t.length; r < i; r++) se(e, t[r], n);
                        return n
                    }(h || "*", n.nodeType ? [n] : n, []), f = !d || !e && h ? c : Te(c, s, d, n, r),
                    p = g ? y || (e ? d : l || v) ? [] : t : f;
                if (g && g(f, p, n, r), v) {
                    i = Te(p, u), v(i, [], n, r), o = i.length;
                    while (o--) (a = i[o]) && (p[u[o]] = !(f[u[o]] = a))
                }
                if (e) {
                    if (y || d) {
                        if (y) {
                            i = [], o = p.length;
                            while (o--) (a = p[o]) && i.push(f[o] = a);
                            y(null, p = [], i, r)
                        }
                        o = p.length;
                        while (o--) (a = p[o]) && -1 < (i = y ? P(e, a) : s[o]) && (e[i] = !(t[i] = a))
                    }
                } else p = Te(p === t ? p.splice(l, p.length) : p), y ? y(null, t, p, r) : H.apply(t, p)
            })
        }

        function Ee(e) {
            for (var i, t, n, r = e.length, o = b.relative[e[0].type], a = o || b.relative[" "], s = o ? 1 : 0, u = be(function (e) {
                return e === i
            }, a, !0), l = be(function (e) {
                return -1 < P(i, e)
            }, a, !0), c = [function (e, t, n) {
                var r = !o && (n || t !== w) || ((i = t).nodeType ? u(e, t, n) : l(e, t, n));
                return i = null, r
            }]; s < r; s++) if (t = b.relative[e[s].type]) c = [be(we(c), t)]; else {
                if ((t = b.filter[e[s].type].apply(null, e[s].matches))[k]) {
                    for (n = ++s; n < r; n++) if (b.relative[e[n].type]) break;
                    return Ce(1 < s && we(c), 1 < s && xe(e.slice(0, s - 1).concat({value: " " === e[s - 2].type ? "*" : ""})).replace(B, "$1"), t, s < n && Ee(e.slice(s, n)), n < r && Ee(e = e.slice(n)), n < r && xe(e))
                }
                c.push(t)
            }
            return we(c)
        }

        return me.prototype = b.filters = b.pseudos, b.setFilters = new me, h = se.tokenize = function (e, t) {
            var n, r, i, o, a, s, u, l = x[e + " "];
            if (l) return t ? 0 : l.slice(0);
            a = e, s = [], u = b.preFilter;
            while (a) {
                for (o in n && !(r = _.exec(a)) || (r && (a = a.slice(r[0].length) || a), s.push(i = [])), n = !1, (r = z.exec(a)) && (n = r.shift(), i.push({
                    value: n,
                    type: r[0].replace(B, " ")
                }), a = a.slice(n.length)), b.filter) !(r = G[o].exec(a)) || u[o] && !(r = u[o](r)) || (n = r.shift(), i.push({
                    value: n,
                    type: o,
                    matches: r
                }), a = a.slice(n.length));
                if (!n) break
            }
            return t ? a.length : a ? se.error(e) : x(e, s).slice(0)
        }, f = se.compile = function (e, t) {
            var n, v, y, m, x, r, i = [], o = [], a = N[e + " "];
            if (!a) {
                t || (t = h(e)), n = t.length;
                while (n--) (a = Ee(t[n]))[k] ? i.push(a) : o.push(a);
                (a = N(e, (v = o, m = 0 < (y = i).length, x = 0 < v.length, r = function (e, t, n, r, i) {
                    var o, a, s, u = 0, l = "0", c = e && [], f = [], p = w, d = e || x && b.find.TAG("*", i),
                        h = S += null == p ? 1 : Math.random() || .1, g = d.length;
                    for (i && (w = t === C || t || i); l !== g && null != (o = d[l]); l++) {
                        if (x && o) {
                            a = 0, t || o.ownerDocument === C || (T(o), n = !E);
                            while (s = v[a++]) if (s(o, t || C, n)) {
                                r.push(o);
                                break
                            }
                            i && (S = h)
                        }
                        m && ((o = !s && o) && u--, e && c.push(o))
                    }
                    if (u += l, m && l !== u) {
                        a = 0;
                        while (s = y[a++]) s(c, f, t, n);
                        if (e) {
                            if (0 < u) while (l--) c[l] || f[l] || (f[l] = q.call(r));
                            f = Te(f)
                        }
                        H.apply(r, f), i && !e && 0 < f.length && 1 < u + y.length && se.uniqueSort(r)
                    }
                    return i && (S = h, w = p), c
                }, m ? le(r) : r))).selector = e
            }
            return a
        }, g = se.select = function (e, t, n, r) {
            var i, o, a, s, u, l = "function" == typeof e && e, c = !r && h(e = l.selector || e);
            if (n = n || [], 1 === c.length) {
                if (2 < (o = c[0] = c[0].slice(0)).length && "ID" === (a = o[0]).type && 9 === t.nodeType && E && b.relative[o[1].type]) {
                    if (!(t = (b.find.ID(a.matches[0].replace(te, ne), t) || [])[0])) return n;
                    l && (t = t.parentNode), e = e.slice(o.shift().value.length)
                }
                i = G.needsContext.test(e) ? 0 : o.length;
                while (i--) {
                    if (a = o[i], b.relative[s = a.type]) break;
                    if ((u = b.find[s]) && (r = u(a.matches[0].replace(te, ne), ee.test(o[0].type) && ye(t.parentNode) || t))) {
                        if (o.splice(i, 1), !(e = r.length && xe(o))) return H.apply(n, r), n;
                        break
                    }
                }
            }
            return (l || f(e, c))(r, t, !E, n, !t || ee.test(e) && ye(t.parentNode) || t), n
        }, d.sortStable = k.split("").sort(D).join("") === k, d.detectDuplicates = !!l, T(), d.sortDetached = ce(function (e) {
            return 1 & e.compareDocumentPosition(C.createElement("fieldset"))
        }), ce(function (e) {
            return e.innerHTML = "<a href='#'></a>", "#" === e.firstChild.getAttribute("href")
        }) || fe("type|href|height|width", function (e, t, n) {
            if (!n) return e.getAttribute(t, "type" === t.toLowerCase() ? 1 : 2)
        }), d.attributes && ce(function (e) {
            return e.innerHTML = "<input/>", e.firstChild.setAttribute("value", ""), "" === e.firstChild.getAttribute("value")
        }) || fe("value", function (e, t, n) {
            if (!n && "input" === e.nodeName.toLowerCase()) return e.defaultValue
        }), ce(function (e) {
            return null == e.getAttribute("disabled")
        }) || fe(R, function (e, t, n) {
            var r;
            if (!n) return !0 === e[t] ? t.toLowerCase() : (r = e.getAttributeNode(t)) && r.specified ? r.value : null
        }), se
    }(C);
    k.find = h, k.expr = h.selectors, k.expr[":"] = k.expr.pseudos, k.uniqueSort = k.unique = h.uniqueSort, k.text = h.getText, k.isXMLDoc = h.isXML, k.contains = h.contains, k.escapeSelector = h.escape;
    var T = function (e, t, n) {
        var r = [], i = void 0 !== n;
        while ((e = e[t]) && 9 !== e.nodeType) if (1 === e.nodeType) {
            if (i && k(e).is(n)) break;
            r.push(e)
        }
        return r
    }, S = function (e, t) {
        for (var n = []; e; e = e.nextSibling) 1 === e.nodeType && e !== t && n.push(e);
        return n
    }, N = k.expr.match.needsContext;

    function A(e, t) {
        return e.nodeName && e.nodeName.toLowerCase() === t.toLowerCase()
    }

    var D = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

    function j(e, n, r) {
        return m(n) ? k.grep(e, function (e, t) {
            return !!n.call(e, t, e) !== r
        }) : n.nodeType ? k.grep(e, function (e) {
            return e === n !== r
        }) : "string" != typeof n ? k.grep(e, function (e) {
            return -1 < i.call(n, e) !== r
        }) : k.filter(n, e, r)
    }

    k.filter = function (e, t, n) {
        var r = t[0];
        return n && (e = ":not(" + e + ")"), 1 === t.length && 1 === r.nodeType ? k.find.matchesSelector(r, e) ? [r] : [] : k.find.matches(e, k.grep(t, function (e) {
            return 1 === e.nodeType
        }))
    }, k.fn.extend({
        find: function (e) {
            var t, n, r = this.length, i = this;
            if ("string" != typeof e) return this.pushStack(k(e).filter(function () {
                for (t = 0; t < r; t++) if (k.contains(i[t], this)) return !0
            }));
            for (n = this.pushStack([]), t = 0; t < r; t++) k.find(e, i[t], n);
            return 1 < r ? k.uniqueSort(n) : n
        }, filter: function (e) {
            return this.pushStack(j(this, e || [], !1))
        }, not: function (e) {
            return this.pushStack(j(this, e || [], !0))
        }, is: function (e) {
            return !!j(this, "string" == typeof e && N.test(e) ? k(e) : e || [], !1).length
        }
    });
    var q, L = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
    (k.fn.init = function (e, t, n) {
        var r, i;
        if (!e) return this;
        if (n = n || q, "string" == typeof e) {
            if (!(r = "<" === e[0] && ">" === e[e.length - 1] && 3 <= e.length ? [null, e, null] : L.exec(e)) || !r[1] && t) return !t || t.jquery ? (t || n).find(e) : this.constructor(t).find(e);
            if (r[1]) {
                if (t = t instanceof k ? t[0] : t, k.merge(this, k.parseHTML(r[1], t && t.nodeType ? t.ownerDocument || t : E, !0)), D.test(r[1]) && k.isPlainObject(t)) for (r in t) m(this[r]) ? this[r](t[r]) : this.attr(r, t[r]);
                return this
            }
            return (i = E.getElementById(r[2])) && (this[0] = i, this.length = 1), this
        }
        return e.nodeType ? (this[0] = e, this.length = 1, this) : m(e) ? void 0 !== n.ready ? n.ready(e) : e(k) : k.makeArray(e, this)
    }).prototype = k.fn, q = k(E);
    var H = /^(?:parents|prev(?:Until|All))/, O = {children: !0, contents: !0, next: !0, prev: !0};

    function P(e, t) {
        while ((e = e[t]) && 1 !== e.nodeType) ;
        return e
    }

    k.fn.extend({
        has: function (e) {
            var t = k(e, this), n = t.length;
            return this.filter(function () {
                for (var e = 0; e < n; e++) if (k.contains(this, t[e])) return !0
            })
        }, closest: function (e, t) {
            var n, r = 0, i = this.length, o = [], a = "string" != typeof e && k(e);
            if (!N.test(e)) for (; r < i; r++) for (n = this[r]; n && n !== t; n = n.parentNode) if (n.nodeType < 11 && (a ? -1 < a.index(n) : 1 === n.nodeType && k.find.matchesSelector(n, e))) {
                o.push(n);
                break
            }
            return this.pushStack(1 < o.length ? k.uniqueSort(o) : o)
        }, index: function (e) {
            return e ? "string" == typeof e ? i.call(k(e), this[0]) : i.call(this, e.jquery ? e[0] : e) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1
        }, add: function (e, t) {
            return this.pushStack(k.uniqueSort(k.merge(this.get(), k(e, t))))
        }, addBack: function (e) {
            return this.add(null == e ? this.prevObject : this.prevObject.filter(e))
        }
    }), k.each({
        parent: function (e) {
            var t = e.parentNode;
            return t && 11 !== t.nodeType ? t : null
        }, parents: function (e) {
            return T(e, "parentNode")
        }, parentsUntil: function (e, t, n) {
            return T(e, "parentNode", n)
        }, next: function (e) {
            return P(e, "nextSibling")
        }, prev: function (e) {
            return P(e, "previousSibling")
        }, nextAll: function (e) {
            return T(e, "nextSibling")
        }, prevAll: function (e) {
            return T(e, "previousSibling")
        }, nextUntil: function (e, t, n) {
            return T(e, "nextSibling", n)
        }, prevUntil: function (e, t, n) {
            return T(e, "previousSibling", n)
        }, siblings: function (e) {
            return S((e.parentNode || {}).firstChild, e)
        }, children: function (e) {
            return S(e.firstChild)
        }, contents: function (e) {
            return "undefined" != typeof e.contentDocument ? e.contentDocument : (A(e, "template") && (e = e.content || e), k.merge([], e.childNodes))
        }
    }, function (r, i) {
        k.fn[r] = function (e, t) {
            var n = k.map(this, i, e);
            return "Until" !== r.slice(-5) && (t = e), t && "string" == typeof t && (n = k.filter(t, n)), 1 < this.length && (O[r] || k.uniqueSort(n), H.test(r) && n.reverse()), this.pushStack(n)
        }
    });
    var R = /[^\x20\t\r\n\f]+/g;

    function M(e) {
        return e
    }

    function I(e) {
        throw e
    }

    function W(e, t, n, r) {
        var i;
        try {
            e && m(i = e.promise) ? i.call(e).done(t).fail(n) : e && m(i = e.then) ? i.call(e, t, n) : t.apply(void 0, [e].slice(r))
        } catch (e) {
            n.apply(void 0, [e])
        }
    }

    k.Callbacks = function (r) {
        var e, n;
        r = "string" == typeof r ? (e = r, n = {}, k.each(e.match(R) || [], function (e, t) {
            n[t] = !0
        }), n) : k.extend({}, r);
        var i, t, o, a, s = [], u = [], l = -1, c = function () {
            for (a = a || r.once, o = i = !0; u.length; l = -1) {
                t = u.shift();
                while (++l < s.length) !1 === s[l].apply(t[0], t[1]) && r.stopOnFalse && (l = s.length, t = !1)
            }
            r.memory || (t = !1), i = !1, a && (s = t ? [] : "")
        }, f = {
            add: function () {
                return s && (t && !i && (l = s.length - 1, u.push(t)), function n(e) {
                    k.each(e, function (e, t) {
                        m(t) ? r.unique && f.has(t) || s.push(t) : t && t.length && "string" !== w(t) && n(t)
                    })
                }(arguments), t && !i && c()), this
            }, remove: function () {
                return k.each(arguments, function (e, t) {
                    var n;
                    while (-1 < (n = k.inArray(t, s, n))) s.splice(n, 1), n <= l && l--
                }), this
            }, has: function (e) {
                return e ? -1 < k.inArray(e, s) : 0 < s.length
            }, empty: function () {
                return s && (s = []), this
            }, disable: function () {
                return a = u = [], s = t = "", this
            }, disabled: function () {
                return !s
            }, lock: function () {
                return a = u = [], t || i || (s = t = ""), this
            }, locked: function () {
                return !!a
            }, fireWith: function (e, t) {
                return a || (t = [e, (t = t || []).slice ? t.slice() : t], u.push(t), i || c()), this
            }, fire: function () {
                return f.fireWith(this, arguments), this
            }, fired: function () {
                return !!o
            }
        };
        return f
    }, k.extend({
        Deferred: function (e) {
            var o = [["notify", "progress", k.Callbacks("memory"), k.Callbacks("memory"), 2], ["resolve", "done", k.Callbacks("once memory"), k.Callbacks("once memory"), 0, "resolved"], ["reject", "fail", k.Callbacks("once memory"), k.Callbacks("once memory"), 1, "rejected"]],
                i = "pending", a = {
                    state: function () {
                        return i
                    }, always: function () {
                        return s.done(arguments).fail(arguments), this
                    }, "catch": function (e) {
                        return a.then(null, e)
                    }, pipe: function () {
                        var i = arguments;
                        return k.Deferred(function (r) {
                            k.each(o, function (e, t) {
                                var n = m(i[t[4]]) && i[t[4]];
                                s[t[1]](function () {
                                    var e = n && n.apply(this, arguments);
                                    e && m(e.promise) ? e.promise().progress(r.notify).done(r.resolve).fail(r.reject) : r[t[0] + "With"](this, n ? [e] : arguments)
                                })
                            }), i = null
                        }).promise()
                    }, then: function (t, n, r) {
                        var u = 0;

                        function l(i, o, a, s) {
                            return function () {
                                var n = this, r = arguments, e = function () {
                                    var e, t;
                                    if (!(i < u)) {
                                        if ((e = a.apply(n, r)) === o.promise()) throw new TypeError("Thenable self-resolution");
                                        t = e && ("object" == typeof e || "function" == typeof e) && e.then, m(t) ? s ? t.call(e, l(u, o, M, s), l(u, o, I, s)) : (u++, t.call(e, l(u, o, M, s), l(u, o, I, s), l(u, o, M, o.notifyWith))) : (a !== M && (n = void 0, r = [e]), (s || o.resolveWith)(n, r))
                                    }
                                }, t = s ? e : function () {
                                    try {
                                        e()
                                    } catch (e) {
                                        k.Deferred.exceptionHook && k.Deferred.exceptionHook(e, t.stackTrace), u <= i + 1 && (a !== I && (n = void 0, r = [e]), o.rejectWith(n, r))
                                    }
                                };
                                i ? t() : (k.Deferred.getStackHook && (t.stackTrace = k.Deferred.getStackHook()), C.setTimeout(t))
                            }
                        }

                        return k.Deferred(function (e) {
                            o[0][3].add(l(0, e, m(r) ? r : M, e.notifyWith)), o[1][3].add(l(0, e, m(t) ? t : M)), o[2][3].add(l(0, e, m(n) ? n : I))
                        }).promise()
                    }, promise: function (e) {
                        return null != e ? k.extend(e, a) : a
                    }
                }, s = {};
            return k.each(o, function (e, t) {
                var n = t[2], r = t[5];
                a[t[1]] = n.add, r && n.add(function () {
                    i = r
                }, o[3 - e][2].disable, o[3 - e][3].disable, o[0][2].lock, o[0][3].lock), n.add(t[3].fire), s[t[0]] = function () {
                    return s[t[0] + "With"](this === s ? void 0 : this, arguments), this
                }, s[t[0] + "With"] = n.fireWith
            }), a.promise(s), e && e.call(s, s), s
        }, when: function (e) {
            var n = arguments.length, t = n, r = Array(t), i = s.call(arguments), o = k.Deferred(), a = function (t) {
                return function (e) {
                    r[t] = this, i[t] = 1 < arguments.length ? s.call(arguments) : e, --n || o.resolveWith(r, i)
                }
            };
            if (n <= 1 && (W(e, o.done(a(t)).resolve, o.reject, !n), "pending" === o.state() || m(i[t] && i[t].then))) return o.then();
            while (t--) W(i[t], a(t), o.reject);
            return o.promise()
        }
    });
    var $ = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
    k.Deferred.exceptionHook = function (e, t) {
        C.console && C.console.warn && e && $.test(e.name) && C.console.warn("jQuery.Deferred exception: " + e.message, e.stack, t)
    }, k.readyException = function (e) {
        C.setTimeout(function () {
            throw e
        })
    };
    var F = k.Deferred();

    function B() {
        E.removeEventListener("DOMContentLoaded", B), C.removeEventListener("load", B), k.ready()
    }

    k.fn.ready = function (e) {
        return F.then(e)["catch"](function (e) {
            k.readyException(e)
        }), this
    }, k.extend({
        isReady: !1, readyWait: 1, ready: function (e) {
            (!0 === e ? --k.readyWait : k.isReady) || (k.isReady = !0) !== e && 0 < --k.readyWait || F.resolveWith(E, [k])
        }
    }), k.ready.then = F.then, "complete" === E.readyState || "loading" !== E.readyState && !E.documentElement.doScroll ? C.setTimeout(k.ready) : (E.addEventListener("DOMContentLoaded", B), C.addEventListener("load", B));
    var _ = function (e, t, n, r, i, o, a) {
        var s = 0, u = e.length, l = null == n;
        if ("object" === w(n)) for (s in i = !0, n) _(e, t, s, n[s], !0, o, a); else if (void 0 !== r && (i = !0, m(r) || (a = !0), l && (a ? (t.call(e, r), t = null) : (l = t, t = function (e, t, n) {
            return l.call(k(e), n)
        })), t)) for (; s < u; s++) t(e[s], n, a ? r : r.call(e[s], s, t(e[s], n)));
        return i ? e : l ? t.call(e) : u ? t(e[0], n) : o
    }, z = /^-ms-/, U = /-([a-z])/g;

    function X(e, t) {
        return t.toUpperCase()
    }

    function V(e) {
        return e.replace(z, "ms-").replace(U, X)
    }

    var G = function (e) {
        return 1 === e.nodeType || 9 === e.nodeType || !+e.nodeType
    };

    function Y() {
        this.expando = k.expando + Y.uid++
    }

    Y.uid = 1, Y.prototype = {
        cache: function (e) {
            var t = e[this.expando];
            return t || (t = {}, G(e) && (e.nodeType ? e[this.expando] = t : Object.defineProperty(e, this.expando, {
                value: t,
                configurable: !0
            }))), t
        }, set: function (e, t, n) {
            var r, i = this.cache(e);
            if ("string" == typeof t) i[V(t)] = n; else for (r in t) i[V(r)] = t[r];
            return i
        }, get: function (e, t) {
            return void 0 === t ? this.cache(e) : e[this.expando] && e[this.expando][V(t)]
        }, access: function (e, t, n) {
            return void 0 === t || t && "string" == typeof t && void 0 === n ? this.get(e, t) : (this.set(e, t, n), void 0 !== n ? n : t)
        }, remove: function (e, t) {
            var n, r = e[this.expando];
            if (void 0 !== r) {
                if (void 0 !== t) {
                    n = (t = Array.isArray(t) ? t.map(V) : (t = V(t)) in r ? [t] : t.match(R) || []).length;
                    while (n--) delete r[t[n]]
                }
                (void 0 === t || k.isEmptyObject(r)) && (e.nodeType ? e[this.expando] = void 0 : delete e[this.expando])
            }
        }, hasData: function (e) {
            var t = e[this.expando];
            return void 0 !== t && !k.isEmptyObject(t)
        }
    };
    var Q = new Y, J = new Y, K = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, Z = /[A-Z]/g;

    function ee(e, t, n) {
        var r, i;
        if (void 0 === n && 1 === e.nodeType) if (r = "data-" + t.replace(Z, "-$&").toLowerCase(), "string" == typeof (n = e.getAttribute(r))) {
            try {
                n = "true" === (i = n) || "false" !== i && ("null" === i ? null : i === +i + "" ? +i : K.test(i) ? JSON.parse(i) : i)
            } catch (e) {
            }
            J.set(e, t, n)
        } else n = void 0;
        return n
    }

    k.extend({
        hasData: function (e) {
            return J.hasData(e) || Q.hasData(e)
        }, data: function (e, t, n) {
            return J.access(e, t, n)
        }, removeData: function (e, t) {
            J.remove(e, t)
        }, _data: function (e, t, n) {
            return Q.access(e, t, n)
        }, _removeData: function (e, t) {
            Q.remove(e, t)
        }
    }), k.fn.extend({
        data: function (n, e) {
            var t, r, i, o = this[0], a = o && o.attributes;
            if (void 0 === n) {
                if (this.length && (i = J.get(o), 1 === o.nodeType && !Q.get(o, "hasDataAttrs"))) {
                    t = a.length;
                    while (t--) a[t] && 0 === (r = a[t].name).indexOf("data-") && (r = V(r.slice(5)), ee(o, r, i[r]));
                    Q.set(o, "hasDataAttrs", !0)
                }
                return i
            }
            return "object" == typeof n ? this.each(function () {
                J.set(this, n)
            }) : _(this, function (e) {
                var t;
                if (o && void 0 === e) return void 0 !== (t = J.get(o, n)) ? t : void 0 !== (t = ee(o, n)) ? t : void 0;
                this.each(function () {
                    J.set(this, n, e)
                })
            }, null, e, 1 < arguments.length, null, !0)
        }, removeData: function (e) {
            return this.each(function () {
                J.remove(this, e)
            })
        }
    }), k.extend({
        queue: function (e, t, n) {
            var r;
            if (e) return t = (t || "fx") + "queue", r = Q.get(e, t), n && (!r || Array.isArray(n) ? r = Q.access(e, t, k.makeArray(n)) : r.push(n)), r || []
        }, dequeue: function (e, t) {
            t = t || "fx";
            var n = k.queue(e, t), r = n.length, i = n.shift(), o = k._queueHooks(e, t);
            "inprogress" === i && (i = n.shift(), r--), i && ("fx" === t && n.unshift("inprogress"), delete o.stop, i.call(e, function () {
                k.dequeue(e, t)
            }, o)), !r && o && o.empty.fire()
        }, _queueHooks: function (e, t) {
            var n = t + "queueHooks";
            return Q.get(e, n) || Q.access(e, n, {
                empty: k.Callbacks("once memory").add(function () {
                    Q.remove(e, [t + "queue", n])
                })
            })
        }
    }), k.fn.extend({
        queue: function (t, n) {
            var e = 2;
            return "string" != typeof t && (n = t, t = "fx", e--), arguments.length < e ? k.queue(this[0], t) : void 0 === n ? this : this.each(function () {
                var e = k.queue(this, t, n);
                k._queueHooks(this, t), "fx" === t && "inprogress" !== e[0] && k.dequeue(this, t)
            })
        }, dequeue: function (e) {
            return this.each(function () {
                k.dequeue(this, e)
            })
        }, clearQueue: function (e) {
            return this.queue(e || "fx", [])
        }, promise: function (e, t) {
            var n, r = 1, i = k.Deferred(), o = this, a = this.length, s = function () {
                --r || i.resolveWith(o, [o])
            };
            "string" != typeof e && (t = e, e = void 0), e = e || "fx";
            while (a--) (n = Q.get(o[a], e + "queueHooks")) && n.empty && (r++, n.empty.add(s));
            return s(), i.promise(t)
        }
    });
    var te = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, ne = new RegExp("^(?:([+-])=|)(" + te + ")([a-z%]*)$", "i"),
        re = ["Top", "Right", "Bottom", "Left"], ie = E.documentElement, oe = function (e) {
            return k.contains(e.ownerDocument, e)
        }, ae = {composed: !0};
    ie.getRootNode && (oe = function (e) {
        return k.contains(e.ownerDocument, e) || e.getRootNode(ae) === e.ownerDocument
    });
    var se = function (e, t) {
        return "none" === (e = t || e).style.display || "" === e.style.display && oe(e) && "none" === k.css(e, "display")
    }, ue = function (e, t, n, r) {
        var i, o, a = {};
        for (o in t) a[o] = e.style[o], e.style[o] = t[o];
        for (o in i = n.apply(e, r || []), t) e.style[o] = a[o];
        return i
    };

    function le(e, t, n, r) {
        var i, o, a = 20, s = r ? function () {
                return r.cur()
            } : function () {
                return k.css(e, t, "")
            }, u = s(), l = n && n[3] || (k.cssNumber[t] ? "" : "px"),
            c = e.nodeType && (k.cssNumber[t] || "px" !== l && +u) && ne.exec(k.css(e, t));
        if (c && c[3] !== l) {
            u /= 2, l = l || c[3], c = +u || 1;
            while (a--) k.style(e, t, c + l), (1 - o) * (1 - (o = s() / u || .5)) <= 0 && (a = 0), c /= o;
            c *= 2, k.style(e, t, c + l), n = n || []
        }
        return n && (c = +c || +u || 0, i = n[1] ? c + (n[1] + 1) * n[2] : +n[2], r && (r.unit = l, r.start = c, r.end = i)), i
    }

    var ce = {};

    function fe(e, t) {
        for (var n, r, i, o, a, s, u, l = [], c = 0, f = e.length; c < f; c++) (r = e[c]).style && (n = r.style.display, t ? ("none" === n && (l[c] = Q.get(r, "display") || null, l[c] || (r.style.display = "")), "" === r.style.display && se(r) && (l[c] = (u = a = o = void 0, a = (i = r).ownerDocument, s = i.nodeName, (u = ce[s]) || (o = a.body.appendChild(a.createElement(s)), u = k.css(o, "display"), o.parentNode.removeChild(o), "none" === u && (u = "block"), ce[s] = u)))) : "none" !== n && (l[c] = "none", Q.set(r, "display", n)));
        for (c = 0; c < f; c++) null != l[c] && (e[c].style.display = l[c]);
        return e
    }

    k.fn.extend({
        show: function () {
            return fe(this, !0)
        }, hide: function () {
            return fe(this)
        }, toggle: function (e) {
            return "boolean" == typeof e ? e ? this.show() : this.hide() : this.each(function () {
                se(this) ? k(this).show() : k(this).hide()
            })
        }
    });
    var pe = /^(?:checkbox|radio)$/i, de = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i, he = /^$|^module$|\/(?:java|ecma)script/i,
        ge = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            thead: [1, "<table>", "</table>"],
            col: [2, "<table><colgroup>", "</colgroup></table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            _default: [0, "", ""]
        };

    function ve(e, t) {
        var n;
        return n = "undefined" != typeof e.getElementsByTagName ? e.getElementsByTagName(t || "*") : "undefined" != typeof e.querySelectorAll ? e.querySelectorAll(t || "*") : [], void 0 === t || t && A(e, t) ? k.merge([e], n) : n
    }

    function ye(e, t) {
        for (var n = 0, r = e.length; n < r; n++) Q.set(e[n], "globalEval", !t || Q.get(t[n], "globalEval"))
    }

    ge.optgroup = ge.option, ge.tbody = ge.tfoot = ge.colgroup = ge.caption = ge.thead, ge.th = ge.td;
    var me, xe, be = /<|&#?\w+;/;

    function we(e, t, n, r, i) {
        for (var o, a, s, u, l, c, f = t.createDocumentFragment(), p = [], d = 0, h = e.length; d < h; d++) if ((o = e[d]) || 0 === o) if ("object" === w(o)) k.merge(p, o.nodeType ? [o] : o); else if (be.test(o)) {
            a = a || f.appendChild(t.createElement("div")), s = (de.exec(o) || ["", ""])[1].toLowerCase(), u = ge[s] || ge._default, a.innerHTML = u[1] + k.htmlPrefilter(o) + u[2], c = u[0];
            while (c--) a = a.lastChild;
            k.merge(p, a.childNodes), (a = f.firstChild).textContent = ""
        } else p.push(t.createTextNode(o));
        f.textContent = "", d = 0;
        while (o = p[d++]) if (r && -1 < k.inArray(o, r)) i && i.push(o); else if (l = oe(o), a = ve(f.appendChild(o), "script"), l && ye(a), n) {
            c = 0;
            while (o = a[c++]) he.test(o.type || "") && n.push(o)
        }
        return f
    }

    me = E.createDocumentFragment().appendChild(E.createElement("div")), (xe = E.createElement("input")).setAttribute("type", "radio"), xe.setAttribute("checked", "checked"), xe.setAttribute("name", "t"), me.appendChild(xe), y.checkClone = me.cloneNode(!0).cloneNode(!0).lastChild.checked, me.innerHTML = "<textarea>x</textarea>", y.noCloneChecked = !!me.cloneNode(!0).lastChild.defaultValue;
    var Te = /^key/, Ce = /^(?:mouse|pointer|contextmenu|drag|drop)|click/, Ee = /^([^.]*)(?:\.(.+)|)/;

    function ke() {
        return !0
    }

    function Se() {
        return !1
    }

    function Ne(e, t) {
        return e === function () {
            try {
                return E.activeElement
            } catch (e) {
            }
        }() == ("focus" === t)
    }

    function Ae(e, t, n, r, i, o) {
        var a, s;
        if ("object" == typeof t) {
            for (s in "string" != typeof n && (r = r || n, n = void 0), t) Ae(e, s, n, r, t[s], o);
            return e
        }
        if (null == r && null == i ? (i = n, r = n = void 0) : null == i && ("string" == typeof n ? (i = r, r = void 0) : (i = r, r = n, n = void 0)), !1 === i) i = Se; else if (!i) return e;
        return 1 === o && (a = i, (i = function (e) {
            return k().off(e), a.apply(this, arguments)
        }).guid = a.guid || (a.guid = k.guid++)), e.each(function () {
            k.event.add(this, t, i, r, n)
        })
    }

    function De(e, i, o) {
        o ? (Q.set(e, i, !1), k.event.add(e, i, {
            namespace: !1, handler: function (e) {
                var t, n, r = Q.get(this, i);
                if (1 & e.isTrigger && this[i]) {
                    if (r.length) (k.event.special[i] || {}).delegateType && e.stopPropagation(); else if (r = s.call(arguments), Q.set(this, i, r), t = o(this, i), this[i](), r !== (n = Q.get(this, i)) || t ? Q.set(this, i, !1) : n = {}, r !== n) return e.stopImmediatePropagation(), e.preventDefault(), n.value
                } else r.length && (Q.set(this, i, {value: k.event.trigger(k.extend(r[0], k.Event.prototype), r.slice(1), this)}), e.stopImmediatePropagation())
            }
        })) : void 0 === Q.get(e, i) && k.event.add(e, i, ke)
    }

    k.event = {
        global: {}, add: function (t, e, n, r, i) {
            var o, a, s, u, l, c, f, p, d, h, g, v = Q.get(t);
            if (v) {
                n.handler && (n = (o = n).handler, i = o.selector), i && k.find.matchesSelector(ie, i), n.guid || (n.guid = k.guid++), (u = v.events) || (u = v.events = {}), (a = v.handle) || (a = v.handle = function (e) {
                    return "undefined" != typeof k && k.event.triggered !== e.type ? k.event.dispatch.apply(t, arguments) : void 0
                }), l = (e = (e || "").match(R) || [""]).length;
                while (l--) d = g = (s = Ee.exec(e[l]) || [])[1], h = (s[2] || "").split(".").sort(), d && (f = k.event.special[d] || {}, d = (i ? f.delegateType : f.bindType) || d, f = k.event.special[d] || {}, c = k.extend({
                    type: d,
                    origType: g,
                    data: r,
                    handler: n,
                    guid: n.guid,
                    selector: i,
                    needsContext: i && k.expr.match.needsContext.test(i),
                    namespace: h.join(".")
                }, o), (p = u[d]) || ((p = u[d] = []).delegateCount = 0, f.setup && !1 !== f.setup.call(t, r, h, a) || t.addEventListener && t.addEventListener(d, a)), f.add && (f.add.call(t, c), c.handler.guid || (c.handler.guid = n.guid)), i ? p.splice(p.delegateCount++, 0, c) : p.push(c), k.event.global[d] = !0)
            }
        }, remove: function (e, t, n, r, i) {
            var o, a, s, u, l, c, f, p, d, h, g, v = Q.hasData(e) && Q.get(e);
            if (v && (u = v.events)) {
                l = (t = (t || "").match(R) || [""]).length;
                while (l--) if (d = g = (s = Ee.exec(t[l]) || [])[1], h = (s[2] || "").split(".").sort(), d) {
                    f = k.event.special[d] || {}, p = u[d = (r ? f.delegateType : f.bindType) || d] || [], s = s[2] && new RegExp("(^|\\.)" + h.join("\\.(?:.*\\.|)") + "(\\.|$)"), a = o = p.length;
                    while (o--) c = p[o], !i && g !== c.origType || n && n.guid !== c.guid || s && !s.test(c.namespace) || r && r !== c.selector && ("**" !== r || !c.selector) || (p.splice(o, 1), c.selector && p.delegateCount--, f.remove && f.remove.call(e, c));
                    a && !p.length && (f.teardown && !1 !== f.teardown.call(e, h, v.handle) || k.removeEvent(e, d, v.handle), delete u[d])
                } else for (d in u) k.event.remove(e, d + t[l], n, r, !0);
                k.isEmptyObject(u) && Q.remove(e, "handle events")
            }
        }, dispatch: function (e) {
            var t, n, r, i, o, a, s = k.event.fix(e), u = new Array(arguments.length),
                l = (Q.get(this, "events") || {})[s.type] || [], c = k.event.special[s.type] || {};
            for (u[0] = s, t = 1; t < arguments.length; t++) u[t] = arguments[t];
            if (s.delegateTarget = this, !c.preDispatch || !1 !== c.preDispatch.call(this, s)) {
                a = k.event.handlers.call(this, s, l), t = 0;
                while ((i = a[t++]) && !s.isPropagationStopped()) {
                    s.currentTarget = i.elem, n = 0;
                    while ((o = i.handlers[n++]) && !s.isImmediatePropagationStopped()) s.rnamespace && !1 !== o.namespace && !s.rnamespace.test(o.namespace) || (s.handleObj = o, s.data = o.data, void 0 !== (r = ((k.event.special[o.origType] || {}).handle || o.handler).apply(i.elem, u)) && !1 === (s.result = r) && (s.preventDefault(), s.stopPropagation()))
                }
                return c.postDispatch && c.postDispatch.call(this, s), s.result
            }
        }, handlers: function (e, t) {
            var n, r, i, o, a, s = [], u = t.delegateCount, l = e.target;
            if (u && l.nodeType && !("click" === e.type && 1 <= e.button)) for (; l !== this; l = l.parentNode || this) if (1 === l.nodeType && ("click" !== e.type || !0 !== l.disabled)) {
                for (o = [], a = {}, n = 0; n < u; n++) void 0 === a[i = (r = t[n]).selector + " "] && (a[i] = r.needsContext ? -1 < k(i, this).index(l) : k.find(i, this, null, [l]).length), a[i] && o.push(r);
                o.length && s.push({elem: l, handlers: o})
            }
            return l = this, u < t.length && s.push({elem: l, handlers: t.slice(u)}), s
        }, addProp: function (t, e) {
            Object.defineProperty(k.Event.prototype, t, {
                enumerable: !0, configurable: !0, get: m(e) ? function () {
                    if (this.originalEvent) return e(this.originalEvent)
                } : function () {
                    if (this.originalEvent) return this.originalEvent[t]
                }, set: function (e) {
                    Object.defineProperty(this, t, {enumerable: !0, configurable: !0, writable: !0, value: e})
                }
            })
        }, fix: function (e) {
            return e[k.expando] ? e : new k.Event(e)
        }, special: {
            load: {noBubble: !0}, click: {
                setup: function (e) {
                    var t = this || e;
                    return pe.test(t.type) && t.click && A(t, "input") && De(t, "click", ke), !1
                }, trigger: function (e) {
                    var t = this || e;
                    return pe.test(t.type) && t.click && A(t, "input") && De(t, "click"), !0
                }, _default: function (e) {
                    var t = e.target;
                    return pe.test(t.type) && t.click && A(t, "input") && Q.get(t, "click") || A(t, "a")
                }
            }, beforeunload: {
                postDispatch: function (e) {
                    void 0 !== e.result && e.originalEvent && (e.originalEvent.returnValue = e.result)
                }
            }
        }
    }, k.removeEvent = function (e, t, n) {
        e.removeEventListener && e.removeEventListener(t, n)
    }, k.Event = function (e, t) {
        if (!(this instanceof k.Event)) return new k.Event(e, t);
        e && e.type ? (this.originalEvent = e, this.type = e.type, this.isDefaultPrevented = e.defaultPrevented || void 0 === e.defaultPrevented && !1 === e.returnValue ? ke : Se, this.target = e.target && 3 === e.target.nodeType ? e.target.parentNode : e.target, this.currentTarget = e.currentTarget, this.relatedTarget = e.relatedTarget) : this.type = e, t && k.extend(this, t), this.timeStamp = e && e.timeStamp || Date.now(), this[k.expando] = !0
    }, k.Event.prototype = {
        constructor: k.Event,
        isDefaultPrevented: Se,
        isPropagationStopped: Se,
        isImmediatePropagationStopped: Se,
        isSimulated: !1,
        preventDefault: function () {
            var e = this.originalEvent;
            this.isDefaultPrevented = ke, e && !this.isSimulated && e.preventDefault()
        },
        stopPropagation: function () {
            var e = this.originalEvent;
            this.isPropagationStopped = ke, e && !this.isSimulated && e.stopPropagation()
        },
        stopImmediatePropagation: function () {
            var e = this.originalEvent;
            this.isImmediatePropagationStopped = ke, e && !this.isSimulated && e.stopImmediatePropagation(), this.stopPropagation()
        }
    }, k.each({
        altKey: !0,
        bubbles: !0,
        cancelable: !0,
        changedTouches: !0,
        ctrlKey: !0,
        detail: !0,
        eventPhase: !0,
        metaKey: !0,
        pageX: !0,
        pageY: !0,
        shiftKey: !0,
        view: !0,
        "char": !0,
        code: !0,
        charCode: !0,
        key: !0,
        keyCode: !0,
        button: !0,
        buttons: !0,
        clientX: !0,
        clientY: !0,
        offsetX: !0,
        offsetY: !0,
        pointerId: !0,
        pointerType: !0,
        screenX: !0,
        screenY: !0,
        targetTouches: !0,
        toElement: !0,
        touches: !0,
        which: function (e) {
            var t = e.button;
            return null == e.which && Te.test(e.type) ? null != e.charCode ? e.charCode : e.keyCode : !e.which && void 0 !== t && Ce.test(e.type) ? 1 & t ? 1 : 2 & t ? 3 : 4 & t ? 2 : 0 : e.which
        }
    }, k.event.addProp), k.each({focus: "focusin", blur: "focusout"}, function (e, t) {
        k.event.special[e] = {
            setup: function () {
                return De(this, e, Ne), !1
            }, trigger: function () {
                return De(this, e), !0
            }, delegateType: t
        }
    }), k.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        pointerenter: "pointerover",
        pointerleave: "pointerout"
    }, function (e, i) {
        k.event.special[e] = {
            delegateType: i, bindType: i, handle: function (e) {
                var t, n = e.relatedTarget, r = e.handleObj;
                return n && (n === this || k.contains(this, n)) || (e.type = r.origType, t = r.handler.apply(this, arguments), e.type = i), t
            }
        }
    }), k.fn.extend({
        on: function (e, t, n, r) {
            return Ae(this, e, t, n, r)
        }, one: function (e, t, n, r) {
            return Ae(this, e, t, n, r, 1)
        }, off: function (e, t, n) {
            var r, i;
            if (e && e.preventDefault && e.handleObj) return r = e.handleObj, k(e.delegateTarget).off(r.namespace ? r.origType + "." + r.namespace : r.origType, r.selector, r.handler), this;
            if ("object" == typeof e) {
                for (i in e) this.off(i, t, e[i]);
                return this
            }
            return !1 !== t && "function" != typeof t || (n = t, t = void 0), !1 === n && (n = Se), this.each(function () {
                k.event.remove(this, e, n, t)
            })
        }
    });
    var je = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
        qe = /<script|<style|<link/i, Le = /checked\s*(?:[^=]|=\s*.checked.)/i,
        He = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

    function Oe(e, t) {
        return A(e, "table") && A(11 !== t.nodeType ? t : t.firstChild, "tr") && k(e).children("tbody")[0] || e
    }

    function Pe(e) {
        return e.type = (null !== e.getAttribute("type")) + "/" + e.type, e
    }

    function Re(e) {
        return "true/" === (e.type || "").slice(0, 5) ? e.type = e.type.slice(5) : e.removeAttribute("type"), e
    }

    function Me(e, t) {
        var n, r, i, o, a, s, u, l;
        if (1 === t.nodeType) {
            if (Q.hasData(e) && (o = Q.access(e), a = Q.set(t, o), l = o.events)) for (i in delete a.handle, a.events = {}, l) for (n = 0, r = l[i].length; n < r; n++) k.event.add(t, i, l[i][n]);
            J.hasData(e) && (s = J.access(e), u = k.extend({}, s), J.set(t, u))
        }
    }

    function Ie(n, r, i, o) {
        r = g.apply([], r);
        var e, t, a, s, u, l, c = 0, f = n.length, p = f - 1, d = r[0], h = m(d);
        if (h || 1 < f && "string" == typeof d && !y.checkClone && Le.test(d)) return n.each(function (e) {
            var t = n.eq(e);
            h && (r[0] = d.call(this, e, t.html())), Ie(t, r, i, o)
        });
        if (f && (t = (e = we(r, n[0].ownerDocument, !1, n, o)).firstChild, 1 === e.childNodes.length && (e = t), t || o)) {
            for (s = (a = k.map(ve(e, "script"), Pe)).length; c < f; c++) u = e, c !== p && (u = k.clone(u, !0, !0), s && k.merge(a, ve(u, "script"))), i.call(n[c], u, c);
            if (s) for (l = a[a.length - 1].ownerDocument, k.map(a, Re), c = 0; c < s; c++) u = a[c], he.test(u.type || "") && !Q.access(u, "globalEval") && k.contains(l, u) && (u.src && "module" !== (u.type || "").toLowerCase() ? k._evalUrl && !u.noModule && k._evalUrl(u.src, {nonce: u.nonce || u.getAttribute("nonce")}) : b(u.textContent.replace(He, ""), u, l))
        }
        return n
    }

    function We(e, t, n) {
        for (var r, i = t ? k.filter(t, e) : e, o = 0; null != (r = i[o]); o++) n || 1 !== r.nodeType || k.cleanData(ve(r)), r.parentNode && (n && oe(r) && ye(ve(r, "script")), r.parentNode.removeChild(r));
        return e
    }

    k.extend({
        htmlPrefilter: function (e) {
            return e.replace(je, "<$1></$2>")
        }, clone: function (e, t, n) {
            var r, i, o, a, s, u, l, c = e.cloneNode(!0), f = oe(e);
            if (!(y.noCloneChecked || 1 !== e.nodeType && 11 !== e.nodeType || k.isXMLDoc(e))) for (a = ve(c), r = 0, i = (o = ve(e)).length; r < i; r++) s = o[r], u = a[r], void 0, "input" === (l = u.nodeName.toLowerCase()) && pe.test(s.type) ? u.checked = s.checked : "input" !== l && "textarea" !== l || (u.defaultValue = s.defaultValue);
            if (t) if (n) for (o = o || ve(e), a = a || ve(c), r = 0, i = o.length; r < i; r++) Me(o[r], a[r]); else Me(e, c);
            return 0 < (a = ve(c, "script")).length && ye(a, !f && ve(e, "script")), c
        }, cleanData: function (e) {
            for (var t, n, r, i = k.event.special, o = 0; void 0 !== (n = e[o]); o++) if (G(n)) {
                if (t = n[Q.expando]) {
                    if (t.events) for (r in t.events) i[r] ? k.event.remove(n, r) : k.removeEvent(n, r, t.handle);
                    n[Q.expando] = void 0
                }
                n[J.expando] && (n[J.expando] = void 0)
            }
        }
    }), k.fn.extend({
        detach: function (e) {
            return We(this, e, !0)
        }, remove: function (e) {
            return We(this, e)
        }, text: function (e) {
            return _(this, function (e) {
                return void 0 === e ? k.text(this) : this.empty().each(function () {
                    1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || (this.textContent = e)
                })
            }, null, e, arguments.length)
        }, append: function () {
            return Ie(this, arguments, function (e) {
                1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || Oe(this, e).appendChild(e)
            })
        }, prepend: function () {
            return Ie(this, arguments, function (e) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var t = Oe(this, e);
                    t.insertBefore(e, t.firstChild)
                }
            })
        }, before: function () {
            return Ie(this, arguments, function (e) {
                this.parentNode && this.parentNode.insertBefore(e, this)
            })
        }, after: function () {
            return Ie(this, arguments, function (e) {
                this.parentNode && this.parentNode.insertBefore(e, this.nextSibling)
            })
        }, empty: function () {
            for (var e, t = 0; null != (e = this[t]); t++) 1 === e.nodeType && (k.cleanData(ve(e, !1)), e.textContent = "");
            return this
        }, clone: function (e, t) {
            return e = null != e && e, t = null == t ? e : t, this.map(function () {
                return k.clone(this, e, t)
            })
        }, html: function (e) {
            return _(this, function (e) {
                var t = this[0] || {}, n = 0, r = this.length;
                if (void 0 === e && 1 === t.nodeType) return t.innerHTML;
                if ("string" == typeof e && !qe.test(e) && !ge[(de.exec(e) || ["", ""])[1].toLowerCase()]) {
                    e = k.htmlPrefilter(e);
                    try {
                        for (; n < r; n++) 1 === (t = this[n] || {}).nodeType && (k.cleanData(ve(t, !1)), t.innerHTML = e);
                        t = 0
                    } catch (e) {
                    }
                }
                t && this.empty().append(e)
            }, null, e, arguments.length)
        }, replaceWith: function () {
            var n = [];
            return Ie(this, arguments, function (e) {
                var t = this.parentNode;
                k.inArray(this, n) < 0 && (k.cleanData(ve(this)), t && t.replaceChild(e, this))
            }, n)
        }
    }), k.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function (e, a) {
        k.fn[e] = function (e) {
            for (var t, n = [], r = k(e), i = r.length - 1, o = 0; o <= i; o++) t = o === i ? this : this.clone(!0), k(r[o])[a](t), u.apply(n, t.get());
            return this.pushStack(n)
        }
    });
    var $e = new RegExp("^(" + te + ")(?!px)[a-z%]+$", "i"), Fe = function (e) {
        var t = e.ownerDocument.defaultView;
        return t && t.opener || (t = C), t.getComputedStyle(e)
    }, Be = new RegExp(re.join("|"), "i");

    function _e(e, t, n) {
        var r, i, o, a, s = e.style;
        return (n = n || Fe(e)) && ("" !== (a = n.getPropertyValue(t) || n[t]) || oe(e) || (a = k.style(e, t)), !y.pixelBoxStyles() && $e.test(a) && Be.test(t) && (r = s.width, i = s.minWidth, o = s.maxWidth, s.minWidth = s.maxWidth = s.width = a, a = n.width, s.width = r, s.minWidth = i, s.maxWidth = o)), void 0 !== a ? a + "" : a
    }

    function ze(e, t) {
        return {
            get: function () {
                if (!e()) return (this.get = t).apply(this, arguments);
                delete this.get
            }
        }
    }

    !function () {
        function e() {
            if (u) {
                s.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0", u.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%", ie.appendChild(s).appendChild(u);
                var e = C.getComputedStyle(u);
                n = "1%" !== e.top, a = 12 === t(e.marginLeft), u.style.right = "60%", o = 36 === t(e.right), r = 36 === t(e.width), u.style.position = "absolute", i = 12 === t(u.offsetWidth / 3), ie.removeChild(s), u = null
            }
        }

        function t(e) {
            return Math.round(parseFloat(e))
        }

        var n, r, i, o, a, s = E.createElement("div"), u = E.createElement("div");
        u.style && (u.style.backgroundClip = "content-box", u.cloneNode(!0).style.backgroundClip = "", y.clearCloneStyle = "content-box" === u.style.backgroundClip, k.extend(y, {
            boxSizingReliable: function () {
                return e(), r
            }, pixelBoxStyles: function () {
                return e(), o
            }, pixelPosition: function () {
                return e(), n
            }, reliableMarginLeft: function () {
                return e(), a
            }, scrollboxSize: function () {
                return e(), i
            }
        }))
    }();
    var Ue = ["Webkit", "Moz", "ms"], Xe = E.createElement("div").style, Ve = {};

    function Ge(e) {
        var t = k.cssProps[e] || Ve[e];
        return t || (e in Xe ? e : Ve[e] = function (e) {
            var t = e[0].toUpperCase() + e.slice(1), n = Ue.length;
            while (n--) if ((e = Ue[n] + t) in Xe) return e
        }(e) || e)
    }

    var Ye = /^(none|table(?!-c[ea]).+)/, Qe = /^--/,
        Je = {position: "absolute", visibility: "hidden", display: "block"},
        Ke = {letterSpacing: "0", fontWeight: "400"};

    function Ze(e, t, n) {
        var r = ne.exec(t);
        return r ? Math.max(0, r[2] - (n || 0)) + (r[3] || "px") : t
    }

    function et(e, t, n, r, i, o) {
        var a = "width" === t ? 1 : 0, s = 0, u = 0;
        if (n === (r ? "border" : "content")) return 0;
        for (; a < 4; a += 2) "margin" === n && (u += k.css(e, n + re[a], !0, i)), r ? ("content" === n && (u -= k.css(e, "padding" + re[a], !0, i)), "margin" !== n && (u -= k.css(e, "border" + re[a] + "Width", !0, i))) : (u += k.css(e, "padding" + re[a], !0, i), "padding" !== n ? u += k.css(e, "border" + re[a] + "Width", !0, i) : s += k.css(e, "border" + re[a] + "Width", !0, i));
        return !r && 0 <= o && (u += Math.max(0, Math.ceil(e["offset" + t[0].toUpperCase() + t.slice(1)] - o - u - s - .5)) || 0), u
    }

    function tt(e, t, n) {
        var r = Fe(e), i = (!y.boxSizingReliable() || n) && "border-box" === k.css(e, "boxSizing", !1, r), o = i,
            a = _e(e, t, r), s = "offset" + t[0].toUpperCase() + t.slice(1);
        if ($e.test(a)) {
            if (!n) return a;
            a = "auto"
        }
        return (!y.boxSizingReliable() && i || "auto" === a || !parseFloat(a) && "inline" === k.css(e, "display", !1, r)) && e.getClientRects().length && (i = "border-box" === k.css(e, "boxSizing", !1, r), (o = s in e) && (a = e[s])), (a = parseFloat(a) || 0) + et(e, t, n || (i ? "border" : "content"), o, r, a) + "px"
    }

    function nt(e, t, n, r, i) {
        return new nt.prototype.init(e, t, n, r, i)
    }

    k.extend({
        cssHooks: {
            opacity: {
                get: function (e, t) {
                    if (t) {
                        var n = _e(e, "opacity");
                        return "" === n ? "1" : n
                    }
                }
            }
        },
        cssNumber: {
            animationIterationCount: !0,
            columnCount: !0,
            fillOpacity: !0,
            flexGrow: !0,
            flexShrink: !0,
            fontWeight: !0,
            gridArea: !0,
            gridColumn: !0,
            gridColumnEnd: !0,
            gridColumnStart: !0,
            gridRow: !0,
            gridRowEnd: !0,
            gridRowStart: !0,
            lineHeight: !0,
            opacity: !0,
            order: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {},
        style: function (e, t, n, r) {
            if (e && 3 !== e.nodeType && 8 !== e.nodeType && e.style) {
                var i, o, a, s = V(t), u = Qe.test(t), l = e.style;
                if (u || (t = Ge(s)), a = k.cssHooks[t] || k.cssHooks[s], void 0 === n) return a && "get" in a && void 0 !== (i = a.get(e, !1, r)) ? i : l[t];
                "string" === (o = typeof n) && (i = ne.exec(n)) && i[1] && (n = le(e, t, i), o = "number"), null != n && n == n && ("number" !== o || u || (n += i && i[3] || (k.cssNumber[s] ? "" : "px")), y.clearCloneStyle || "" !== n || 0 !== t.indexOf("background") || (l[t] = "inherit"), a && "set" in a && void 0 === (n = a.set(e, n, r)) || (u ? l.setProperty(t, n) : l[t] = n))
            }
        },
        css: function (e, t, n, r) {
            var i, o, a, s = V(t);
            return Qe.test(t) || (t = Ge(s)), (a = k.cssHooks[t] || k.cssHooks[s]) && "get" in a && (i = a.get(e, !0, n)), void 0 === i && (i = _e(e, t, r)), "normal" === i && t in Ke && (i = Ke[t]), "" === n || n ? (o = parseFloat(i), !0 === n || isFinite(o) ? o || 0 : i) : i
        }
    }), k.each(["height", "width"], function (e, u) {
        k.cssHooks[u] = {
            get: function (e, t, n) {
                if (t) return !Ye.test(k.css(e, "display")) || e.getClientRects().length && e.getBoundingClientRect().width ? tt(e, u, n) : ue(e, Je, function () {
                    return tt(e, u, n)
                })
            }, set: function (e, t, n) {
                var r, i = Fe(e), o = !y.scrollboxSize() && "absolute" === i.position,
                    a = (o || n) && "border-box" === k.css(e, "boxSizing", !1, i), s = n ? et(e, u, n, a, i) : 0;
                return a && o && (s -= Math.ceil(e["offset" + u[0].toUpperCase() + u.slice(1)] - parseFloat(i[u]) - et(e, u, "border", !1, i) - .5)), s && (r = ne.exec(t)) && "px" !== (r[3] || "px") && (e.style[u] = t, t = k.css(e, u)), Ze(0, t, s)
            }
        }
    }), k.cssHooks.marginLeft = ze(y.reliableMarginLeft, function (e, t) {
        if (t) return (parseFloat(_e(e, "marginLeft")) || e.getBoundingClientRect().left - ue(e, {marginLeft: 0}, function () {
            return e.getBoundingClientRect().left
        })) + "px"
    }), k.each({margin: "", padding: "", border: "Width"}, function (i, o) {
        k.cssHooks[i + o] = {
            expand: function (e) {
                for (var t = 0, n = {}, r = "string" == typeof e ? e.split(" ") : [e]; t < 4; t++) n[i + re[t] + o] = r[t] || r[t - 2] || r[0];
                return n
            }
        }, "margin" !== i && (k.cssHooks[i + o].set = Ze)
    }), k.fn.extend({
        css: function (e, t) {
            return _(this, function (e, t, n) {
                var r, i, o = {}, a = 0;
                if (Array.isArray(t)) {
                    for (r = Fe(e), i = t.length; a < i; a++) o[t[a]] = k.css(e, t[a], !1, r);
                    return o
                }
                return void 0 !== n ? k.style(e, t, n) : k.css(e, t)
            }, e, t, 1 < arguments.length)
        }
    }), ((k.Tween = nt).prototype = {
        constructor: nt, init: function (e, t, n, r, i, o) {
            this.elem = e, this.prop = n, this.easing = i || k.easing._default, this.options = t, this.start = this.now = this.cur(), this.end = r, this.unit = o || (k.cssNumber[n] ? "" : "px")
        }, cur: function () {
            var e = nt.propHooks[this.prop];
            return e && e.get ? e.get(this) : nt.propHooks._default.get(this)
        }, run: function (e) {
            var t, n = nt.propHooks[this.prop];
            return this.options.duration ? this.pos = t = k.easing[this.easing](e, this.options.duration * e, 0, 1, this.options.duration) : this.pos = t = e, this.now = (this.end - this.start) * t + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), n && n.set ? n.set(this) : nt.propHooks._default.set(this), this
        }
    }).init.prototype = nt.prototype, (nt.propHooks = {
        _default: {
            get: function (e) {
                var t;
                return 1 !== e.elem.nodeType || null != e.elem[e.prop] && null == e.elem.style[e.prop] ? e.elem[e.prop] : (t = k.css(e.elem, e.prop, "")) && "auto" !== t ? t : 0
            }, set: function (e) {
                k.fx.step[e.prop] ? k.fx.step[e.prop](e) : 1 !== e.elem.nodeType || !k.cssHooks[e.prop] && null == e.elem.style[Ge(e.prop)] ? e.elem[e.prop] = e.now : k.style(e.elem, e.prop, e.now + e.unit)
            }
        }
    }).scrollTop = nt.propHooks.scrollLeft = {
        set: function (e) {
            e.elem.nodeType && e.elem.parentNode && (e.elem[e.prop] = e.now)
        }
    }, k.easing = {
        linear: function (e) {
            return e
        }, swing: function (e) {
            return .5 - Math.cos(e * Math.PI) / 2
        }, _default: "swing"
    }, k.fx = nt.prototype.init, k.fx.step = {};
    var rt, it, ot, at, st = /^(?:toggle|show|hide)$/, ut = /queueHooks$/;

    function lt() {
        it && (!1 === E.hidden && C.requestAnimationFrame ? C.requestAnimationFrame(lt) : C.setTimeout(lt, k.fx.interval), k.fx.tick())
    }

    function ct() {
        return C.setTimeout(function () {
            rt = void 0
        }), rt = Date.now()
    }

    function ft(e, t) {
        var n, r = 0, i = {height: e};
        for (t = t ? 1 : 0; r < 4; r += 2 - t) i["margin" + (n = re[r])] = i["padding" + n] = e;
        return t && (i.opacity = i.width = e), i
    }

    function pt(e, t, n) {
        for (var r, i = (dt.tweeners[t] || []).concat(dt.tweeners["*"]), o = 0, a = i.length; o < a; o++) if (r = i[o].call(n, t, e)) return r
    }

    function dt(o, e, t) {
        var n, a, r = 0, i = dt.prefilters.length, s = k.Deferred().always(function () {
            delete u.elem
        }), u = function () {
            if (a) return !1;
            for (var e = rt || ct(), t = Math.max(0, l.startTime + l.duration - e), n = 1 - (t / l.duration || 0), r = 0, i = l.tweens.length; r < i; r++) l.tweens[r].run(n);
            return s.notifyWith(o, [l, n, t]), n < 1 && i ? t : (i || s.notifyWith(o, [l, 1, 0]), s.resolveWith(o, [l]), !1)
        }, l = s.promise({
            elem: o,
            props: k.extend({}, e),
            opts: k.extend(!0, {specialEasing: {}, easing: k.easing._default}, t),
            originalProperties: e,
            originalOptions: t,
            startTime: rt || ct(),
            duration: t.duration,
            tweens: [],
            createTween: function (e, t) {
                var n = k.Tween(o, l.opts, e, t, l.opts.specialEasing[e] || l.opts.easing);
                return l.tweens.push(n), n
            },
            stop: function (e) {
                var t = 0, n = e ? l.tweens.length : 0;
                if (a) return this;
                for (a = !0; t < n; t++) l.tweens[t].run(1);
                return e ? (s.notifyWith(o, [l, 1, 0]), s.resolveWith(o, [l, e])) : s.rejectWith(o, [l, e]), this
            }
        }), c = l.props;
        for (!function (e, t) {
            var n, r, i, o, a;
            for (n in e) if (i = t[r = V(n)], o = e[n], Array.isArray(o) && (i = o[1], o = e[n] = o[0]), n !== r && (e[r] = o, delete e[n]), (a = k.cssHooks[r]) && "expand" in a) for (n in o = a.expand(o), delete e[r], o) n in e || (e[n] = o[n], t[n] = i); else t[r] = i
        }(c, l.opts.specialEasing); r < i; r++) if (n = dt.prefilters[r].call(l, o, c, l.opts)) return m(n.stop) && (k._queueHooks(l.elem, l.opts.queue).stop = n.stop.bind(n)), n;
        return k.map(c, pt, l), m(l.opts.start) && l.opts.start.call(o, l), l.progress(l.opts.progress).done(l.opts.done, l.opts.complete).fail(l.opts.fail).always(l.opts.always), k.fx.timer(k.extend(u, {
            elem: o,
            anim: l,
            queue: l.opts.queue
        })), l
    }

    k.Animation = k.extend(dt, {
        tweeners: {
            "*": [function (e, t) {
                var n = this.createTween(e, t);
                return le(n.elem, e, ne.exec(t), n), n
            }]
        }, tweener: function (e, t) {
            m(e) ? (t = e, e = ["*"]) : e = e.match(R);
            for (var n, r = 0, i = e.length; r < i; r++) n = e[r], dt.tweeners[n] = dt.tweeners[n] || [], dt.tweeners[n].unshift(t)
        }, prefilters: [function (e, t, n) {
            var r, i, o, a, s, u, l, c, f = "width" in t || "height" in t, p = this, d = {}, h = e.style,
                g = e.nodeType && se(e), v = Q.get(e, "fxshow");
            for (r in n.queue || (null == (a = k._queueHooks(e, "fx")).unqueued && (a.unqueued = 0, s = a.empty.fire, a.empty.fire = function () {
                a.unqueued || s()
            }), a.unqueued++, p.always(function () {
                p.always(function () {
                    a.unqueued--, k.queue(e, "fx").length || a.empty.fire()
                })
            })), t) if (i = t[r], st.test(i)) {
                if (delete t[r], o = o || "toggle" === i, i === (g ? "hide" : "show")) {
                    if ("show" !== i || !v || void 0 === v[r]) continue;
                    g = !0
                }
                d[r] = v && v[r] || k.style(e, r)
            }
            if ((u = !k.isEmptyObject(t)) || !k.isEmptyObject(d)) for (r in f && 1 === e.nodeType && (n.overflow = [h.overflow, h.overflowX, h.overflowY], null == (l = v && v.display) && (l = Q.get(e, "display")), "none" === (c = k.css(e, "display")) && (l ? c = l : (fe([e], !0), l = e.style.display || l, c = k.css(e, "display"), fe([e]))), ("inline" === c || "inline-block" === c && null != l) && "none" === k.css(e, "float") && (u || (p.done(function () {
                h.display = l
            }), null == l && (c = h.display, l = "none" === c ? "" : c)), h.display = "inline-block")), n.overflow && (h.overflow = "hidden", p.always(function () {
                h.overflow = n.overflow[0], h.overflowX = n.overflow[1], h.overflowY = n.overflow[2]
            })), u = !1, d) u || (v ? "hidden" in v && (g = v.hidden) : v = Q.access(e, "fxshow", {display: l}), o && (v.hidden = !g), g && fe([e], !0), p.done(function () {
                for (r in g || fe([e]), Q.remove(e, "fxshow"), d) k.style(e, r, d[r])
            })), u = pt(g ? v[r] : 0, r, p), r in v || (v[r] = u.start, g && (u.end = u.start, u.start = 0))
        }], prefilter: function (e, t) {
            t ? dt.prefilters.unshift(e) : dt.prefilters.push(e)
        }
    }), k.speed = function (e, t, n) {
        var r = e && "object" == typeof e ? k.extend({}, e) : {
            complete: n || !n && t || m(e) && e,
            duration: e,
            easing: n && t || t && !m(t) && t
        };
        return k.fx.off ? r.duration = 0 : "number" != typeof r.duration && (r.duration in k.fx.speeds ? r.duration = k.fx.speeds[r.duration] : r.duration = k.fx.speeds._default), null != r.queue && !0 !== r.queue || (r.queue = "fx"), r.old = r.complete, r.complete = function () {
            m(r.old) && r.old.call(this), r.queue && k.dequeue(this, r.queue)
        }, r
    }, k.fn.extend({
        fadeTo: function (e, t, n, r) {
            return this.filter(se).css("opacity", 0).show().end().animate({opacity: t}, e, n, r)
        }, animate: function (t, e, n, r) {
            var i = k.isEmptyObject(t), o = k.speed(e, n, r), a = function () {
                var e = dt(this, k.extend({}, t), o);
                (i || Q.get(this, "finish")) && e.stop(!0)
            };
            return a.finish = a, i || !1 === o.queue ? this.each(a) : this.queue(o.queue, a)
        }, stop: function (i, e, o) {
            var a = function (e) {
                var t = e.stop;
                delete e.stop, t(o)
            };
            return "string" != typeof i && (o = e, e = i, i = void 0), e && !1 !== i && this.queue(i || "fx", []), this.each(function () {
                var e = !0, t = null != i && i + "queueHooks", n = k.timers, r = Q.get(this);
                if (t) r[t] && r[t].stop && a(r[t]); else for (t in r) r[t] && r[t].stop && ut.test(t) && a(r[t]);
                for (t = n.length; t--;) n[t].elem !== this || null != i && n[t].queue !== i || (n[t].anim.stop(o), e = !1, n.splice(t, 1));
                !e && o || k.dequeue(this, i)
            })
        }, finish: function (a) {
            return !1 !== a && (a = a || "fx"), this.each(function () {
                var e, t = Q.get(this), n = t[a + "queue"], r = t[a + "queueHooks"], i = k.timers, o = n ? n.length : 0;
                for (t.finish = !0, k.queue(this, a, []), r && r.stop && r.stop.call(this, !0), e = i.length; e--;) i[e].elem === this && i[e].queue === a && (i[e].anim.stop(!0), i.splice(e, 1));
                for (e = 0; e < o; e++) n[e] && n[e].finish && n[e].finish.call(this);
                delete t.finish
            })
        }
    }), k.each(["toggle", "show", "hide"], function (e, r) {
        var i = k.fn[r];
        k.fn[r] = function (e, t, n) {
            return null == e || "boolean" == typeof e ? i.apply(this, arguments) : this.animate(ft(r, !0), e, t, n)
        }
    }), k.each({
        slideDown: ft("show"),
        slideUp: ft("hide"),
        slideToggle: ft("toggle"),
        fadeIn: {opacity: "show"},
        fadeOut: {opacity: "hide"},
        fadeToggle: {opacity: "toggle"}
    }, function (e, r) {
        k.fn[e] = function (e, t, n) {
            return this.animate(r, e, t, n)
        }
    }), k.timers = [], k.fx.tick = function () {
        var e, t = 0, n = k.timers;
        for (rt = Date.now(); t < n.length; t++) (e = n[t])() || n[t] !== e || n.splice(t--, 1);
        n.length || k.fx.stop(), rt = void 0
    }, k.fx.timer = function (e) {
        k.timers.push(e), k.fx.start()
    }, k.fx.interval = 13, k.fx.start = function () {
        it || (it = !0, lt())
    }, k.fx.stop = function () {
        it = null
    }, k.fx.speeds = {slow: 600, fast: 200, _default: 400}, k.fn.delay = function (r, e) {
        return r = k.fx && k.fx.speeds[r] || r, e = e || "fx", this.queue(e, function (e, t) {
            var n = C.setTimeout(e, r);
            t.stop = function () {
                C.clearTimeout(n)
            }
        })
    }, ot = E.createElement("input"), at = E.createElement("select").appendChild(E.createElement("option")), ot.type = "checkbox", y.checkOn = "" !== ot.value, y.optSelected = at.selected, (ot = E.createElement("input")).value = "t", ot.type = "radio", y.radioValue = "t" === ot.value;
    var ht, gt = k.expr.attrHandle;
    k.fn.extend({
        attr: function (e, t) {
            return _(this, k.attr, e, t, 1 < arguments.length)
        }, removeAttr: function (e) {
            return this.each(function () {
                k.removeAttr(this, e)
            })
        }
    }), k.extend({
        attr: function (e, t, n) {
            var r, i, o = e.nodeType;
            if (3 !== o && 8 !== o && 2 !== o) return "undefined" == typeof e.getAttribute ? k.prop(e, t, n) : (1 === o && k.isXMLDoc(e) || (i = k.attrHooks[t.toLowerCase()] || (k.expr.match.bool.test(t) ? ht : void 0)), void 0 !== n ? null === n ? void k.removeAttr(e, t) : i && "set" in i && void 0 !== (r = i.set(e, n, t)) ? r : (e.setAttribute(t, n + ""), n) : i && "get" in i && null !== (r = i.get(e, t)) ? r : null == (r = k.find.attr(e, t)) ? void 0 : r)
        }, attrHooks: {
            type: {
                set: function (e, t) {
                    if (!y.radioValue && "radio" === t && A(e, "input")) {
                        var n = e.value;
                        return e.setAttribute("type", t), n && (e.value = n), t
                    }
                }
            }
        }, removeAttr: function (e, t) {
            var n, r = 0, i = t && t.match(R);
            if (i && 1 === e.nodeType) while (n = i[r++]) e.removeAttribute(n)
        }
    }), ht = {
        set: function (e, t, n) {
            return !1 === t ? k.removeAttr(e, n) : e.setAttribute(n, n), n
        }
    }, k.each(k.expr.match.bool.source.match(/\w+/g), function (e, t) {
        var a = gt[t] || k.find.attr;
        gt[t] = function (e, t, n) {
            var r, i, o = t.toLowerCase();
            return n || (i = gt[o], gt[o] = r, r = null != a(e, t, n) ? o : null, gt[o] = i), r
        }
    });
    var vt = /^(?:input|select|textarea|button)$/i, yt = /^(?:a|area)$/i;

    function mt(e) {
        return (e.match(R) || []).join(" ")
    }

    function xt(e) {
        return e.getAttribute && e.getAttribute("class") || ""
    }

    function bt(e) {
        return Array.isArray(e) ? e : "string" == typeof e && e.match(R) || []
    }

    k.fn.extend({
        prop: function (e, t) {
            return _(this, k.prop, e, t, 1 < arguments.length)
        }, removeProp: function (e) {
            return this.each(function () {
                delete this[k.propFix[e] || e]
            })
        }
    }), k.extend({
        prop: function (e, t, n) {
            var r, i, o = e.nodeType;
            if (3 !== o && 8 !== o && 2 !== o) return 1 === o && k.isXMLDoc(e) || (t = k.propFix[t] || t, i = k.propHooks[t]), void 0 !== n ? i && "set" in i && void 0 !== (r = i.set(e, n, t)) ? r : e[t] = n : i && "get" in i && null !== (r = i.get(e, t)) ? r : e[t]
        }, propHooks: {
            tabIndex: {
                get: function (e) {
                    var t = k.find.attr(e, "tabindex");
                    return t ? parseInt(t, 10) : vt.test(e.nodeName) || yt.test(e.nodeName) && e.href ? 0 : -1
                }
            }
        }, propFix: {"for": "htmlFor", "class": "className"}
    }), y.optSelected || (k.propHooks.selected = {
        get: function (e) {
            var t = e.parentNode;
            return t && t.parentNode && t.parentNode.selectedIndex, null
        }, set: function (e) {
            var t = e.parentNode;
            t && (t.selectedIndex, t.parentNode && t.parentNode.selectedIndex)
        }
    }), k.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
        k.propFix[this.toLowerCase()] = this
    }), k.fn.extend({
        addClass: function (t) {
            var e, n, r, i, o, a, s, u = 0;
            if (m(t)) return this.each(function (e) {
                k(this).addClass(t.call(this, e, xt(this)))
            });
            if ((e = bt(t)).length) while (n = this[u++]) if (i = xt(n), r = 1 === n.nodeType && " " + mt(i) + " ") {
                a = 0;
                while (o = e[a++]) r.indexOf(" " + o + " ") < 0 && (r += o + " ");
                i !== (s = mt(r)) && n.setAttribute("class", s)
            }
            return this
        }, removeClass: function (t) {
            var e, n, r, i, o, a, s, u = 0;
            if (m(t)) return this.each(function (e) {
                k(this).removeClass(t.call(this, e, xt(this)))
            });
            if (!arguments.length) return this.attr("class", "");
            if ((e = bt(t)).length) while (n = this[u++]) if (i = xt(n), r = 1 === n.nodeType && " " + mt(i) + " ") {
                a = 0;
                while (o = e[a++]) while (-1 < r.indexOf(" " + o + " ")) r = r.replace(" " + o + " ", " ");
                i !== (s = mt(r)) && n.setAttribute("class", s)
            }
            return this
        }, toggleClass: function (i, t) {
            var o = typeof i, a = "string" === o || Array.isArray(i);
            return "boolean" == typeof t && a ? t ? this.addClass(i) : this.removeClass(i) : m(i) ? this.each(function (e) {
                k(this).toggleClass(i.call(this, e, xt(this), t), t)
            }) : this.each(function () {
                var e, t, n, r;
                if (a) {
                    t = 0, n = k(this), r = bt(i);
                    while (e = r[t++]) n.hasClass(e) ? n.removeClass(e) : n.addClass(e)
                } else void 0 !== i && "boolean" !== o || ((e = xt(this)) && Q.set(this, "__className__", e), this.setAttribute && this.setAttribute("class", e || !1 === i ? "" : Q.get(this, "__className__") || ""))
            })
        }, hasClass: function (e) {
            var t, n, r = 0;
            t = " " + e + " ";
            while (n = this[r++]) if (1 === n.nodeType && -1 < (" " + mt(xt(n)) + " ").indexOf(t)) return !0;
            return !1
        }
    });
    var wt = /\r/g;
    k.fn.extend({
        val: function (n) {
            var r, e, i, t = this[0];
            return arguments.length ? (i = m(n), this.each(function (e) {
                var t;
                1 === this.nodeType && (null == (t = i ? n.call(this, e, k(this).val()) : n) ? t = "" : "number" == typeof t ? t += "" : Array.isArray(t) && (t = k.map(t, function (e) {
                    return null == e ? "" : e + ""
                })), (r = k.valHooks[this.type] || k.valHooks[this.nodeName.toLowerCase()]) && "set" in r && void 0 !== r.set(this, t, "value") || (this.value = t))
            })) : t ? (r = k.valHooks[t.type] || k.valHooks[t.nodeName.toLowerCase()]) && "get" in r && void 0 !== (e = r.get(t, "value")) ? e : "string" == typeof (e = t.value) ? e.replace(wt, "") : null == e ? "" : e : void 0
        }
    }), k.extend({
        valHooks: {
            option: {
                get: function (e) {
                    var t = k.find.attr(e, "value");
                    return null != t ? t : mt(k.text(e))
                }
            }, select: {
                get: function (e) {
                    var t, n, r, i = e.options, o = e.selectedIndex, a = "select-one" === e.type, s = a ? null : [],
                        u = a ? o + 1 : i.length;
                    for (r = o < 0 ? u : a ? o : 0; r < u; r++) if (((n = i[r]).selected || r === o) && !n.disabled && (!n.parentNode.disabled || !A(n.parentNode, "optgroup"))) {
                        if (t = k(n).val(), a) return t;
                        s.push(t)
                    }
                    return s
                }, set: function (e, t) {
                    var n, r, i = e.options, o = k.makeArray(t), a = i.length;
                    while (a--) ((r = i[a]).selected = -1 < k.inArray(k.valHooks.option.get(r), o)) && (n = !0);
                    return n || (e.selectedIndex = -1), o
                }
            }
        }
    }), k.each(["radio", "checkbox"], function () {
        k.valHooks[this] = {
            set: function (e, t) {
                if (Array.isArray(t)) return e.checked = -1 < k.inArray(k(e).val(), t)
            }
        }, y.checkOn || (k.valHooks[this].get = function (e) {
            return null === e.getAttribute("value") ? "on" : e.value
        })
    }), y.focusin = "onfocusin" in C;
    var Tt = /^(?:focusinfocus|focusoutblur)$/, Ct = function (e) {
        e.stopPropagation()
    };
    k.extend(k.event, {
        trigger: function (e, t, n, r) {
            var i, o, a, s, u, l, c, f, p = [n || E], d = v.call(e, "type") ? e.type : e,
                h = v.call(e, "namespace") ? e.namespace.split(".") : [];
            if (o = f = a = n = n || E, 3 !== n.nodeType && 8 !== n.nodeType && !Tt.test(d + k.event.triggered) && (-1 < d.indexOf(".") && (d = (h = d.split(".")).shift(), h.sort()), u = d.indexOf(":") < 0 && "on" + d, (e = e[k.expando] ? e : new k.Event(d, "object" == typeof e && e)).isTrigger = r ? 2 : 3, e.namespace = h.join("."), e.rnamespace = e.namespace ? new RegExp("(^|\\.)" + h.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, e.result = void 0, e.target || (e.target = n), t = null == t ? [e] : k.makeArray(t, [e]), c = k.event.special[d] || {}, r || !c.trigger || !1 !== c.trigger.apply(n, t))) {
                if (!r && !c.noBubble && !x(n)) {
                    for (s = c.delegateType || d, Tt.test(s + d) || (o = o.parentNode); o; o = o.parentNode) p.push(o), a = o;
                    a === (n.ownerDocument || E) && p.push(a.defaultView || a.parentWindow || C)
                }
                i = 0;
                while ((o = p[i++]) && !e.isPropagationStopped()) f = o, e.type = 1 < i ? s : c.bindType || d, (l = (Q.get(o, "events") || {})[e.type] && Q.get(o, "handle")) && l.apply(o, t), (l = u && o[u]) && l.apply && G(o) && (e.result = l.apply(o, t), !1 === e.result && e.preventDefault());
                return e.type = d, r || e.isDefaultPrevented() || c._default && !1 !== c._default.apply(p.pop(), t) || !G(n) || u && m(n[d]) && !x(n) && ((a = n[u]) && (n[u] = null), k.event.triggered = d, e.isPropagationStopped() && f.addEventListener(d, Ct), n[d](), e.isPropagationStopped() && f.removeEventListener(d, Ct), k.event.triggered = void 0, a && (n[u] = a)), e.result
            }
        }, simulate: function (e, t, n) {
            var r = k.extend(new k.Event, n, {type: e, isSimulated: !0});
            k.event.trigger(r, null, t)
        }
    }), k.fn.extend({
        trigger: function (e, t) {
            return this.each(function () {
                k.event.trigger(e, t, this)
            })
        }, triggerHandler: function (e, t) {
            var n = this[0];
            if (n) return k.event.trigger(e, t, n, !0)
        }
    }), y.focusin || k.each({focus: "focusin", blur: "focusout"}, function (n, r) {
        var i = function (e) {
            k.event.simulate(r, e.target, k.event.fix(e))
        };
        k.event.special[r] = {
            setup: function () {
                var e = this.ownerDocument || this, t = Q.access(e, r);
                t || e.addEventListener(n, i, !0), Q.access(e, r, (t || 0) + 1)
            }, teardown: function () {
                var e = this.ownerDocument || this, t = Q.access(e, r) - 1;
                t ? Q.access(e, r, t) : (e.removeEventListener(n, i, !0), Q.remove(e, r))
            }
        }
    });
    var Et = C.location, kt = Date.now(), St = /\?/;
    k.parseXML = function (e) {
        var t;
        if (!e || "string" != typeof e) return null;
        try {
            t = (new C.DOMParser).parseFromString(e, "text/xml")
        } catch (e) {
            t = void 0
        }
        return t && !t.getElementsByTagName("parsererror").length || k.error("Invalid XML: " + e), t
    };
    var Nt = /\[\]$/, At = /\r?\n/g, Dt = /^(?:submit|button|image|reset|file)$/i,
        jt = /^(?:input|select|textarea|keygen)/i;

    function qt(n, e, r, i) {
        var t;
        if (Array.isArray(e)) k.each(e, function (e, t) {
            r || Nt.test(n) ? i(n, t) : qt(n + "[" + ("object" == typeof t && null != t ? e : "") + "]", t, r, i)
        }); else if (r || "object" !== w(e)) i(n, e); else for (t in e) qt(n + "[" + t + "]", e[t], r, i)
    }

    k.param = function (e, t) {
        var n, r = [], i = function (e, t) {
            var n = m(t) ? t() : t;
            r[r.length] = encodeURIComponent(e) + "=" + encodeURIComponent(null == n ? "" : n)
        };
        if (null == e) return "";
        if (Array.isArray(e) || e.jquery && !k.isPlainObject(e)) k.each(e, function () {
            i(this.name, this.value)
        }); else for (n in e) qt(n, e[n], t, i);
        return r.join("&")
    }, k.fn.extend({
        serialize: function () {
            return k.param(this.serializeArray())
        }, serializeArray: function () {
            return this.map(function () {
                var e = k.prop(this, "elements");
                return e ? k.makeArray(e) : this
            }).filter(function () {
                var e = this.type;
                return this.name && !k(this).is(":disabled") && jt.test(this.nodeName) && !Dt.test(e) && (this.checked || !pe.test(e))
            }).map(function (e, t) {
                var n = k(this).val();
                return null == n ? null : Array.isArray(n) ? k.map(n, function (e) {
                    return {name: t.name, value: e.replace(At, "\r\n")}
                }) : {name: t.name, value: n.replace(At, "\r\n")}
            }).get()
        }
    });
    var Lt = /%20/g, Ht = /#.*$/, Ot = /([?&])_=[^&]*/, Pt = /^(.*?):[ \t]*([^\r\n]*)$/gm, Rt = /^(?:GET|HEAD)$/,
        Mt = /^\/\//, It = {}, Wt = {}, $t = "*/".concat("*"), Ft = E.createElement("a");

    function Bt(o) {
        return function (e, t) {
            "string" != typeof e && (t = e, e = "*");
            var n, r = 0, i = e.toLowerCase().match(R) || [];
            if (m(t)) while (n = i[r++]) "+" === n[0] ? (n = n.slice(1) || "*", (o[n] = o[n] || []).unshift(t)) : (o[n] = o[n] || []).push(t)
        }
    }

    function _t(t, i, o, a) {
        var s = {}, u = t === Wt;

        function l(e) {
            var r;
            return s[e] = !0, k.each(t[e] || [], function (e, t) {
                var n = t(i, o, a);
                return "string" != typeof n || u || s[n] ? u ? !(r = n) : void 0 : (i.dataTypes.unshift(n), l(n), !1)
            }), r
        }

        return l(i.dataTypes[0]) || !s["*"] && l("*")
    }

    function zt(e, t) {
        var n, r, i = k.ajaxSettings.flatOptions || {};
        for (n in t) void 0 !== t[n] && ((i[n] ? e : r || (r = {}))[n] = t[n]);
        return r && k.extend(!0, e, r), e
    }

    Ft.href = Et.href, k.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
            url: Et.href,
            type: "GET",
            isLocal: /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(Et.protocol),
            global: !0,
            processData: !0,
            async: !0,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            accepts: {
                "*": $t,
                text: "text/plain",
                html: "text/html",
                xml: "application/xml, text/xml",
                json: "application/json, text/javascript"
            },
            contents: {xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/},
            responseFields: {xml: "responseXML", text: "responseText", json: "responseJSON"},
            converters: {"* text": String, "text html": !0, "text json": JSON.parse, "text xml": k.parseXML},
            flatOptions: {url: !0, context: !0}
        },
        ajaxSetup: function (e, t) {
            return t ? zt(zt(e, k.ajaxSettings), t) : zt(k.ajaxSettings, e)
        },
        ajaxPrefilter: Bt(It),
        ajaxTransport: Bt(Wt),
        ajax: function (e, t) {
            "object" == typeof e && (t = e, e = void 0), t = t || {};
            var c, f, p, n, d, r, h, g, i, o, v = k.ajaxSetup({}, t), y = v.context || v,
                m = v.context && (y.nodeType || y.jquery) ? k(y) : k.event, x = k.Deferred(),
                b = k.Callbacks("once memory"), w = v.statusCode || {}, a = {}, s = {}, u = "canceled", T = {
                    readyState: 0, getResponseHeader: function (e) {
                        var t;
                        if (h) {
                            if (!n) {
                                n = {};
                                while (t = Pt.exec(p)) n[t[1].toLowerCase() + " "] = (n[t[1].toLowerCase() + " "] || []).concat(t[2])
                            }
                            t = n[e.toLowerCase() + " "]
                        }
                        return null == t ? null : t.join(", ")
                    }, getAllResponseHeaders: function () {
                        return h ? p : null
                    }, setRequestHeader: function (e, t) {
                        return null == h && (e = s[e.toLowerCase()] = s[e.toLowerCase()] || e, a[e] = t), this
                    }, overrideMimeType: function (e) {
                        return null == h && (v.mimeType = e), this
                    }, statusCode: function (e) {
                        var t;
                        if (e) if (h) T.always(e[T.status]); else for (t in e) w[t] = [w[t], e[t]];
                        return this
                    }, abort: function (e) {
                        var t = e || u;
                        return c && c.abort(t), l(0, t), this
                    }
                };
            if (x.promise(T), v.url = ((e || v.url || Et.href) + "").replace(Mt, Et.protocol + "//"), v.type = t.method || t.type || v.method || v.type, v.dataTypes = (v.dataType || "*").toLowerCase().match(R) || [""], null == v.crossDomain) {
                r = E.createElement("a");
                try {
                    r.href = v.url, r.href = r.href, v.crossDomain = Ft.protocol + "//" + Ft.host != r.protocol + "//" + r.host
                } catch (e) {
                    v.crossDomain = !0
                }
            }
            if (v.data && v.processData && "string" != typeof v.data && (v.data = k.param(v.data, v.traditional)), _t(It, v, t, T), h) return T;
            for (i in (g = k.event && v.global) && 0 == k.active++ && k.event.trigger("ajaxStart"), v.type = v.type.toUpperCase(), v.hasContent = !Rt.test(v.type), f = v.url.replace(Ht, ""), v.hasContent ? v.data && v.processData && 0 === (v.contentType || "").indexOf("application/x-www-form-urlencoded") && (v.data = v.data.replace(Lt, "+")) : (o = v.url.slice(f.length), v.data && (v.processData || "string" == typeof v.data) && (f += (St.test(f) ? "&" : "?") + v.data, delete v.data), !1 === v.cache && (f = f.replace(Ot, "$1"), o = (St.test(f) ? "&" : "?") + "_=" + kt++ + o), v.url = f + o), v.ifModified && (k.lastModified[f] && T.setRequestHeader("If-Modified-Since", k.lastModified[f]), k.etag[f] && T.setRequestHeader("If-None-Match", k.etag[f])), (v.data && v.hasContent && !1 !== v.contentType || t.contentType) && T.setRequestHeader("Content-Type", v.contentType), T.setRequestHeader("Accept", v.dataTypes[0] && v.accepts[v.dataTypes[0]] ? v.accepts[v.dataTypes[0]] + ("*" !== v.dataTypes[0] ? ", " + $t + "; q=0.01" : "") : v.accepts["*"]), v.headers) T.setRequestHeader(i, v.headers[i]);
            if (v.beforeSend && (!1 === v.beforeSend.call(y, T, v) || h)) return T.abort();
            if (u = "abort", b.add(v.complete), T.done(v.success), T.fail(v.error), c = _t(Wt, v, t, T)) {
                if (T.readyState = 1, g && m.trigger("ajaxSend", [T, v]), h) return T;
                v.async && 0 < v.timeout && (d = C.setTimeout(function () {
                    T.abort("timeout")
                }, v.timeout));
                try {
                    h = !1, c.send(a, l)
                } catch (e) {
                    if (h) throw e;
                    l(-1, e)
                }
            } else l(-1, "No Transport");

            function l(e, t, n, r) {
                var i, o, a, s, u, l = t;
                h || (h = !0, d && C.clearTimeout(d), c = void 0, p = r || "", T.readyState = 0 < e ? 4 : 0, i = 200 <= e && e < 300 || 304 === e, n && (s = function (e, t, n) {
                    var r, i, o, a, s = e.contents, u = e.dataTypes;
                    while ("*" === u[0]) u.shift(), void 0 === r && (r = e.mimeType || t.getResponseHeader("Content-Type"));
                    if (r) for (i in s) if (s[i] && s[i].test(r)) {
                        u.unshift(i);
                        break
                    }
                    if (u[0] in n) o = u[0]; else {
                        for (i in n) {
                            if (!u[0] || e.converters[i + " " + u[0]]) {
                                o = i;
                                break
                            }
                            a || (a = i)
                        }
                        o = o || a
                    }
                    if (o) return o !== u[0] && u.unshift(o), n[o]
                }(v, T, n)), s = function (e, t, n, r) {
                    var i, o, a, s, u, l = {}, c = e.dataTypes.slice();
                    if (c[1]) for (a in e.converters) l[a.toLowerCase()] = e.converters[a];
                    o = c.shift();
                    while (o) if (e.responseFields[o] && (n[e.responseFields[o]] = t), !u && r && e.dataFilter && (t = e.dataFilter(t, e.dataType)), u = o, o = c.shift()) if ("*" === o) o = u; else if ("*" !== u && u !== o) {
                        if (!(a = l[u + " " + o] || l["* " + o])) for (i in l) if ((s = i.split(" "))[1] === o && (a = l[u + " " + s[0]] || l["* " + s[0]])) {
                            !0 === a ? a = l[i] : !0 !== l[i] && (o = s[0], c.unshift(s[1]));
                            break
                        }
                        if (!0 !== a) if (a && e["throws"]) t = a(t); else try {
                            t = a(t)
                        } catch (e) {
                            return {state: "parsererror", error: a ? e : "No conversion from " + u + " to " + o}
                        }
                    }
                    return {state: "success", data: t}
                }(v, s, T, i), i ? (v.ifModified && ((u = T.getResponseHeader("Last-Modified")) && (k.lastModified[f] = u), (u = T.getResponseHeader("etag")) && (k.etag[f] = u)), 204 === e || "HEAD" === v.type ? l = "nocontent" : 304 === e ? l = "notmodified" : (l = s.state, o = s.data, i = !(a = s.error))) : (a = l, !e && l || (l = "error", e < 0 && (e = 0))), T.status = e, T.statusText = (t || l) + "", i ? x.resolveWith(y, [o, l, T]) : x.rejectWith(y, [T, l, a]), T.statusCode(w), w = void 0, g && m.trigger(i ? "ajaxSuccess" : "ajaxError", [T, v, i ? o : a]), b.fireWith(y, [T, l]), g && (m.trigger("ajaxComplete", [T, v]), --k.active || k.event.trigger("ajaxStop")))
            }

            return T
        },
        getJSON: function (e, t, n) {
            return k.get(e, t, n, "json")
        },
        getScript: function (e, t) {
            return k.get(e, void 0, t, "script")
        }
    }), k.each(["get", "post"], function (e, i) {
        k[i] = function (e, t, n, r) {
            return m(t) && (r = r || n, n = t, t = void 0), k.ajax(k.extend({
                url: e,
                type: i,
                dataType: r,
                data: t,
                success: n
            }, k.isPlainObject(e) && e))
        }
    }), k._evalUrl = function (e, t) {
        return k.ajax({
            url: e,
            type: "GET",
            dataType: "script",
            cache: !0,
            async: !1,
            global: !1,
            converters: {
                "text script": function () {
                }
            },
            dataFilter: function (e) {
                k.globalEval(e, t)
            }
        })
    }, k.fn.extend({
        wrapAll: function (e) {
            var t;
            return this[0] && (m(e) && (e = e.call(this[0])), t = k(e, this[0].ownerDocument).eq(0).clone(!0), this[0].parentNode && t.insertBefore(this[0]), t.map(function () {
                var e = this;
                while (e.firstElementChild) e = e.firstElementChild;
                return e
            }).append(this)), this
        }, wrapInner: function (n) {
            return m(n) ? this.each(function (e) {
                k(this).wrapInner(n.call(this, e))
            }) : this.each(function () {
                var e = k(this), t = e.contents();
                t.length ? t.wrapAll(n) : e.append(n)
            })
        }, wrap: function (t) {
            var n = m(t);
            return this.each(function (e) {
                k(this).wrapAll(n ? t.call(this, e) : t)
            })
        }, unwrap: function (e) {
            return this.parent(e).not("body").each(function () {
                k(this).replaceWith(this.childNodes)
            }), this
        }
    }), k.expr.pseudos.hidden = function (e) {
        return !k.expr.pseudos.visible(e)
    }, k.expr.pseudos.visible = function (e) {
        return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length)
    }, k.ajaxSettings.xhr = function () {
        try {
            return new C.XMLHttpRequest
        } catch (e) {
        }
    };
    var Ut = {0: 200, 1223: 204}, Xt = k.ajaxSettings.xhr();
    y.cors = !!Xt && "withCredentials" in Xt, y.ajax = Xt = !!Xt, k.ajaxTransport(function (i) {
        var o, a;
        if (y.cors || Xt && !i.crossDomain) return {
            send: function (e, t) {
                var n, r = i.xhr();
                if (r.open(i.type, i.url, i.async, i.username, i.password), i.xhrFields) for (n in i.xhrFields) r[n] = i.xhrFields[n];
                for (n in i.mimeType && r.overrideMimeType && r.overrideMimeType(i.mimeType), i.crossDomain || e["X-Requested-With"] || (e["X-Requested-With"] = "XMLHttpRequest"), e) r.setRequestHeader(n, e[n]);
                o = function (e) {
                    return function () {
                        o && (o = a = r.onload = r.onerror = r.onabort = r.ontimeout = r.onreadystatechange = null, "abort" === e ? r.abort() : "error" === e ? "number" != typeof r.status ? t(0, "error") : t(r.status, r.statusText) : t(Ut[r.status] || r.status, r.statusText, "text" !== (r.responseType || "text") || "string" != typeof r.responseText ? {binary: r.response} : {text: r.responseText}, r.getAllResponseHeaders()))
                    }
                }, r.onload = o(), a = r.onerror = r.ontimeout = o("error"), void 0 !== r.onabort ? r.onabort = a : r.onreadystatechange = function () {
                    4 === r.readyState && C.setTimeout(function () {
                        o && a()
                    })
                }, o = o("abort");
                try {
                    r.send(i.hasContent && i.data || null)
                } catch (e) {
                    if (o) throw e
                }
            }, abort: function () {
                o && o()
            }
        }
    }), k.ajaxPrefilter(function (e) {
        e.crossDomain && (e.contents.script = !1)
    }), k.ajaxSetup({
        accepts: {script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},
        contents: {script: /\b(?:java|ecma)script\b/},
        converters: {
            "text script": function (e) {
                return k.globalEval(e), e
            }
        }
    }), k.ajaxPrefilter("script", function (e) {
        void 0 === e.cache && (e.cache = !1), e.crossDomain && (e.type = "GET")
    }), k.ajaxTransport("script", function (n) {
        var r, i;
        if (n.crossDomain || n.scriptAttrs) return {
            send: function (e, t) {
                r = k("<script>").attr(n.scriptAttrs || {}).prop({
                    charset: n.scriptCharset,
                    src: n.url
                }).on("load error", i = function (e) {
                    r.remove(), i = null, e && t("error" === e.type ? 404 : 200, e.type)
                }), E.head.appendChild(r[0])
            }, abort: function () {
                i && i()
            }
        }
    });
    var Vt, Gt = [], Yt = /(=)\?(?=&|$)|\?\?/;
    k.ajaxSetup({
        jsonp: "callback", jsonpCallback: function () {
            var e = Gt.pop() || k.expando + "_" + kt++;
            return this[e] = !0, e
        }
    }), k.ajaxPrefilter("json jsonp", function (e, t, n) {
        var r, i, o,
            a = !1 !== e.jsonp && (Yt.test(e.url) ? "url" : "string" == typeof e.data && 0 === (e.contentType || "").indexOf("application/x-www-form-urlencoded") && Yt.test(e.data) && "data");
        if (a || "jsonp" === e.dataTypes[0]) return r = e.jsonpCallback = m(e.jsonpCallback) ? e.jsonpCallback() : e.jsonpCallback, a ? e[a] = e[a].replace(Yt, "$1" + r) : !1 !== e.jsonp && (e.url += (St.test(e.url) ? "&" : "?") + e.jsonp + "=" + r), e.converters["script json"] = function () {
            return o || k.error(r + " was not called"), o[0]
        }, e.dataTypes[0] = "json", i = C[r], C[r] = function () {
            o = arguments
        }, n.always(function () {
            void 0 === i ? k(C).removeProp(r) : C[r] = i, e[r] && (e.jsonpCallback = t.jsonpCallback, Gt.push(r)), o && m(i) && i(o[0]), o = i = void 0
        }), "script"
    }), y.createHTMLDocument = ((Vt = E.implementation.createHTMLDocument("").body).innerHTML = "<form></form><form></form>", 2 === Vt.childNodes.length), k.parseHTML = function (e, t, n) {
        return "string" != typeof e ? [] : ("boolean" == typeof t && (n = t, t = !1), t || (y.createHTMLDocument ? ((r = (t = E.implementation.createHTMLDocument("")).createElement("base")).href = E.location.href, t.head.appendChild(r)) : t = E), o = !n && [], (i = D.exec(e)) ? [t.createElement(i[1])] : (i = we([e], t, o), o && o.length && k(o).remove(), k.merge([], i.childNodes)));
        var r, i, o
    }, k.fn.load = function (e, t, n) {
        var r, i, o, a = this, s = e.indexOf(" ");
        return -1 < s && (r = mt(e.slice(s)), e = e.slice(0, s)), m(t) ? (n = t, t = void 0) : t && "object" == typeof t && (i = "POST"), 0 < a.length && k.ajax({
            url: e,
            type: i || "GET",
            dataType: "html",
            data: t
        }).done(function (e) {
            o = arguments, a.html(r ? k("<div>").append(k.parseHTML(e)).find(r) : e)
        }).always(n && function (e, t) {
            a.each(function () {
                n.apply(this, o || [e.responseText, t, e])
            })
        }), this
    }, k.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (e, t) {
        k.fn[t] = function (e) {
            return this.on(t, e)
        }
    }), k.expr.pseudos.animated = function (t) {
        return k.grep(k.timers, function (e) {
            return t === e.elem
        }).length
    }, k.offset = {
        setOffset: function (e, t, n) {
            var r, i, o, a, s, u, l = k.css(e, "position"), c = k(e), f = {};
            "static" === l && (e.style.position = "relative"), s = c.offset(), o = k.css(e, "top"), u = k.css(e, "left"), ("absolute" === l || "fixed" === l) && -1 < (o + u).indexOf("auto") ? (a = (r = c.position()).top, i = r.left) : (a = parseFloat(o) || 0, i = parseFloat(u) || 0), m(t) && (t = t.call(e, n, k.extend({}, s))), null != t.top && (f.top = t.top - s.top + a), null != t.left && (f.left = t.left - s.left + i), "using" in t ? t.using.call(e, f) : c.css(f)
        }
    }, k.fn.extend({
        offset: function (t) {
            if (arguments.length) return void 0 === t ? this : this.each(function (e) {
                k.offset.setOffset(this, t, e)
            });
            var e, n, r = this[0];
            return r ? r.getClientRects().length ? (e = r.getBoundingClientRect(), n = r.ownerDocument.defaultView, {
                top: e.top + n.pageYOffset,
                left: e.left + n.pageXOffset
            }) : {top: 0, left: 0} : void 0
        }, position: function () {
            if (this[0]) {
                var e, t, n, r = this[0], i = {top: 0, left: 0};
                if ("fixed" === k.css(r, "position")) t = r.getBoundingClientRect(); else {
                    t = this.offset(), n = r.ownerDocument, e = r.offsetParent || n.documentElement;
                    while (e && (e === n.body || e === n.documentElement) && "static" === k.css(e, "position")) e = e.parentNode;
                    e && e !== r && 1 === e.nodeType && ((i = k(e).offset()).top += k.css(e, "borderTopWidth", !0), i.left += k.css(e, "borderLeftWidth", !0))
                }
                return {
                    top: t.top - i.top - k.css(r, "marginTop", !0),
                    left: t.left - i.left - k.css(r, "marginLeft", !0)
                }
            }
        }, offsetParent: function () {
            return this.map(function () {
                var e = this.offsetParent;
                while (e && "static" === k.css(e, "position")) e = e.offsetParent;
                return e || ie
            })
        }
    }), k.each({scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function (t, i) {
        var o = "pageYOffset" === i;
        k.fn[t] = function (e) {
            return _(this, function (e, t, n) {
                var r;
                if (x(e) ? r = e : 9 === e.nodeType && (r = e.defaultView), void 0 === n) return r ? r[i] : e[t];
                r ? r.scrollTo(o ? r.pageXOffset : n, o ? n : r.pageYOffset) : e[t] = n
            }, t, e, arguments.length)
        }
    }), k.each(["top", "left"], function (e, n) {
        k.cssHooks[n] = ze(y.pixelPosition, function (e, t) {
            if (t) return t = _e(e, n), $e.test(t) ? k(e).position()[n] + "px" : t
        })
    }), k.each({Height: "height", Width: "width"}, function (a, s) {
        k.each({padding: "inner" + a, content: s, "": "outer" + a}, function (r, o) {
            k.fn[o] = function (e, t) {
                var n = arguments.length && (r || "boolean" != typeof e),
                    i = r || (!0 === e || !0 === t ? "margin" : "border");
                return _(this, function (e, t, n) {
                    var r;
                    return x(e) ? 0 === o.indexOf("outer") ? e["inner" + a] : e.document.documentElement["client" + a] : 9 === e.nodeType ? (r = e.documentElement, Math.max(e.body["scroll" + a], r["scroll" + a], e.body["offset" + a], r["offset" + a], r["client" + a])) : void 0 === n ? k.css(e, t, i) : k.style(e, t, n, i)
                }, s, n ? e : void 0, n)
            }
        })
    }), k.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function (e, n) {
        k.fn[n] = function (e, t) {
            return 0 < arguments.length ? this.on(n, null, e, t) : this.trigger(n)
        }
    }), k.fn.extend({
        hover: function (e, t) {
            return this.mouseenter(e).mouseleave(t || e)
        }
    }), k.fn.extend({
        bind: function (e, t, n) {
            return this.on(e, null, t, n)
        }, unbind: function (e, t) {
            return this.off(e, null, t)
        }, delegate: function (e, t, n, r) {
            return this.on(t, e, n, r)
        }, undelegate: function (e, t, n) {
            return 1 === arguments.length ? this.off(e, "**") : this.off(t, e || "**", n)
        }
    }), k.proxy = function (e, t) {
        var n, r, i;
        if ("string" == typeof t && (n = e[t], t = e, e = n), m(e)) return r = s.call(arguments, 2), (i = function () {
            return e.apply(t || this, r.concat(s.call(arguments)))
        }).guid = e.guid = e.guid || k.guid++, i
    }, k.holdReady = function (e) {
        e ? k.readyWait++ : k.ready(!0)
    }, k.isArray = Array.isArray, k.parseJSON = JSON.parse, k.nodeName = A, k.isFunction = m, k.isWindow = x, k.camelCase = V, k.type = w, k.now = Date.now, k.isNumeric = function (e) {
        var t = k.type(e);
        return ("number" === t || "string" === t) && !isNaN(e - parseFloat(e))
    }, "function" == typeof define && define.amd && define("jquery", [], function () {
        return k
    });
    var Qt = C.jQuery, Jt = C.$;
    return k.noConflict = function (e) {
        return C.$ === k && (C.$ = Jt), e && C.jQuery === k && (C.jQuery = Qt), k
    }, e || (C.jQuery = C.$ = k), k
});

//////MaxNoResultT////////////////
var FileNr = 0;
var Experimentdata = null;
var GazeCloudSesion = null;
var vMediaGazeData = [];
var CurMediaGazeData = null;
var StartMediaTime = Date.now();
var StartExperiment = Date.now();
////////////////
//---------------------------------------------
function InitDB() {

    if (false) //check
    {
        if (typeof window.GetRunStudyData === 'undefined') {

            try {
                var tag = document.createElement('script');
                tag.src = "../StudyAPI.js?v=1.32err";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } catch (yy) {
                ;
            }

            setTimeout(function () {
                GazeCloudLogs += 'InitDB scritp reload;';
                InitDB();

            }, 1000);
        }

    }

    try {
        var url = new URL(window.location.href);
        var StudyID = url.searchParams.get("StudyID");

        if (StudyID == null)
            window.location.href = './NoActive.html';

        if (StudyID != null) GetRunStudyData(StudyID, function (data) {
            Experimentdata = data;

            try {
                if (bAutoStart)
                    StartClick();
            } catch (eee) {
            }

            setTimeout(function () {
                PreLoadMedia();
            }, 2000);

        })
    } catch (eee) {
        GazeCloudLogs += 'InitDB err;';
    }
}

//----------------------------------

var ErrImgC = 0;

function LoadErrImg(o) {
    ErrImgC++;
    //o.currentTarget.onerror = null;

    setTimeout(function () {
        ErrImgC++;
        //o.currentTarget.src = o.currentTarget.src+ '&err=' + ErrImgC ;

        o.src = o.src + '&err=' + ErrImgC;

    }, 1000);
}

//---------------------------------------------
var MediaTab = [];

var PreLoadStarted = false;

function PreLoadMedia() {

    if (PreLoadStarted) return;
    PreLoadStarted = true;
    try {

        //-----------youtube----------------------
        if (Experimentdata.type == 3) {
            var YouTubeVideoID = Experimentdata.files[0];
            //   PreLoadYouTube(YouTubeVideoID);

            VideoId = YouTubeVideoID;
            setTimeout(function () {
                var YouTubeVideoID = Experimentdata.files[0];
                PreLoadYouTube(YouTubeVideoID);

            }, 5000);


//////////////

            onVideoPlayErr = function (a) {
                bLoadMediFail = true;
                GazeCloudLogs += VidoLog;

                RunState = 'loaderr';
                GazeCloudLogs += RunState + ';';
                RunCode = -30;

                FinishExperiment();


                alert("Loading Video fail! Try Again.");

                if (true) //reload
                {
                    var url = new URL(window.location.href);
                    var reload = url.searchParams.get("reload");

                    if (reload == null)
                        setTimeout(function () {
                            ExerimentCompleted = true;
                            redirect = window.location.href + '&reload=1';
                            window.location.href = redirect;

                        }, 1000);
                }

            }


            //////////////////////
            onPlayViedoStarted = function () {
                GazeCloudLogs += 'PlayViedoStarted;';
                RunCode = 1;
                _Rec('');

                if (true) //end rec limit
                {
                    setTimeout(CheckEndTime, 1000 * Experimentdata.maxduration);
                }
                NewMedia(); // tmp
                //todo hide loading video
            } ////////////////////////

            OnYouTubeVideoEnd = function () {

                RunState = 'finish';
                RunCode = 3;
                FinishExperiment();
            };

            OnVideoPreloadFail = function () {
                GazeCloudLogs += ' OnVideoPreloadFail;';

            };


////////////////////////


        }

        //-----------slide img---------------------
        if (Experimentdata.type == 1) {
            var html = '';
            for (i = 0; i < Experimentdata.files.length; i++) {
                var MediaGUID = Experimentdata.files[i];
                html += '<img onerror="LoadErrImg(this)" id = "imgid' + i + '" src="' + GetMediaUrl(MediaGUID) + '" style="display:none"  >';
            }
            document.getElementById("divslideimgid").innerHTML = html;

            setTimeout(function () {

                for (i = 0; i < Experimentdata.files.length; i++) {
                    MediaTab.push(document.getElementById("imgid" + i));
                }

            }, 300);
        }
    } catch (ee) {
        GazeCloudLogs += 'PreLoadMedia exeption;';
    }
}

//---------------------------------------------
function FitImgSize() {
    document.getElementById("RefreshHeatMapId").value = FileNr;
    window.scroll({
        top: 0,
        left: 0,
    });
    var img = MediaTab[FileNr];
    if (img == null) return;
    var body = document.body;
    html = document.documentElement;
    var w = img.width;
    var h = img.height;
    img.style = "padding: 0; width: 100%; height:100%;position:absolute;  left:50%; top:0% ; transform: translate(-50%, 0%);";
    if (w / h > window.innerWidth / window.innerHeight) {
        img.style.width = '100%';
        img.style.height = 'auto';
    } else {
        img.style.width = 'auto';
        img.style.height = '100%';
    }
}

//---------------------------------------------
function LoadMedia() {
    try {
        if (FileNr > Experimentdata.files.lenght - 1) return;
        if (Experimentdata.type == 1) {
            if (false) {
                var MediIx = Experimentdata.files[FileNr];
                document.getElementById("imgid").src = GetMediaUrl(MediIx);
            }
            if (FileNr > 0)
                //MediaTab[FileNr].hide();
                //MediaTab[FileNr-1].style = "dispaly:none";
                MediaTab[FileNr - 1].remove()
            FitImgSize();
        }
    } catch (ee) {
    }
}

//---------------------------------------------
///////////////Save Gaze Data//////////////

var ExperimentIsRunning = false;
var GoodPointsCount = 0;
var iframedoc = null;
var iframewin = null;
var MaxVideoT = 0;
var LastResultT = -1;
var MaxNoResultT = 0;
var LastResultT = 0;

function OnResultGaze(GazeData) {

    try {


        if (ExperimentIsRunning) {
            if (LastResultT > 0) {
                var d = GazeData.time - LastResultT;
                if (d > MaxNoResultT)
                    MaxNoResultT = d;
            }
            LastResultT = GazeData.time;
        }


        if (bShowLiveHeatMap) {
            DynamicHeatMap.add(GazeData.docX, GazeData.docY, GazeData.time, GazeData.state);
        }
    } catch (eee) {
    }

    if (!ExperimentIsRunning)
        if (GazeData.state == 0) //wait for tracking ok
        {
            GoodPointsCount++;
            if (GoodPointsCount > 4) {
                Start();
                ExperimentIsRunning = true;
            }
        }

    if (CurMediaGazeData != null) {
        //var elem =  document.getElementById("imgid");
        var elem = null; // MediaTab[FileNr];

        if (Experimentdata.type == 1) //slide img
            elem = MediaTab[FileNr];
        if (Experimentdata.type == 3) //youtube
            elem = document.getElementById("content");

        try {
            if (Experimentdata.type == 0) //www
                // elem = document.getElementById("iframe");
                elem = document.getElementById("GazeRecorderDivId");


        } catch (yy) {
        }

        if (elem == null) {
            var t = GazeData.time - StartMediaTime;
            var gazept = {
                x: GazeData.docX,
                y: GazeData.docY,
                t: t,
                s: -10
            }
            CurMediaGazeData.GazeData.push(gazept);

            return;
        }
        var rect = elem.getBoundingClientRect();
        var w = rect.right - rect.left;
        var h = rect.bottom - rect.top;
        var x = (GazeData.docX - rect.left) / w;
        var y = (GazeData.docY - rect.top) / h;
        x = Math.round(x * 1000.0) / 1000.0;
        y = Math.round(y * 1000.0) / 1000.0;

        if (Experimentdata.type == 0) //www
        {

            if (bLoadingWWW)
                GazeData.state = -30;

            x = (GazeData.docX - rect.left);
            y = (GazeData.docY - rect.top);

            try {
                var scrollY = iframedoc.body.scrollTop;
                var scrollX = iframedoc.body.scrollLeft;

                try {
                    scrollY = Math.max(iframedoc.body.scrollTop, iframewin.scrollY);
                    scrollX = Math.max(iframedoc.body.scrollLeft, iframewin.scrollX);
                } catch (t) {
                }


                y += scrollY;
                x += scrollX;

                x = Math.round(x);
                y = Math.round(y);

            } catch (uu) {
            }
        }

        var t = GazeData.time - StartMediaTime;

        if (true) //tmp
        {

            if (Experimentdata.type == 3) {
                t = GetCurTimeYouTubeVideo();

                if (t > MaxVideoT)
                    MaxVideoT = t;

                var cc = Date.now();
                var delay = cc - GazeData.time;
                t -= delay;
            }
        }

        if (true)
            t = Math.round(t);

        var gazept = {
            x: x,
            y: y,
            t: t,
            s: GazeData.state
        }
        CurMediaGazeData.GazeData.push(gazept);
    }
}

///////////////end Save Gaze Data//////////////
//------------------------------------
var _LoopSlide = null;

function nextSlide() {
    vMediaGazeData.push(CurMediaGazeData);
    CurMediaGazeData = null; //tmp
    FileNr++;
    if (FileNr > Experimentdata.files.length - 1) {
        RunState = 'finish';
        RunCode = 3;
        FinishExperiment();
    } else {
        if (Experimentdata.type == 1) {

            LoadMedia();
        }
        var t = Experimentdata.time * 1000;
        _LoopSlide = setTimeout(function () {
            nextSlide();
        }, t);
        NewMedia();
    }
}

//------------------------------------
function ShowSlide() {
    NewMedia();
    var t = Experimentdata.time * 1000;
    _LoopSlide = setTimeout(function () {
        nextSlide();
    }, t);
    document.getElementById("divslideimgid").style.display = 'block';
    FitImgSize();
}

//-----------------------------------
//--------------------------------------

var RetrayInitDBCount = 0;
var bLoadMediFail = false;
var bLoadingWWW = false;
var bStarted = false;

function Start() {

    if (bStarted)
        return;

    bStarted = true;

    try {
        if (Experimentdata == null) {
            GazeCloudAPI.SendLog('runtest: Experimentdata == null');
            RunState = 'no Experimentdata';
            RunCode = -3;

            GazeCloudLogs += 'no Experimentdata';

            if (true) //try reload
            {
                if (RetrayInitDBCount < 4) {
                    RetrayInitDBCount++;
                    InitDB();
                    setTimeout(Start, 2000);
                    return
                } else {
                    RunState = 'init experiment no data';
                    GazeCloudLogs += RunState + ';';

                    RunCode = -10;

                    FinishExperiment();
                    return;
                }

            }
        }
    } catch (eee) {
    }

    FinishOnFullScreenExit();
    StartExperiment = Date.now();
    document.getElementById("startid").style.display = 'none';
    document.getElementById("InitLoadingid").style = 'display:none';

    //--------------------------------------------
    if (Experimentdata.type == 1) // slide show
    {
        if (true) LoadMedia();
        //GazeRecorderAPI.Rec('');
        _Rec('');
        ShowSlide();

        GazeCloudLogs += 'start Slide;';
        RunCode = 1;

    }

    //--------------------------------------------

    if (Experimentdata.type == 3) // youtube
    {

        try {
            if (VidoLog != '')
                GazeCloudLogs += 'VidoLog:' + VidoLog;
        } catch (aa) {
        }


        //////////////////////
        onVideoPlayErr = function (a) {
            bLoadMediFail = true;
            GazeCloudLogs += VidoLog;

            RunState = 'loaderr';
            GazeCloudLogs += RunState + ';';
            RunCode = -30;

            FinishExperiment();


            alert("Loading Video fail! Try Again.");

            if (true) //reload
            {
                var url = new URL(window.location.href);
                var reload = url.searchParams.get("reload");

                if (reload == null)
                    setTimeout(function () {
                        ExerimentCompleted = true;
                        redirect = window.location.href + '&reload=1';
                        window.location.href = redirect;

                    }, 1000);
            }

        }

        //////////////////////
        onPlayViedoStarted = function () {
            GazeCloudLogs += 'PlayViedoStarted;';
            RunCode = 1;
            _Rec('');

            if (true) //end rec limit
            {
                setTimeout(CheckEndTime, 1000 * Experimentdata.maxduration);
            }
            NewMedia(); // tmp
            //todo hide loading video
        } ////////////////////////

        OnYouTubeVideoEnd = function () {

            RunState = 'finish';
            RunCode = 3;
            FinishExperiment();
        };
////////////////////////


        try {
            GazeCloudLogs += 'StartPlayViedo;';
            //RunCode = -36;
            if (true) {
                var YouTubeVideoID = Experimentdata.files[0];
                PreLoadYouTube(YouTubeVideoID);
            }
            StartPlayViedo();
        } catch (eeee) {
            GazeCloudLogs += 'StartPlayViedo exeption;';
        }

        //todo show loading video

    }

    //--------------------------------------------
    if (Experimentdata.type == 0) // Live www
    {

        if (true) {
            try {

                GazeRecorderAPI.OnNavigation = function (url) {
                    bLoadingWWW = true;
                    GazeCloudLogs += 'loadingwww:' + url + ';';

                    NewMediaWWW('_init_:' + url);
                    LastURL = '_init_:' + url;

                    try {
                        if (bShowLiveHeatMap)
                            DynamicHeatMap.Pause();
                    } catch (rr) {
                    }


                }

                GazeRecorderAPI.OnNavigated = function (url) {


                    try {
                        if (bShowLiveHeatMap)
                            DynamicHeatMap.Resume();
                    } catch (rr) {
                    }

                    bLoadingWWW = false;
                    GazeCloudLogs += 'OnNavigation:' + url + ';';

                    if (RunCode < 1)
                        if (true) //end rec limit
                        {
                            setTimeout(CheckEndTime, 1000 * Experimentdata.maxduration);
                        }

                    RunCode = 1;

                    //url = encodeURIComponent(url );
                    NavigationGoodC++;

                    if (LastURL != url)
                        NewMediaWWW(url);


                    LastURL = url;
                }

                GazeRecorderAPI.OnNavigationErr = function (url) {
                    NavigationErrC++;

                    NavigationGoodC--;

                    GazeCloudLogs += 'OnNavigationErr  ;' + url;


                    if (RunCode == 0)//tmp
                        if (NavigationErrC > 2) {
                            if (NavigationGoodC < 1) {
                                RunState = 'WWWLoadErr';
                                GazeCloudLogs += 'WWWLoadErr';
                                ;

                                RunCode = -33;
                                FinishExperiment();

                            }
                        }

                    if (NavigationErrC > 10) {
                        RunState = 'WWWLoadErr';
                        GazeCloudLogs += 'WWWLoadErr: ' + NavigationErrC + ' ; ';
                        ;


                        if (RunCode == 0)
                            RunCode = -35;

                        FinishExperiment();

                    }


                }
            } catch (y) {
            }
        }

        //GazeRecorderAPI.Rec(Experimentdata.url);
        _Rec(Experimentdata.url);

        GazeCloudLogs += 'start www;';
        RunCode = 0;
        //todo check ok


        if (false)
            if (true) //end rec limit
            {
                setTimeout(function () {
                    RunState = 'finish';
                    RunCode = 3;
                    FinishExperiment();
                }, 1000 * Experimentdata.maxduration);
            }

    }
    //--------------------------------------------
    AskExit();
}

//-----------------------

function CheckEndTime() {

    try {
        if (Experimentdata.type == 3) {
            if (MaxVideoT < Experimentdata.maxduration)
                setTimeout(CheckEndTime, 100);
        }


        if (!ExerimentCompleted) {

            RunState = 'finish';
            RunCode = 3;
            FinishExperiment();
        }
    } catch (ee) {
    }

}

//--------------------------------------
var NavigationGoodC = 0;
var NavigationErrC = 0;
var LastURL = '';
////////////

var ClickMainDocC = 0;
var ExerimentCompleted = false;

function _Rec(url = "") {

    try {
        GazeRecorderAPI.Rec(url);
    } catch (er) {
        GazeCloudLogs += 'Rec exeption;';
    }


    try {


        if (false)//tmp
        {
            NewMediaWWW('init:');
        }

        if (false)
            document.onmousedown = function (e) {
                ClickMainDocC++;
                GazeCloudLogs += 'Click main doc:' + ClickMainDocC + '; ';
            };
    } catch (er) {
    }


}

function FinishExperiment() {
    //closeFullscreen();


    if (ExerimentCompleted)
        return;

    ExerimentCompleted = true;

    try {
        clearInterval(_SaveStramLoop);
        SaveStram(true);
    } catch (u) {
    }

    if (MaxNoResultT > 1000) {
        GazeCloudLogs += 'MaxNoResultT  : ' + MaxNoResultT + '; ';
    }


    if (Experimentdata.type == 3) {

        try {
            if (VidoLog != '')
                GazeCloudLogs += '  VidoLog:' + VidoLog;
        } catch (aa) {
        }


        if (RunCode > 0)
            if (MaxVideoT < 100) {
                GazeCloudLogs += 'MaxVideoT: ' + MaxVideoT + ';';
                RunCode = -31;
                RunState = 'loadvideoerr';

            }
    }


    if (bLoadMediFail) {
        RunState = 'loaderr';
        GazeCloudLogs += RunState + ';';
        RunCode = -30;
    }

    if (false)
        if (RunCode > -800)
            if (!ExperimentIsRunning) {
                RunState = 'TrackingErr';
                GazeCloudLogs += RunState + ';';
                RunCode = -50;
            }

    try {
        document.getElementById("divslideimgid").style.display = 'none';
    } catch (eee) {
    }

    GazeRecorderAPI.EndRecSesion();
    GazeRecorderAPI.StopRec();


    if (CurMediaGazeData != null) //uncomplete
    {
        vMediaGazeData.push(CurMediaGazeData);
        CurMediaGazeData = null; //tmp
    }

    if (true)//////////////////
        if (RunCode > 0) {
            try {

                var webevent = JSON.parse('{"type":' + 151 + ', "timestamp":' + Date.now() + ' }');
                webevent.type = 151;
                webevent.data = GetExperimentData();
//webevent.studyGUID =  Experimentdata.GUID;
                GazeCloudAPI.AddIFrameEvent(webevent);

            } catch (ee) {
            }

        }//////////////


    try {
        GazeCloudAPI.OnError = null;
        GazeCloudAPI.StopEyeTracking();
    } catch (e) {
    }

    if (CurMediaGazeData != null) //uncomplete
    {
        vMediaGazeData.push(CurMediaGazeData);
        CurMediaGazeData = null; //tmp
    }

    Save();
    ShowResults();

    closeFullscreen();


    try {
        DynamicHeatMap.End();
    } catch (e1e) {
    }
}

//--------------------------------------
function OnComplete() {

    document.getElementById("endid").style.display = 'block';
    document.getElementById("Saveid").style.display = 'none';

    if (true) {
        var url = new URL(window.location.href);
        var tryagain = url.searchParams.get("tryagain");
        if (tryagain != null)
            bRedirect = true;

        if (!bRedirect) //no redirect cam deniaid
            return;

    }


////////////
//if(false)

    if (Experimentdata.type == 3) {


        var tt = Date.now();
        var duration = tt - StartExperiment;

        if (duration > 3000)
            if (MaxVideoT < 1000)
//if( MaxVideoT  < 1)
                if (RunCode > -1) {

                    alert("Loading Video fail! Try Again.");

                    if (true) //reload
                    {
                        var url = new URL(window.location.href);
                        var reload = url.searchParams.get("reloadv");

                        if (reload == null)
                            setTimeout(function () {
                                ExerimentCompleted = true;
                                redirect = window.location.href + '&reloadv=1';
                                window.location.href = redirect;

                            }, 1000);
                    }

                }
    }


////////
    try {

        if (true) // redirect
        {

            var url = new URL(window.location.href);
            var redirect = url.searchParams.get("redirect");

            var RespondentID = url.searchParams.get("RespondentID");

            if (redirect != null) {

                redirect = decodeURIComponent(redirect);

                if (true) //add session param
                {
                    var sessionstr = 'GazeCloudSession=';

                    if (redirect.includes("?"))
                        sessionstr = '&' + sessionstr;
                    else
                        sessionstr = '?' + sessionstr;

                    if (RunCode > 0)

                        redirect += sessionstr + GazeCloudSesion;
                    else
                        redirect += sessionstr + 'null';

                    if (RespondentID != null) {
                        redirect += '&RespondentID=' + RespondentID;

                    }

                    if (RunCode != 3) // finish
                        redirect += '&RunState=' + RunState;

                }

                window.location.href = redirect;

            }

            var close = url.searchParams.get("close");
            if (close != null)
                if (window.opener) {

                    setTimeout(function () {
                        window.opener.focus();
                        window.close();
                    }, 2000);

                }

        }
    } catch (ee) {
    }

}

//--------------------------------------

var GazeCloudLogs = '';
var RunState = 'init';
//var RunCode = 0;
//var RunCode = -1000;

var RunCode = -5000;

function GetInfo() {
    try {
        var aa = document.getElementById('dpicm');
        var mm_x = aa.offsetWidth;
        var mm_y = aa.offsetHeight;
        var wmm = window.screen.width / mm_x;
        var hmm = window.screen.height / mm_y;
        var w = window.screen.width;
        var h = window.screen.height;

        var orientation = window.orientation;
        var isMobile = window.orientation > -1;
        if (typeof window.orientation === 'undefined') orientation = 10;
        //var info = get_browser_info();
        //info.platform = navigator.platform;
        //info.userAgent = navigator.userAgent;
        //info.Media = MediaInfo;

        //var stat =JSON.stringify(GazeCloudAPI.GetInfo())  ;
        var stat = GazeCloudAPI.GetInfo();
        var r = {

            'stat': stat,

            'dpi': document.getElementById('dpimm').offsetWidth,

            'wmm': wmm,
            'hmm': hmm,
            'wpx': w,
            'hpx': h,
            'ratio': window.devicePixelRatio,
            orientation: orientation,
            winx: window.screenX,
            winy: window.screenY,
            aW: screen.availWidth,
            aH: screen.availHeight,
            'innerWidth': window.innerWidth,
            'outerWidth': window.outerWidth,
            'innerHeight': window.innerHeight,
            'outerHeight': window.outerHeight,
            "mm_x": mm_x,
            "mm_y": mm_y,

            //info: info
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            CountryCode: CountryCode,
            RunState: RunState,
            GazeCloudLogs: GazeCloudLogs,
            refer: document.referrer,
            url: window.location.href

        };
        var myJSON = JSON.stringify(r);
        return r;

    } catch (e) {
        console.log("sendScreensize exeption ");
    }
}

//----------------------
function GetExperimentData() {

    var tt = Date.now();
    var duration = tt - StartExperiment;
    var duration2 = LastResultT - StartExperiment;

    if (duration - duration2 > 1000) {
        GazeCloudLogs += 'duration dif: ' + duration - duration2 + '; ';
    }

    duration = duration2;


    var ScreenSize = 0;
    var TrackQuality = 0;
    var CalQuality = 0;
    var name = document.getElementById("nameid").value;
    var age = document.getElementById("ageid").value;
    var gander = document.getElementById("ganderid").value;
    var survey = {
        name: name,
        age: age,
        gender: gander
    }

    var url = new URL(window.location.href);
    var RespondentID = url.searchParams.get("RespondentID");

    var obj = {
        data: vMediaGazeData,
        Session: GazeCloudSesion,
        duration: duration,
        time: Date.now(),
        ScreenSize: ScreenSize,
        TrackQuality: 1,
        CalQuality: 1,
        survey: survey,
        info: GetInfo(),

        MaxNoResultT: MaxNoResultT,

        RespondentID: RespondentID
    }
    //var myJSON = JSON.stringify(vMediaGazeData );
    var myJSON = JSON.stringify(obj);
    return myJSON;
}

//--------------------------------------
function NewMedia() {
    try {
        StartMediaTime = Date.now();
        CurMediaGazeData = {
            nr: FileNr,
            GazeData: [],
            MediaID: Experimentdata.files[FileNr]
        };
    } catch (ee) {
        GazeCloudLogs += 'NewMedia exep';
        CurMediaGazeData = {
            nr: FileNr,
            GazeData: [],
            MediaID: 'empty'
        };
    }
    try {
        SaveStram();
    } catch (aa) {
    }
    ;
}

//--------------------------------------
function getiFrameDoc() {
//var _iframe = document.getElementById("iframe");

    var x = document.getElementById("iframe");
    var y = (x.contentWindow || x.contentDocument);
    if (y.document) y = y.document;
    return y;
}

//--------------------------------------


function NewMediaWWW(url) {

    try {
        StartMediaTime = Date.now();

        if (CurMediaGazeData != null) {
            vMediaGazeData.push(CurMediaGazeData);
            CurMediaGazeData = null; //tmp
        }

        var width = 0;
        var height = 0;

        var w = 0;
        var h = 0;
        var top = 0;
        var left = 0;

        try {

            //  var _iframe = document.getElementById("iframe");
            //   var rect = _iframe.getBoundingClientRect();
            var elem = document.getElementById("GazeRecorderDivId");


            var rect = elem.getBoundingClientRect();
            w = rect.right - rect.left;
            h = rect.bottom - rect.top;
            top = rect.top;
            left = rect.left;


            try {
                iframedoc = getiFrameDoc();// iframe.contentDocument;
                iframewin = iframe.contentWindow;
            } catch (eee) {
            }


            var body = iframedoc.body,
                html = iframedoc.documentElement;

            height = Math.max(body.scrollHeight, body.offsetHeight,
                html.clientHeight, html.scrollHeight, html.offsetHeight);
            width = Math.max(body.scrollWidth, body.offsetWidth,
                html.clientWidth, html.scrollWidth, html.offsetWidth);


        } catch (ee) {
        }

        CurMediaGazeData = {
            nr: FileNr,
            GazeData: [],
            MediaID: url,
            width: width,
            height: height,
            w: w,
            h: h,
            top: top,
            left: left
        };

        try {
            SaveStram();
        } catch (aa) {
        }
        ;
    } catch (ee) {
        GazeCloudLogs += 'newmediawww exep  ;';

    }
}

//--------------------------------------
var bSaved = false;

var RecordingData = 'null';

function Save() {

    if (bSaved)
        return;


    try {
        document.getElementById("Saveid").style = 'display:block';

        try {
            if (GazeCloudSesion == null) //tmp
                GazeCloudSesion = GazeCloudAPI.GetSessionId();

        } catch (eee) {
        }
        //SaveExperiment(Experimentdata.GUID, GetExperimentData(), GazeCloudSesion, null, RunState );


        //   SaveExperiment(Experimentdata.GUID, GetExperimentData(), GazeCloudSesion, OnUploadExperiment, RunCode,);

        var dd = Date.now() - StartExperiment;

        try {
            var percentComplete = 0;
            $(".progress-bar").width(percentComplete + '%');
            $(".progress-bar").html(percentComplete + '%');
        } catch (y) {
        }
        ;

        SaveExperiment(Experimentdata.GUID, GetExperimentData(), GazeCloudSesion, OnUploadExperiment, RunCode, dd);


        //var RecordingData = 'null';


//if(false)
        {
            try {
                //RecordingData  = GazeRecorderAPI.GetRecDataCompress();
                RecordingData = GazeCloudAPI.GetEventsCompress();

            } catch (e) {
            }

            //SaveRecording(Experimentdata.GUID, RecordingData , GazeCloudSesion, OnComplete);
            UploadRec(Experimentdata.GUID, RecordingData, GazeCloudSesion, OnUploadRec);

        }


        bSaved = true;
    } catch (rr) {

        setTimeout(function () {
            GazeCloudLogs += ' save exp' + ';';

            Save();
        }, 500);

    }
}

//--------------------------------
var bUploadExperiment = false;
var bUploadRec = false;

function OnUploadExperiment() {
    bUploadExperiment = true;


    if (false)
        if (true)//tmp
            try {

                try {
                    var percentComplete = 3;
                    $(".progress-bar").width(percentComplete + '%');
                    $(".progress-bar").html(percentComplete + '%');
                } catch (y) {
                }
                ;

                try {
                    //RecordingData  = GazeRecorderAPI.GetRecDataCompress();
                    RecordingData = GazeCloudAPI.GetEventsCompress();

                } catch (e) {
                }

                //SaveRecording(Experimentdata.GUID, RecordingData , GazeCloudSesion, OnComplete);
                UploadRec(Experimentdata.GUID, RecordingData, GazeCloudSesion, OnUploadRec);

            } catch (ee) {
            }


    WatiForUploadAll();
}

function OnUploadRec() {
    bUploadRec = true;
    WatiForUploadAll();
}

//--------------------------------

function WatiForUploadAll() {

    if (bUploadExperiment && bUploadRec) {
        OnComplete();
        return;
    }

    setTimeout(function () {
        WatiForUploadAll();
    }, 500);

}

//--------------------------------
var UploadRecErrC = 0;

function UploadRec(GUID, _data, GazeCloudSesion, _success) {

    var APIUrl = "https://app.gazerecorder.com/Study/StudyAPI.php"

    var param = {
        RequestType: "SaveRecording",
        GUID: GUID,
        data: _data,
        GazeCloudSesion: GazeCloudSesion
    };

    var formData = new FormData();

    formData.append("RequestType", "SaveRecording");
    formData.append("GUID", GUID);
    formData.append("data", _data);
    formData.append("GazeCloudSesion", GazeCloudSesion);

    // File upload via Ajax
    $.ajax({
        xhr: function () {
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    //    var percentComplete = Math.round((evt.loaded / evt.total) * 100);

                    var percentComplete = 3 + Math.round((evt.loaded / evt.total) * 97);


                    $(".progress-bar").width(percentComplete + '%');
                    $(".progress-bar").html(percentComplete + '%');
                }
            }, false);
            return xhr;
        },
        type: 'POST',
        url: APIUrl,
        data: formData, //;//param ,//new FormData(this),
        contentType: false,
        cache: false,
        processData: false,
        beforeSend: function () {
            $(".progress-bar").width('0%');
        },
        error: function () {

            //////////tmp/////
            try {
                UploadRecErrC++;
                if (UploadRecErrC < 5)

                    UploadRec(GUID, _data, GazeCloudSesion, _success)
                //UploadRec(Experimentdata.GUID, RecordingData , GazeCloudSesion, OnUploadRec);
                else {
                    OnUploadRec()
                }

            } catch (eeee) {
            }

            //////////tmp/////

            $('#uploadStatus').html('<p style="color:#EA4335;">File upload failed, please try again.</p>');
        },
        success: function (resp) {
            _success();

            if (resp == 'ok') {

                //$('#uploadStatus').html('<p style="color:#28A74B;">File has uploaded successfully!</p>');

            } else if (resp == 'err') {
                //$('#uploadStatus').html('<p style="color:#EA4335;">Upload Error!</p>');
            }
        }

    });

}

//--------------------------------------
///////////////////////////////////////////////////////////////////
//------------------------------------------------
var FaceTrakOk = false;
var CalibrationProcessingTime = Date.now();
var StartCalibrationTime = Date.now();
var InitETTime = Date.now();
var bETRady = false;

var bRedirect = true;
var _WaitForStartCal = null;


function ForceWaitForStartCal(t = 120000) {
    try {
        if (_WaitForStartCal != null) {
            clearTimeout(_WaitForStartCal);
            _WaitForStartCal = null;
        }

        if (t > 0)
            _WaitForStartCal = setTimeout(function () {


                bRedirect = false;
                RunState = 'NoStart';
                GazeCloudLogs += RunState;
                RunCode = -15;

                if (!FaceTrakOk)
                    RunCode = -16;

                FinishExperiment();
                if (true)
                    CamDenyShow();


            }, t);

    } catch (e) {
    }
}

//---------------------

var SaveStramLastIx = 0;
var SaveStramBuf = '';
var _SaveStramLastMediaIx = 0;
var _SaveStramLoop = 0;

function SaveStram(end = false) {


    try {

        if (CurMediaGazeData != null)
            if (CurMediaGazeData.GazeData.length > 100) {

                if (_SaveStramLastMediaIx < vMediaGazeData.length)//reset
                    SaveStramLastIx = 0;

                var v = CurMediaGazeData.GazeData;

                var txt = JSON.stringify(v);
                var c = txt.length - 1 - SaveStramLastIx;
                if (end) {
                    c = txt.length - SaveStramLastIx;

                }

                if (c > 500 || end) {

                    var dd = txt.substr(SaveStramLastIx, c);
                    SaveStramLastIx += c;
                    var webevent = JSON.parse('{"type":' + 152 + ', "timestamp":' + Date.now() + ' }');
                    webevent.data = dd;
                    webevent.i = vMediaGazeData.length;

                    GazeCloudAPI.AddIFrameEvent(webevent);
                }

            }

    } catch (ee) {
    }


    try {

        if (_SaveStramLastMediaIx < vMediaGazeData.length) {
            for (i = _SaveStramLastMediaIx; i < vMediaGazeData.length; i++) {
                var txt = JSON.stringify(vMediaGazeData[i]);
                var webevent = JSON.parse('{"type":' + 153 + ', "timestamp":' + Date.now() + ' }');
                webevent.data = txt;
                webevent.i = i;
                GazeCloudAPI.AddIFrameEvent(webevent);

            }
            _SaveStramLastMediaIx = vMediaGazeData.length;

        }
    } catch (uu) {
    }


/////////////


}

//--------------------------


function StartClick() {

    try {


        _SaveStramLoop = setInterval(SaveStram, 10000);


        RunCode = -1001;

        if (true)
            AskExit(); // tmpppp

        //document.getElementById("InitLoadingid").style = 'display:none';
        document.getElementById("startid").style = 'display:none';


        if (!bNoEyeTracking) {

            try {

                var url = new URL(window.location.href);
                var shortcal = url.searchParams.get("shortcal");

                if (shortcal != null)
                    GazeCloudAPI.CalibrationType = 1;
            } catch (eee) {
            }

            InitETTime = Date.now();

            GazeCloudAPI.beforeunloadNoCloseWs = true;

            GazeCloudAPI.StartEyeTracking();

            if (true) {

                GazeCloudAPI.OnResult = function (GazeData) {

                    if (!bETRady) {
                        bETRady = true;
                        var t = Date.now();

                        var d = t - InitETTime;
                        GazeCloudLogs += '; InitET: ' + d;


                        RunCode = -990;

                        if (d > 10000)
                            GazeCloudLogs += '; InitETLong';

                        if (true)//start cal time limit
                            ForceWaitForStartCal(120000);


                        if (!FaceTrakOk)
                            if (GazeData.state != -1) //wait for tracking ok
                            {
                                FaceTrakOk = true;

                                if (RunCode < -900)
                                    RunCode = -950;


                                if (true)//start cal time limit
                                    ForceWaitForStartCal(120000);


                                if (true) //blink
                                {
                                    setTimeout(function () {
                                        var c = document.getElementById("_ButtonCalibrateId").childNodes;
                                        // c[3].style.animation = " blink 1s linear infinite";

                                        c[3].innerHTML += '<span  id = "idanim">' + '>>' + '</span>';

                                        setTimeout(function () {
                                            document.getElementById("idanim").style.animation = " blink 1s linear infinite";
                                        }, 10);


                                    }, 8000);

                                }

                            }
                    }
                }

                ////////call back////////////

                GazeCloudAPI.OnInitializing = function () {


                    var a = 1;
                    a++;
                    ;
                    RunCode = -1050;

                    GazeCloudLogs += '; OnInitializing ';
                    InitETTime = Date.now();
                }

                GazeCloudAPI.OnCalibrationAbort = function () {
                    GazeCloudLogs += '; OnCalibrationAbort;';

                }


                GazeCloudAPI.OnCalibrationFail = function () {
                    var a = 1;
                    a++;
                    ;
                    GazeCloudLogs += '; OnCalibrationFail  ';
                    RunState = 'calfail';
                    GazeCloudLogs += RunState + ';';
                    RunCode = -11;

                }

                //--------------------------
                var CamDeniedCount = 0;

                GazeCloudAPI.OnCamDenied = function (msg) {
                    bRedirect = false;
                    RunState = 'CamDenied';
                    GazeCloudLogs += RunState + ' : ' + msg + ';';
                    RunCode = -1;
                    CamDeniedCount++;

                    /*
                		if(CamDeniedCount  < 3)
                			GazeCloudAPI.StartEyeTracking();
                		else*/
                    {
                        FinishExperiment();
                    }

                    CamDenyShow();
                }

                //--------------------------

                GazeCloudAPI.OnCalibrationProcessing = function () {
                    CalibrationProcessingTime = Date.now();

                    RunState = 'CalibrationProcessing';
                    GazeCloudLogs += RunState + ';';
                    RunCode = -700;

                    if (true) {
                        var t = Date.now();
                        var dif = t - StartCalibrationTime;
                        GazeCloudLogs += "CalibrationRunTime:" + dif + " ; ";
                    }


                    if (true)
                        if (Experimentdata.type == 0) //www
                        {
                            try {
                                GazeRecorderAPI.Preload(Experimentdata.url);
                            } catch (ee) {
                            }
                            ;
                        }


                }


            }
            //--------------------------
            GazeCloudAPI.OnCalibrationComplete = function () {
                if (true) {
                    var t = Date.now();
                    var dif = t - CalibrationProcessingTime;
                    GazeCloudLogs += "CalibrationProcessingTime:" + dif + " ; ";
                }
                RunState = 'calfinish';
                GazeCloudLogs += RunState + ';';

                // RunCode = 1;
                RunCode = -2;

                GazeCloudSesion = GazeCloudAPI.GetSessionId();

                //GazeCloudAPI.SetFps(60);

                if (false) //wait for tracking ok
                    Start();


                if (false)
                    if (Experimentdata.type == 0) //www
                        setTimeout(Start, 300);


                GazeCloudAPI.OnResult = OnResultGaze;

                try {
                    if (bShowLiveHeatMap)
                        DynamicHeatMap.Show();
                } catch (rr) {
                }


                if (true)
                    try {
                        SaveStartExperiment(Experimentdata.GUID, GetExperimentData(), GazeCloudSesion);
                    } catch (rrr) {
                    }


                try {
                    var webevent = JSON.parse('{"type":' + 150 + ', "timestamp":' + Date.now() + ' }');
                    webevent.type = 150;
                    webevent.data = GetExperimentData();
                    GazeCloudAPI.AddIFrameEvent(webevent);
                } catch (eej) {
                }

            }

            //-------------------------------
            GazeCloudAPI.OnCalibrationStart = function () {

                GazeCloudLogs += '; OnCalibrationStart    ';
                RunCode = -900;
                RunState = 'CalibrationStart';
                GazeCloudLogs += RunState + ';';

                StartCalibrationTime = Date.now();

                ForceWaitForStartCal(-1); //disable


            }
            //-------------------------------

            //-------------------------------
            GazeCloudAPI.OnStopGazeFlow = function () {

                GazeCloudLogs += '; OnStopGazeFlow  ';
                // FinishExperiment();
            }
            //-------------------------------

            GazeCloudAPI.OnDemoLimit = function () {

                GazeCloudLogs += '; OnDemoLimit   ';
                RunState = 'DemoLimit';
                GazeCloudLogs += RunState + ';';
                RunCode = 4;
                FinishExperiment();
            }
            //-------------------------------

            GazeCloudAPI.OnError = function (err) {
                GazeCloudLogs += ' ; err:  ' + err;
                RunState = 'OnError:' + err;

                if (RunCode < 0)
                    RunCode = -800;

                if (RunCode > 0) {
                    RunCode = 13;
                    FinishExperiment();
                }
            }
            //-------------------------------

            /////////end call back/////////////
        } else {
            //openFullscreen();
            Start();

        }

        RunCode = -1000;
    } catch (aa) {
        GazeCloudLogs += ' ; err: exeption start ';
        RunCode = -1300;

        RunState = 'exeption';
    }
}

//------------------------------------------------
function StartRecording() {
    LoadExperiment();
    var ShowLoad = false;
    if (ExperimentType == 0) //www
        ShowLoad = true;
    //StartRecording(true,ShowLoad);
}

//------------------------------------------------
var _RecStarted = false

function AskExit() {
    window.onbeforeunload = function (event) {
        if (ExerimentCompleted) return null;
        event.preventDefault();
        try {
            if (!ExerimentCompleted) {
                RunState = 'close';
                GazeCloudLogs += RunState + ';';

                if (false) //tmp
                    RunCode = 5;
                FinishExperiment();
            }

        } catch (a) {
        }
        event.returnValue = "save data?";
        return "save data?";
    };
}

//-------------------------

////////////////Results//////////////////
function ShowResults() {

    if (bShowLiveHeatMap) {
        try {
            if (true) //tmpd
                DynamicHeatMap.Clear();
        } catch (eee) {
        }
    }

    try {
        if (true) //tmp
            FinishPlayViedo();
    } catch (eee) {
    }

    var url = new URL(window.location.href);
    var watch = url.searchParams.get("Watch");
    if (watch != null) {
        var elem = document.getElementById("playerdiv");
        elem.style.display = 'block';
        if (true) //player size
        {
            var rect = elem.getBoundingClientRect();
            PlayerWidth = rect.width;
            PlayerHeight = rect.height - 80;
            ;
            PlayerHeight = window.innerHeight - 80;
            ;
        }
        setTimeout(function () {
            GazePlayer.SetCountainer(document.getElementById("playerdiv"));
            GazePlayer.PlayResultsData(GazeRecorderAPI.GetRecData());
        }, 100);
    }
}

//-------------------------

var bNoEyeTracking = false;

var bAutoStart = true;

setTimeout(function () {
    if (!binitdone)
        __init_();
}, 2000);

window.addEventListener("load", __init_);

var binitdone = false;

function __init_() {
    binitdone = true;

    InitDB();

    if (false)
        setTimeout(function () {
            InitDB();
        }, 10);

    GetInfo();
    ///////options/////////

    var url = new URL(window.location.href);
    var autostart = url.searchParams.get("autostart");
    var start = true;

    var noEyeTrack = url.searchParams.get("noEyeTrack");

    if (noEyeTrack == 1) {
        bNoEyeTracking = true;
    }

    if (autostart == 0) {
        document.getElementById("startid").style.display = 'block';
        document.getElementById("InitLoadingid").style.display = 'none';

        start = false;
    }
    ///////end options/////////

    if (true) ////////insctruction//////
    {

        try {
            var ii = document.getElementById("instructionsid");

            if (ii == null) {
                var _inst = ' <div id="instructionsid"> <div id="Introid" style="display:none;position:absolute; left:0%; top:0% ; width: 100%; height:100%;background-color: white;z-index:100000 "><h2 align="center">To get started, we will need your permission to access your webcam. you must grant us permission to use your webcam so that we can see and track your eyes.Once you agree, we will begin a simple process of calibrating your webcam and eye movements in order to accurately determine where you are looking. </h2><h1><p align="center"><button style="background-color: rgb(255, 102, 0); display: block;" id="startrecidss" class="buttonStartEyeTrack" onclick="StartClick()" type="button"><h1>Start</h1></button></p></h1></div><div id="camaccessid" style="display:none;position:absolute; left:0%; top:0% ; width: 100%; height:100%;background-color: white;z-index:10000000 "><h2 align="center">To get started, we will need your permission to access your webcam. you must grant us permission to use your webcam so that we can see and track your eyes.Once you agree, we will begin a simple process of calibrating your webcam and eye movements in order to accurately determine where you are looking. </h2><h3 align="center">Make sure your webcam is connected and working.</h3><h3 align="center">Make sure you have enabled camera access.</h3><h3 align="center">Make sure no other software is using the webcam.</h3><p align="center"><button style="background-color: rgb(255, 102, 0); display: block;" id="startrecidss" class="buttonStartEyeTrack" onclick="TryAgain()" type="button"><h1>Try Again</h1></button></p></div></div>';

                document.body.insertAdjacentHTML('afterbegin', _inst);

            }
        } catch (eee) {
        }

        var intro = url.searchParams.get("intro");
        var intro = url.searchParams.get("intro");
        if (intro !== null) {

            bAutoStart = false;
            var intro = document.getElementById("Introid");
            intro.style.display = 'block';

            start = false;
            GazeCloudLogs += ' ; intro ';
            RunCode = -4000;
            RunState = 'intro';

        }

    } ////////end insctruction//////

    if (false)

        if (start) {
            //StartWaitForGazeCloudScript();
            StartClick();
        }

}

//------------
;

function TryAgain() {
    var u = window.location.href;


    u = u.replace('app.gazerecorder.com', 'api.gazerecorder.com');

    u += '&tryagain=1';
    window.location.href = u;
}

//------------
function CamDenyShow() {
    setTimeout(function () {
        try {

            var intro = document.getElementById("camaccessid");
            intro.style.display = 'block';
        } catch (tt) {
        }

    }, 300);

}

////////////////////////////////////////
var WaitForScripC = 0;

function StartWaitForGazeCloudScript() {

    //if (typeof GazeCloudAPI !== 'undefined')

    if (typeof GazeCloudAPI !== 'undefined') {

        StartClick();
    } else {
        RunCode = -10000;
        WaitForScripC++;
        GazeCloudLogs += '; WaitforScript  ';

        if (WaitForScripC > 30) {
            FinishExperiment();
            _Error_();
        }

        setTimeout(function () {
            StartWaitForGazeCloudScript();
        }, 300);

    }
}

//---------
function _Error_() {

    var url = new URL(window.location.href);
    var errC = url.searchParams.get("errCount");

    if (errC === null) {

        var u = window.location.href;

        u += '&errCount=1';
        window.location.href = u;

        //window.location.reload(true);
    } else {

        var errC2 = url.searchParams.get("errCount2");
        if (errC === null) {
            var u = window.location.href;

            u += '&errCount2=1';
            window.location.href = u;
        } else
            document.body.innerHTML = 'Something wrong';
    }

}

////////////////////////////////////////
function openFullscreen() {
    try {
        var elem = document.body;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            /* Firefox */
            elem.mozRequestFullScreen();
            ;
        } else if (elem.webkitRequestFullscreen) {
            /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
            ;
        } else if (elem.msRequestFullscreen) {
            /* IE/Edge */
            elem.msRequestFullscreen();
            ;
        }
    } catch (ee) {
        ;
    }
}

//-------------------------
/* Close fullscreen */
function closeFullscreen() {
    try {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            /* IE/Edge */
            document.msExitFullscreen();
        }
    } catch (error) {
        ;
    }
}

//-------------------------
function FinishOnFullScreenExit() {
    if (document.addEventListener) {
        document.addEventListener('fullscreenchange', exitHandler, false);
        document.addEventListener('mozfullscreenchange', exitHandler, false);
        document.addEventListener('MSFullscreenChange', exitHandler, false);
        document.addEventListener('webkitfullscreenchange', exitHandler, false);
    }
}

function exitHandler() {
    if (document.webkitIsFullScreen === false) {
        onFullScreenExit();
    } else if (document.mozFullScreen === false) {
        onFullScreenExit();
    } else if (document.msFullscreenElement === false) {
        onFullScreenExit();
    }
}

//-------------------------
function onFullScreenExit() {

    RunState = 'FullScreenExit';
    GazeCloudLogs += RunState + ';';
    FinishExperiment();
}

//-------------------------
var a = 1;
a++;

////////////////////////////////

var CountryCode = null;

function ipLookUp() {
    $.ajax('https://extreme-ip-lookup.com/json/')
        .then(
            function success(response) {
                // console.log('User\'s Location Data is ', response);
                // console.log('User\'s Country', response.country);

                CountryCode = response.countryCode;
            },

            function fail(data, status) {
                // console.log('Request failed.  Returned status of',status);
            }
        );
}

//---------------------------------------------
window.addEventListener("DOMContentLoaded", function () {
    ipLookUp();
});

//------------------------------

var bShowLiveHeatMap = false;

function InitLiveShow() {

    try {
        var url = new URL(window.location.href);
        var Live = url.searchParams.get("Live");
        if (Live != null)
            bShowLiveHeatMap = true;
    } catch (ee) {
        ;
    }

}

InitLiveShow();
//---------------------

var APIUrl = "https://app.gazerecorder.com/Study/StudyAPI.php";


var url = new URL(window.location.href);


var _apiurl = url.searchParams.get("APIUrl");
if (_apiurl != null)
    APIUrl = _apiurl;


var _isDemo = false;
if (url.searchParams.get("demo") != null)
    _isDemo = true;

//////////////////Tester/////////////////////////////

//--------------------------------------------

var _GetRunStudyDataRetrayCount = 0;

function GetRunStudyData(StudyID, success) {
    var result = null;
    var param = {
        RequestType: "Run",
        StudyID: StudyID,
        _edge: 1
    };

    $.getJSON(APIUrl, param)
        .done(function (data) {
            success(data);

        })
        .fail(function (jqxhr, textStatus, error) {

            _GetRunStudyDataRetrayCount++;

            if (_GetRunStudyDataRetrayCount < 15) {

                setTimeout(function () {
                    GetRunStudyData(StudyID, success);
                }, RetrayWait);
                //
            }

            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);
        });
}

//--------------------------------------------
function GetMediaUrl(MediaID) {
    return "https://app.gazerecorder.com/Study/getMedia.php?_edge=1&media=" + MediaID;
}

//--------------------------------------------

function SaveRecording(GUID, data, GazeCloudSesion, success) {

    var param = {
        RequestType: "SaveRecording",
        GUID: GUID,
        data: data,
        GazeCloudSesion: GazeCloudSesion
    };

    $.post(APIUrl, param).done(function (data) {

        if (success != null)
            success(data);

    })

        .fail(function () {

            console.log("error");
        });

}

//--------------------------------------------

var _SaveExperimentData = null;

var _SaveExperimentRetrayCount = 0;

function SaveExperiment(GUID, data, GazeCloudSesion, success, RunState = -100, t = 0) {

    var result = null;
    var param = {
        RequestType: "SaveExperiment",
        GUID: GUID,
        data: data,
        GazeCloudSesion: GazeCloudSesion,
        RunState: RunState,
        duration: t,

        errc: _SaveExperimentRetrayCount
    };

    _SaveExperimentData = param;

    $.post(APIUrl, param).done(function (outdata) {

        var a = outdata;

        if (false)
            if (!outdata.includes('ok')) {
                _SaveExperimentRetrayCount++;
                SaveExperiment(GUID, data, GazeCloudSesion, success, RunState);
                return;
            }

        try {
            if (success != null)
                //success(data );
                success();
        } catch (ee) {
        }

    })

        .fail(function () {

            ///////retray//////////
            _SaveExperimentRetrayCount++;

            if (_SaveExperimentRetrayCount < 15) {

                //setTimeout(function(){SaveExperiment(GUID,data,GazeCloudSesion,success,RunState  ); }, RetrayWait );
                setTimeout(function () {
                    SaveExperiment(GUID, data, GazeCloudSesion, success, RunState);
                }, RetrayWait);

            } //end retray////

            ///////end retray//////////

            console.log("error");
        });

}

////////////////////

var _SaveStartExperimentData = null;

var _SaveStartExperimentRetrayCount = 0;

function SaveStartExperiment(GUID, data, GazeCloudSesion, success, RunState = -100) {

    var result = null;
    var param = {
        RequestType: "SaveStartExperiment",
        GUID: GUID,
        data: data,
        GazeCloudSesion: GazeCloudSesion,
        RunState: RunState,
        errc: _SaveStartExperimentRetrayCount
    };

    _SaveStartExperimentData = param;

    $.post(APIUrl, param).done(function (outdata) {

        var a = outdata;

        try {
            if (success != null)
                success();
        } catch (ee) {
        }

    })

        .fail(function () {

            ///////retray//////////
            _SaveStartExperimentRetrayCount++;

            if (_SaveStartExperimentRetrayCount < 3) {


                setTimeout(function () {
                    SaveStartExperiment(GUID, data, GazeCloudSesion, success, RunState);
                }, RetrayWait);

            } //end retray////

            ///////end retray//////////

            console.log("error");
        });

}

//////////////////Admin/////////////////////////////

function CheckSessionOut(txt) {
    try {
        if (txt.length < 1000)
            if (txt.includes('unauthorizedrequest')) {
                LogD('session time out');
                window.location.href = "https://app.gazerecorder.com/Study/Login/?timeout=1";
                return true;
            }
    } catch (e) {
    }
    ;
    return false;
}

//---------------------------------
function _reload() {
    try {
        LogD('_reload');
        var u = window.location.href;
        u += '?r=1';
        window.location.href = u;

    } catch (e) {
    }
    ;
}


//--------------------------------------------
var _SetStudyStateRetrayCount = 0;

function SetStudyState(GUID, state, success) {

    var param = {
        RequestType: "SetStudyState",
        GUID: GUID,
        state: state,
        errc: _SetStudyStateRetrayCount

    };

    $.post(APIUrl, param).done(function (data) {


        try {
            var a = data;
            if (CheckSessionOut(a))
                return;
        } catch (eee) {
        }


        if (success != null)
            success(data);

    })

        .fail(function () {

            LogD('SetStudyState fail');

            //CheckSessionOut(jqxhr.responseText);


            _SetStudyStateRetrayCount++;

            if (_SetStudyStateRetrayCount < 15) {

                setTimeout(function () {
                    SetStudyState(GUID, state, success);
                }, RetrayWait);

            } //end retray////


            console.log("error");
        });

}

//--------------------------------------------
function GetRunStudyUrl(StudyID, lang = "") {
    var RespondentID = '&RespondentID=null';
    var lg = '';

    if (lang != "")
        lg = '&lang=' + lang;

    return "https://app.gazerecorder.com/Study/Test?StudyID=" + StudyID + lg + RespondentID;

    //return "https://app.gazerecorder.com/Study/RunStudy.php?StudyID="+StudyID;

    return "https://app.gazerecorder.com/Study/Test?StudyID=" + StudyID + RespondentID;

}

//--------------------------------------------

var RetrayCount = 6;
var RetrayWait = 1500; //10;// 1500;
//--------------------------------------------

var _GetStudyListErrCount = 0;

function GetStudyList(success) {
    var result = null;
    var param = {
        RequestType: "AllStudyList",
        errc: _GetStudyListErrCount
    };

    if (_isDemo)
        param._edge = 1;

    $.getJSON(APIUrl, param).done(function (data) {
        success(data);
        _GetStudyListErrCount = 0;

    })
        .fail(function (jqxhr, textStatus, error) {

            CheckSessionOut(jqxhr.responseText);
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);

            LogD('GetStudyList fail' + err);


            if (true) {

                var d = ParseStudyList(jqxhr.responseText);
                if (d != null) {

                    if (_GetStudyListErrCount == 0)
                        if (d.length == 0) {
                            _GetStudyListErrCount++;

                            setTimeout(function () {
                                GetStudyList(success);
                            }, RetrayWait);
                            return;
                        }

                    success(d);
                    return;
                }

            }


            //retray////
            if (_GetStudyListErrCount < RetrayCount) {
                _GetStudyListErrCount++;

                setTimeout(function () {
                    GetStudyList(success);
                }, RetrayWait);

            } //end retray////
            else
                _reload();

        });
}

//--------------------------------------------
//tmp
function GetStudyData(success, guid) {
    var result = null;
    var param = {
        RequestType: "GetStudyData",
        GUID: guid
    };

    if (_isDemo)
        param._edge = 1;

    $.getJSON(APIUrl, param).done(function (data) {
        success(data);

    })
        .fail(function (jqxhr, textStatus, error) {

            CheckSessionOut(jqxhr.responseText);
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);
        });
}

//--------------------------------------------

var _GetResultsListErrCount = 0;

function GetResultsList(StudyID, success) {
    var result = null;
    var param = {
        RequestType: "ResultsAll",
        StudyID: StudyID,
        errc: _GetResultsListErrCount

    };

    if (_isDemo)
        param._edge = 1;

    // $.getJSON(APIUrl, param).done(function (data, status, jqXHR) {

    $.getJSON(APIUrl, param).done(function (data) {

        success(data);
        _GetResultsListErrCount = 0;

    })

        .fail(function (jqxhr, textStatus, error) {

            CheckSessionOut(jqxhr.responseText);

            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);


            LogD('GetResultsList fail' + err);


            //////////
            if (false) {
                try {
                    var e = JSON.parse(jqxhr.responseText);
                    success(e);
                    return;
                } catch (ddddd) {
                    var a = 1;
                    a++;
                }
            }

            ///////////


//if(_GetResultsListErrCount  > 1)
            {
                var d = ParseResults(jqxhr.responseText);
                if (d != null) {
                    LogD('parse StudyID:' + StudyID);


                    if (_GetResultsListErrCount == 0)
                        if (d.length == 0) {
                            _GetResultsListErrCount++;

                            setTimeout(function () {
                                GetResultsList(StudyID, success);
                            }, RetrayWait);
                            return;
                        }

                    success(d);
                    return;
                }
            }

            //retray////
            if (_GetResultsListErrCount < RetrayCount) {
                _GetResultsListErrCount++;

                setTimeout(function () {
                    GetResultsList(StudyID, success);
                }, RetrayWait);

            } //end retray////
            else
                _reload();


        });
}

//--------------------------------------------

//--------------------------------------------

var _GetResultsSingleErrCount = 0;

function GetResultsSingle(SessionID, success) {
    var result = null;
    var param = {
        RequestType: "ResultsSingle",
        SessionID: SessionID,
        errc: _GetResultsSingleErrCount
    };

    $.getJSON(APIUrl, param).done(function (data) {

        success(data);
        _GetResultsSingleErrCount = 0;

    })

        .fail(function (jqxhr, textStatus, error) {

            CheckSessionOut(jqxhr.responseText);

            var err = textStatus + ", " + error;

            LogD('GetResultsSingle fail' + err);

            console.log("Request Failed: " + err);

            //retray////
            if (_GetResultsSingleErrCount < RetrayCount) {
                _GetResultsSingleErrCount++;

                setTimeout(function () {
                    GetResultsSingle(SessionID, success);
                }, RetrayWait);

            } //end retray////
            else
                _reload();


        });
}

//--------------------------------------------


//--------------------------------------------

function SaveDBAOI(GUID, data, success) {

    var param = {
        RequestType: "SaveAOI",
        GUID: GUID,
        data: data
    };

    $.post(APIUrl, param).done(function (data) {

        if (success != null)
            success(data);
    })

        .fail(function () {
            console.log("error");
        });
}

//------------------------------


function LoadDBAOI(GUID, success) {
    var result = null;
    var param = {
        RequestType: "GetAOI",
        GUID: GUID,
    };

    $.getJSON(APIUrl, param).done(function (data) {
        success(data);
    })

        .fail(function (jqxhr, textStatus, error) {

            CheckSessionOut(jqxhr.responseText);
            var err = textStatus + ", " + error;

            LogD('LoadDBAOI' + err);

            console.log("Request Failed: " + err);

            success(null);
        });
}

//--------------


//--------------------------------------------

var _CreateStudyErrCount = 0;
var _CreateStudyData = null;

function CreateStudy(data, GUID, success) {

    var result = null;
    var param = {
        RequestType: "CreateStudy",
        GUID: GUID,
        data: data,
        errc: _CreateStudyErrCount
    };

    _CreateStudyData = param;

    $.post(APIUrl, param).done(function (outdata) {

        var a = outdata;

        try {
            CheckSessionOut(outdata);
        } catch (eee) {
        }

        try {
            if (success != null)
                success();
        } catch (ee) {
        }

    })

        //   .fail(function() {

        .fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            LogD('CreateStudy fail' + err);

            CheckSessionOut(jqxhr.responseText);

            ///////retray//////////
            _CreateStudyErrCount++;

            if (_CreateStudyErrCount < 15) {

                setTimeout(function () {
                    CreateStudy(data, GUID, success);
                }, RetrayWait);

            } //end retray////

            ///////end retray//////////

            console.log("error");
        });

}

//---------------------
function ParseResults(txt) {

    try {
        var data = [];
        var tab = txt.split("\n");

        for (i = 0; i < tab.length; i++) {
            try {

                var tt = tab[i];

                if (tt.length < 2)
                    continue;

                var j = tt.substring(0, tt.length - 1);

                var e = JSON.parse(j);
                data.push(e);
            } catch (ee) {
                var a = 1;
                a++;
            }

        }
        LogD('ParseResults ok size:' + data.length + 'txt:' + txt.length);
        return data;
    } catch (e) {
        LogD('ParseResults exp');
    }
    return null;
}


//---------------------
function ParseStudyList(txt) {

    try {
        var data = [];
        var tab = txt.split("\n");


        for (i = 0; i < tab.length; i++) {
            try {

                var tt = tab[i];

                if (tt.length < 2)
                    continue;

                var j = tt.substring(0, tt.length - 1);

                var e = JSON.parse(j);
                data.push(e);
            } catch (ee) {
                var a = 1;
                a++;
            }

        }
        LogD('ParseStudyList ok size:' + data.length + 'txt:' + txt.length);
        return data;
    } catch (e) {
        LogD('ParseStudyList exp');
    }
    return null;
}

//---------------------
function KeepSession() {
    try {

        setTimeout(function () {

            var div = document.createElement('div');
            div.style.display = 'none';
            div.innerHTML = '<iframe src="https://app.gazerecorder.com/Study/KeepSession/"></iframe>';
            document.body.appendChild(div);
//document.body.innerHTML += '<div style="display:none"><iframe src="https://app.gazerecorder.com/Study/KeepSession/"></iframe></div>';
//}, 600);
        }, 600000);
    } catch (e) {
    }

}

KeepSession();

//---------------------
/////////
var LogTxt = '';

function LogD(txt, type = 0) {

    LogTxt += txt + ' | ';

    LogDSend();
}


function LogDSend() {

    if (LogTxt == '')
        return;
    txt = LogTxt;
    LogTxt = '';
    try {
        let req = new XMLHttpRequest();
        let formData = new FormData();
        req.withCredentials = false;
        // formData.append("RecordinSesionId", LogSesionID);
        formData.append("log", txt);
        //formData.append("type", type);
        formData.append("sesionid", 'null');
        formData.append("app", '1');


        req.open("POST", 'https://logs.gazerecorder.com/Logs.php');
        req.send(formData);
    } catch (e) {
    }
}


window.addEventListener('beforeunload', function (event) {
    LogDSend();
});

var PlayerWidth = 1024;
var PlayerHeight = 576;
var _togle;
var _BackWinTimeHeatMap = 0;

function GazePlayerAPI() {

    this.isPlaying = true;

    //------------------------
    this.Reload = function () {
        //

        this.isPlaying = true;

        var _ofsetT = replayer.getTimeOffset(); //2000;

        //PlayResults();

        try {
            GazePlayer.FinishPlay();
        } catch (e) {
        }

        var containter = document.body;
        if (PlayerContainer != null) {
            containter = PlayerContainer;
            containter.style.display = 'block';
        }
        if (__replayer_ != null) delete __replayer_;
        __replayer = new rrwebPlayer({
            target: containter,
            data: {

                //      events:eventsOnlyWeb,
                events,
                autoPlay: true,
                skipInactive: false
            },
        });
        __replayer_ = __replayer;
        replayer = __replayer._state.replayer;
        if (true) {
            var cc = document.getElementsByClassName('switch svelte-a6h7w7')[0];
            cc.style.display = 'none';
        }

        //////////////events//////////
        try {

            replayer.on("fullsnapshot-rebuilded", () => {
                bisRady = true;
                InitializeGazePlot();
            });

            replayer.on("finish", () => {
                GazePlayer.isPlaying = false;
            });

            replayer.on("pause", () => {
                GazePlayer.isPlaying = false;
            });
            replayer.on("resume", () => {
                GazePlayer.isPlaying = true;
            });

            replayer.on("start", () => {
                GazePlayer.isPlaying = true;
            });

        } catch (ee) {
        }
        ////////////events////////

        replayer.play(_ofsetT);

        this.isPlaying = true;

    }

    //------------------------
    this.Resume = function () {
        //        replayer.resume(replayer.getCurrentTime());
        replayer.resume(replayer.getCurrentTime());

    }
    //------------------------
    this.Pause = function () {
        replayer.pause();
    }
    //------------------------
    var loadid = null;
    var bisRady = false;
    this._ShowLoadingContent = function (bloading = false) {
        ShowLoadingContent(bloading);
    }
    var _ofsetT = -1;
    var _LastSpeed = 1;

    function ShowLoadingContent(bloading = false) {

        //return;
        try {
            if (loadid == null) loadid = document.getElementById("loadid");
            if (bloading) {


                if (loadid.style.display == 'none') {
                    loadid.style.display = 'block';
                    bisRady = false;

                    if (false)//v2
                        window.setTimeout(function () {
                            bisRady = true
                            //}, 2000);
                        }, 5000);

                }
            } else {

                //  if (false) //v2
                if (!_isDocReadyToUse) {
                    window.setTimeout(function () {
                        ShowLoadingContent(false)
                    }, 100);
                }

                if (loadid.style.display == 'block') {

                    loadid.style.display = 'none';
                    if (true) try {
                        replayer.iframe.contentWindow.Clearheatmap();

//if(false)//v2
                        if (true) {
                            window.setTimeout(function () {
                                replayer.iframe.contentWindow.Clearheatmap();
                            }, 100);
                        }
                    } catch (w) {
                    }
                }
            }
        } catch (e) {
        }
    }

    let events = []; //= [];

    let eventsOnlyWeb = [];

    let GazeResultEvents = []; //= [];
    var replayer = null;
    var __replayer = null;
    var LastTimeR = 0;
    var bReinitHeatMap = false;

    function ReinitHeatMap() {
        bReinitHeatMap = true;
        return;
        try {
            replayer.iframe.contentWindow._Initheatmap(0);
        } catch (e) {
        }
    }

    ///////////////////////////////
    ////////////////////process events////////////////////////////////
    var _LastStarttime = 0;

    var _LastBIx = 0;

    function ResetGazeEvents() {
        try {
            var fLen = GazeResultEvents.length;

            for (i = 0; i < fLen; i++)
                GazeResultEvents[i].use = false;
        } catch (e) {
        }
    }

    //--------------------------

    var LastGazeIx = -1;

    function GetGazeEventsWinN(time, win) {
        var fLen = GazeResultEvents.length;
        if (fLen == 0) return null;

        var ev;
        var out = [];

        if (bIsBusy) {

            return out;
        }
        var startix = 0;
        if (LastGazeIx > 0)
            startix = LastGazeIx + 1;

        for (i = startix; i < fLen; i++) {
            ev = GazeResultEvents[i];
            if (ev.time == null) continue;
            if (ev.time > time) break;
            out.push(ev);
            LastGazeIx = i;
        }


//if(out.length > 10)
        if (out.length > 5) {
            out = events.slice(out.length - 10, out.length);
        }
        return out;
    }

    //--------------------------

    function GetGazeEventsWin(time, win) {

        return GetGazeEventsWinN(time, win);

        var BestIx = 0;
        var BestDif = 99999999999999;
        var fLen = GazeResultEvents.length;
        if (fLen == 0) return null;

        var startix = 0;

        if (Math.abs(GazeResultEvents[_LastBIx].time - time) < 1000) {
            startix = _LastBIx - 2;
        }

        if (startix < 0)
            startix = 0;

        for (i = startix; i < fLen; i++) {
            var ev = GazeResultEvents[i];

            if (ev.time == null) continue;
            if (ev.time > time) break;

            //var dif = Math.abs(ev.time - time);

            var dif = time - ev.time;
            if (dif < BestDif) {
                BestDif = dif;
                BestIx = i;
            } else break;
        }
        _LastBIx = _LastBIx;

        var out = [];

        if (BestDif > 1500)
            return out;

        if (!GazeResultEvents[BestIx].use) {
            out.push(GazeResultEvents[BestIx]);
            GazeResultEvents[BestIx].use = true;
        }

        BestIx--;

        for (i = BestIx; i > 0; i--) {
            var ee = GazeResultEvents[i];
            if (ee.time - time + win < 0 || ee.use) break;

            if (!ee.use) {
                out.push(ee);
                ee.use = true;
            }
        }
        return out;
    }

    //---------------------
    function GetGazeEvents(starttime, time) {
        const _maxTdif = 10000;
        try {

            if (_BackWinTimeHeatMap > 0) {
                _LastStarttime -= _BackWinTimeHeatMap;
                _BackWinTimeHeatMap = 0;

                replayer.iframe.contentWindow.Clearheatmap();
            }
        } catch (ee) {
        }
        ;

        if (starttime <= 0) starttime = _LastStarttime;
        if (_LastStarttime > time || time - _LastStarttime > _maxTdif) {
            var out = GetGazeEvent(time);
            if (_LastStarttime == out.time) return null;
            if (out) _LastStarttime = out.time;
            //if(false)
            return [out];
        }
        var BestIx = 0;
        var BestDif = 99999999999999;
        var fLen = GazeResultEvents.length;
        if (fLen == 0) return null;

        var startix = 0;

        if (Math.abs(GazeResultEvents[_LastBIx].time - time) < 1000) {
            startix = _LastBIx - 2;
        }

        if (startix < 0)
            startix = 0;

        for (i = startix; i < fLen; i++) {

            var ev = GazeResultEvents[i];

            if (ev.time == null) continue;
            if (ev.time <= _LastStarttime) continue;
            var dif = Math.abs(ev.time - starttime);
            if (dif < BestDif) {
                BestDif = dif;
                BestIx = i;
            } else break;
        }

        _LastBIx = _LastBIx;

        if (BestDif > _maxTdif) return null;
        var BestIx2 = BestIx;
        var BestDif2 = 99999999999999;
        for (i = BestIx; i < fLen; i++) {
            if (GazeResultEvents[i].time == null) continue;
            var dif = Math.abs(GazeResultEvents[i].time - time);
            if (dif < BestDif2) {
                BestDif2 = dif;
                BestIx2 = i;
            } else break;
        }

        var out = [];

        if (BestDif2 > _maxTdif)
            return out;

        if (BestIx2 > BestIx + 20) // tmp
        {
            BestIx = BestIx2 - 20;
            if (BestIx < 0) BestIx = 0;
        }

        for (i = BestIx; i <= BestIx2; i++)
            if (!GazeResultEvents[i].use) {
                out.push(GazeResultEvents[i]);
                GazeResultEvents[i].use = true;
            }

        //out.push(GazeResultEvents[i])
        // if(out.length < 2)
        //  return null;
        _LastStarttime = GazeResultEvents[BestIx2].time;
        return out;
    }

    //------------------------------------
    function GetGazeEvent(time) {
        var BestIx = 0;
        var BestDif = 99999999999999;
        var fLen = GazeResultEvents.length;
        if (fLen == 0) return null;
        //if(LastGetGazeEvent == null)
        //  LastGetGazeEvent =  GazeResultEvents[0] ;
        for (i = 0; i < fLen; i++) {
            if (GazeResultEvents[i].time == null) continue;
            if (GazeResultEvents[i].time > time) break;
            var dif = Math.abs(GazeResultEvents[i].time - time);
            if (dif < BestDif) {
                BestDif = dif;
                BestIx = i;
            } else break;
        }
        //if (BestDif > 200) return null;
        if (BestDif > 500) return null;
        var out = GazeResultEvents[BestIx];
        if (false) //smooth
        {
            var out = GazeResultEvents[BestIx];
            var next = GazeResultEvents[BestIx + 1];
            ;
            var t1 = Math.abs(out.time - time);
            var t2 = Math.abs(next.time - time);
            var alfa = t2 / (t1 + t2);
            alfa = alfa * alfa;
            var cp = Object.assign({}, out);
            cp.docX = alfa * cp.docX + (1.0 - alfa) * next.docX;
            cp.docY = alfa * cp.docY + (1.0 - alfa) * next.docY;
            out = cp;
        }
        LastGetGazeEvent = out;
        return out;
    }

    //------------------
    function ShiftStartRec() {
        //  return; //v2
        try {
            var t = null;
            var ix = 0;
            var ixEndSesion = -1;

            var cc = 0;

            //   if (false) //v2
            for (i = 0; i < events.length; i++)
                if (events[i].type == 13)
                    // if(events[i].type == 10)
                {
                    ix = i;
                    //   if (true) // next event
                    //       ix++;

                    //  t = events[ix].timestamp - 100;

                    t = events[ix].timestamp;
                    cc++;
                    if (cc > 10)
                        break;
                }

            if (t != null)
                for (i = 0; i <= ix; i++) events[i].timestamp = t;
            for (i = 0; i < events.length; i++)
                if (events[i].type == 14) {
                    ixEndSesion = i;
                    break;
                }
            if (ixEndSesion > 0) {
                events = events.slice(0, ixEndSesion);
            }
        } catch (ee) {
        }
    }

    //-------------------------
    function ShiftLodingTime() {
        return; //v2
        try {

            /*
                        if (true) //extract gaze events
                        {
                            if (GazeResultEvents.length < 1)
                                for (i = 0; i < events.length; i++) {
                                    if (events[i].type == 20) {
                                        var Gazeevent = events[i].data;
                                        GazeResultEvents.push(Gazeevent);
                                    }
            		else
            		{
            			  if (events[i].type <6)
            			eventsOnlyWeb.push(events[i]);

            		}

                                }
                        }
            */

            for (i = 1; i < events.length; i++) {
                if (events[i].type == 4 || events[i].type == 2) {
                    var t = events[i].timestamp;
                    for (j = i; j >= 0; j--)
                        //if (events[j].type == 3) {
                        if (events[j].type == 10) {
                            t = events[j].timestamp;
                            break;
                        }
                    var d = events[i].timestamp - t;
                    t += 500;
                    if (events[i].timestamp > t) events[i].timestamp = t; //+1200;
                }
            }

            ResetGazeEvents();
            /*



	for (i = 1; i < events.length; i++) {

		if (events[i].type == 4 || events[i].type == 2) {

			var t = events[i].timestamp;

			for (j = i; j >= 0; j--)

				if (events[j].type == 3) {

					t = events[j].timestamp;

					break;

				}

			var d = events[i].timestamp - t;



            t +=1000;

            if(events[i].timestamp > t)

			        events[i].timestamp = t; //+1200;

		}

	}

    */
            if (true) //gaze duration
            {
                var _min = 200;
                var fLen = GazeResultEvents.length;
                if (fLen == 0) return;
                GazeResultEvents[0].duration = 33;
                GazeResultEvents[fLen - 1].duration = 33;
                for (i = 1; i < fLen - 1; i++) {
                    var d1 = GazeResultEvents[i].time - GazeResultEvents[i - 1].time;
                    var d2 = GazeResultEvents[i + 1].time - GazeResultEvents[i].time;
                    //  GazeResultEvents[i].duration  = (d1 + d2)/2;
                    GazeResultEvents[i].duration = d1;
                    if (GazeResultEvents[i].duration < _min) _min = GazeResultEvents[i].duration;
                    //console.log( i + " d : " +    GazeResultEvents[i].duration);
                }
                for (i = 1; i < fLen - 1; i++)
                    if (GazeResultEvents[i].duration > 3 * _min) GazeResultEvents[i].duration = 3 * _min;
            }
        } catch (ee) {
        }
    }

    //----------------------

    function isOkEvent(e) {
        try {
            if (typeof e.timestamp == "undefined")
                return false;

            if (typeof e.type != 'number')
                return false;

            return true;
        } catch (ee) {
            return false;
        }

    }

    //-------------
    function FilterBadEvents() {
        try {
            var n = [];

            for (i = 0; i < events.length; i++) {
                if (isOkEvent(events[i])) {

                    if (events[i].type == 20) {
                        var Gazeevent = events[i].data;

                        if (Gazeevent.state == -30)
                            Gazeevent.state = 0;

                        GazeResultEvents.push(Gazeevent);
                    }

                    //else
                    if (events[i].type < 100)
                        n.push(events[i]);
                }

            }

            events = n;
        } catch (ee) {
        }
    }

    //----------------------

    var eventsLoading = [];

    function CutEvents() {
        var ix = 0;
        var c = 0;
        for (i = 0; i < events.length; i++) {
            if (events[i].type == 4) // end loading
            {
                ix = i;
                if (c > 0)
                    break;
                c++;
            }

        }

        events = events.slice(ix, events.length);


        if (true) {
            try {
                for (i = 0; i < events.length; i++)

                    if (events[i].type == 20)
                        events[i].timestamp = events[i].data.time;

                events.sort(function (a, b) {
                    return a.timestamp < b.timestamp
                });
            } catch (aa) {
            }

        }


        var t0 = events[0].timestamp;
        for (i = 0; i < events.length; i++) {

            events[i].lt = events[i].timestamp;

            //   events[i].timestamp -= t0;
        }

    }

    function ProcessLoadingEvents() {

        try {

            FilterBadEvents();

            CutEvents();

            if (false)//////////tmp///////
            {
                try {
                    var buf = '';
                    for (i = 0; i < events.length; i++)
                        if (events[i].type == 152) // ini loading
                            buf += events[i].data;

                    var nr = events[i].i;
                    var aa = JSON.parse(buf);
                    var a = 1;
                    a++;
                } catch (yy) {
                }


                try {

                    var e = [];
                    var buf = '';
                    for (i = 0; i < events.length; i++)
                        if (events[i].type == 153) // ini loading
                        {

                            try {
                                var aa = JSON.parse(events[i].data);
                                var nr = events[i].i;
                                e.push(aa);
                                var a = 1;
                                a++;
                            } catch (tt) {
                            }
                        }
                } catch (yy) {
                }


            }//////////tmp///////


            var ee = [];
            var LastStartLoadIx = -1;

            //for (i = 1; i < events.length; i++) {
            for (i = 0; i < events.length; i++) {
                if (events[i].type == 10) // ini loading
                {
                    if (false) //v2
                        events[i].timestamp -= 5; // 50;

                    var cp = Object.assign({}, events[i]);
                    eventsLoading.push(cp);
                    LastStartLoadIx = i;
                    //  eventsLoading.push(events[i]);
                }

                if (events[i].type == 4) // end loading
                {
                    var cp = Object.assign({}, events[i]);
                    ee.push(cp);

                }
                ;

                //  if (events[i].type == 4) // end loading
                if (events[i].type == 11)// end loading
                {
                    var cp = Object.assign({}, events[i]);
                    cp.type = 11;

                    if (false) //v2
                        cp.timestamp -= 500;

                    eventsLoading.push(cp);
                }
            }


            if (true) {
                if (LastStartLoadIx > 0)
                    if (eventsLoading[eventsLoading.length - 1].type == 10) {
                        events = events.slice(0, LastStartLoadIx);
                    }

            }

            for (i = 1; i < eventsLoading.length; i++) {
                if (eventsLoading[i].type == 11) {
                    if (eventsLoading[i - 1].type == 10)
                        if (eventsLoading[i].timestamp <= eventsLoading[i - 1].timestamp) eventsLoading[i].timestamp = eventsLoading[i - 1].timestamp + 100;
                }
            }
            if (true) // loading hide gaze heatmap
            {
            } // end loading hide gaze
            if (true) //tmp no firtst
                eventsLoading[0].type = 11;

            if (true) //remove loading
            {

                for (i = 1; i < eventsLoading.length - 1; i++)
                    if (eventsLoading[i].type == 10) {
                        var t1 = eventsLoading[i].timestamp;
                        var t2 = eventsLoading[i + 1].timestamp;

                        var td = t2 - t1;
                        if (eventsLoading[i + 1].type != 11)
                            continue;

                        for (j = 0; j < events.length; j++) {

                            if (events[j].timestamp >= t1) {

                                if (events[j].timestamp < t2)
                                    events[j].timestamp = t1;

                                else
                                    events[j].timestamp -= td;
                            }
                        }
                        // for (j = i+1; j < eventsLoading.length;j++)

                        for (j = 0; j < eventsLoading.length; j++)
                            if (eventsLoading[j].timestamp >= t1)

                                eventsLoading[j].timestamp -= td;

                    }

                /////
                GazeResultEvents = [];
                ;
                for (i = 0; i < events.length; i++) {

                    if (events[i].type == 20) {
                        var Gazeevent = events[i].data;
                        //var Gazeevent = Object.assign({}, events[i].data);

                        var td = events[i].lt - events[i].timestamp;
                        Gazeevent.time -= td;

                        if (GazeResultEvents.length > 3)
                            if (Gazeevent.time <= GazeResultEvents[GazeResultEvents.length - 1].time)
                                continue;

                        if (Gazeevent.state == -30)
                            Gazeevent.state = 0;

                        GazeResultEvents.push(Gazeevent);
                    }

                }
//////////////

                if (true) //gaze duration
                {
                    var _min = 200;
                    var fLen = GazeResultEvents.length;
                    if (fLen == 0) return;
                    GazeResultEvents[0].duration = 33;
                    GazeResultEvents[fLen - 1].duration = 33;
                    for (i = 1; i < fLen - 1; i++) {
                        var d1 = GazeResultEvents[i].time - GazeResultEvents[i - 1].time;
                        var d2 = GazeResultEvents[i + 1].time - GazeResultEvents[i].time;
                        //  GazeResultEvents[i].duration  = (d1 + d2)/2;
                        GazeResultEvents[i].duration = d1;

                        if (GazeResultEvents[i].duration > 30)
                            if (GazeResultEvents[i].duration < _min) _min = GazeResultEvents[i].duration;
                        //console.log( i + " d : " +    GazeResultEvents[i].duration);
                    }
                    for (i = 1; i < fLen - 1; i++)
                        if (GazeResultEvents[i].duration > 3 * _min) GazeResultEvents[i].duration = 3 * _min;
                }

////////////
                ///
            }

            if (false)
                if (true) {

                    var n = [];

                    for (i = 0; i < events.length; i++)
                        if (events[i].type < 20)
                            n.push(events[i]);

                    n.push(events[events.length - 1]);
                    events = n;
                }

            return;

            for (i = 1; i < events.length; i++) {
                if (events[i].type > 4) {
                    if (events[i].type == 10) // ini loading
                        events[i].timestamp -= 10; // 50;
                    eventsLoading.push(events[i]);
                }
            }
        } catch (ee) {
        }
    }

    //----------------------
    function isLoading(time) {

        // 10 loadint // 11 finishloading // 12 err loading
        var e = null;
        for (i = 0; i < eventsLoading.length; i++) {
            //if (eventsLoading[i].timestamp > time) break;
            //e = eventsLoading[i];
            if (eventsLoading[i].timestamp > time) break;
            e = eventsLoading[i];
        }
        if (e == null) return false;
        if (e.type != 11) return true;
        return false;
    }

    function GetEndLoadingTime(time) {
        // 10 loadint // 11 finishloading // 12 err loading
        var e = null;
        for (i = 0; i < eventsLoading.length; i++) {
            if (eventsLoading[i].type == 11)
                if (eventsLoading[i].timestamp >= time) {
                    e = eventsLoading[i];
                    break;
                }
        }
        if (e == null) return time;
        //if (e.type != 11) return true;
        return e.timestamp;
    }

    ////////////////////end process events////////////////////////////////
    var PlayerContainer = null;
    this.SetCountainer = function (elem) {
        PlayerContainer = elem;
    }
    //----------------------
    this.PlayResultsData = function (data) {
        try {
            this.FinishPlay();
        } catch (e) {
        }
        events = data.webevents;
        GazeResultEvents = data.gazeevents;
        ProcessLoadingEvents();
        ShiftLodingTime();
        //ProcessLoadingEvents();
        PlayResults();
    }
    //----
    //===============================
    function lzw_decode(s) {

        try {
            var dict = new Map(); // Use a Map!
            var data = Array.from(s + "");
            //var data = (s + "").split("");
            var currChar = data[0];
            var oldPhrase = currChar;
            var out = [currChar];
            var code = 256; //codeInit;
            var phrase;
            for (var i = 1; i < data.length; i++) {
                var currCode = data[i].codePointAt(0);
                if (currCode < 256) {
                    phrase = data[i];
                } else {
                    phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
                }
                out.push(phrase);
                var cp = phrase.codePointAt(0);
                currChar = String.fromCodePoint(cp); //phrase.charAt(0);
                dict.set(code, oldPhrase + currChar);
                code++;
                if (code === 0xd800) {
                    code = 0xe000;
                }
                oldPhrase = phrase;
            }
            // if(false)
            //if(bUseUnicode)//decode
            {
                var ss = out.join("");
                var data = (ss + "").split("");
                //var  data = out;//Array.from(back + "");
                var uint8array = new Uint8Array(data.length); //[];// new TextEncoder("utf-8").encode(s);
                for (var i = 0; i < data.length; i++)
                    //uint8array.push(data[i].codePointAt(0));
                    uint8array[i] = data[i].codePointAt(0);
                var back = new TextDecoder().decode(uint8array);
                return back;
            }
            return out.join("");

        } catch (ee) {
            LogP(' lzw_decode err, event count:' + events.length);
        }
    }

    //===============================

    var getRecErrCount = 0;
    var getRecErrCountSesionId = null;

    function GetRecOnErr() {
        getRecErrCount++;
        if (getRecErrCount < 3) {

            window.setTimeout(function () {
                GazePlayer.PlayResultsGet(getRecErrCountSesionId);
            }, 2000);
        } else {
            ShowLoadingContent(false);
            LogP('No data null : ' + SesionId);

        }

    }

    //--------------------------------

    this.PlayResultsGet = function (SesionId) {
        getRecErrCountSesionId = SesionId;
        InitGUI();
        ShowLoadingContent(true);

        if (true) //compress
        {
            let req = new XMLHttpRequest();
            var url = "https://app.gazerecorder.com/GetWebRec.php?_edge=1&compress=1&SesionID=" + SesionId;

            if (getRecErrCount > 0)
                url += '&errC=' + getRecErrCount;

            req.open("GET", url);
            req.send(null);

            req.onerror = GetRecOnErr;

            req.onload = function (e) {

                try {

                    if (req.status != 200) {
                        GetRecOnErr();
                        return;
                    }

                } catch (eee) {
                }

                var t = req.responseType;
                var tt = t;

                var ss = "";
                //var s = req.response;
                var s = req.responseText;
                var back = lzw_decode(s);

                var size = back.length;

                var data = null;

                try {
                    data = JSON.parse(back);
                    events = data
                } catch (e) {

                    if (true) {
                        const space = "} , {";
                        // const space = "} , \n{";
                        // const space = "}   ,    {";
                        var nn = back.length;
                        nn++;
                        var n = back.lastIndexOf(space);
                        //n/=2;
                        back = back.substr(0, n + 2);
                        s = "[ " + back + "]";
                        ss = back;
                    } else {
                        s = "[ " + back.substring(0, back.length - 2) + "]";
                    }

                    try {
                        data = JSON.parse(s);
                        events = data
                    } catch (e) {
                        events = [];
                        var dd = ss.split("} , ");
                        for (i = 0; i < dd.length - 1; i++) {
                            try {
                                var event = JSON.parse(dd[i] + "}");
                                events.push(event);
                            } catch (ee) {
                            }
                        }
                        var a = 1;
                    }

                    LogP(' JSON.parse err, event count:' + events.length + ' size: ' + size + ' | ' + SesionId);

                }
                ;

                if (false)
                    if (events.length < 2) {
                        console.log(" events.length", events.length);
                        return;
                    }
                try {
                    //  ProcessLoadingEvents();
                    //ShiftStartRec();
                    var url = new URL(window.location.href);
                    var AllSesion = url.searchParams.get("allsession");
                    if (AllSesion == null) {
                        ProcessLoadingEvents();

                        ShiftStartRec();
                        ShiftLodingTime();
                    }

                    //ProcessLoadingEvents();
                    PlayResults();

                    if (true) // tmp no data
                        if (events.length < 2) {
                            console.log(" events.length", events.length);
                            ShowLoadingContent(false);
                            LogP('No data ' + SesionId + ' size: ' + size + ' ec: ' + events.length);
                        }

                } catch (ee) {

                    LogP(' exp No data ' + SesionId + ' size: ' + size);

                    ShowLoadingContent(false);
                    document.getElementById("nodataid").style.display = 'block';
                }
            }
        } //end compress
    }
    //------------------------
    var ScriptHeatMapAdded = false;
    var ScriptYouTubeAdded = false;

    //------------------------

    function _getIFrameDoc() {
        var doc = replayer.iframe.contentDocument || replayer.iframe.contentWindow.document;
        if (doc.document) doc = doc.document;
        return doc;
    }

    //------------------------

    function InitializeGazePlot() {

        //   var doc = replayer.iframe.contentDocument || replayer.iframe.contentWindow.document;

        //if (doc .document)doc = doc.document;

        var doc = _getIFrameDoc();
        ///////////////////////
        var ok = false;
        try {
            var headd = doc.head;
            if (headd != null) ok = true;


            if (false)//v2
                if (!_isDocReadyToUse) //v22
                    ok = false;

        } catch (e) {
        }


        if (!ok) {
            window.setTimeout(InitializeGazePlot, 100);
            return;
        }
        /////////////////////////

        if (typeof replayer.iframe.contentWindow.Initheatmap === 'undefined') {

            var script = doc.createElement('script');
            script.onload = function () {
                replayer.iframe.contentWindow.CheckInitializedHeatMap();
                ScriptHeatMapAdded = true;
                replayer.iframe.contentWindow._Initheatmap(0);

            };

            script.src = "https://app.gazerecorder.com/heatmapLive.js";
            //script.src = "https://app.gazerecorder.com/heatmapLive.min.js";

            var headd = replayer.iframe.contentWindow.document.head;
            headd.appendChild(script); //or something of the likes
            console.log(" add heat map script");

            if (!ScriptYouTubeAdded)
                if (true) //youtube
                {
                    var tag = doc.createElement('script');
                    tag.onload = function () {
                        ScriptYouTubeAdded = true;
                        var a = 1;
                        a++;
                    };
                    tag.src = "https://app.gazerecorder.com/youtubeplayer.js";
                    headd.appendChild(tag); //or something of the likes
                }

            ResetGazeEvents();
        }
        try {
            if (ScriptHeatMapAdded) replayer.iframe.contentWindow._Initheatmap(0);
        } catch (e) {
        }
    }

    //------------------
    var GazePloLoop = null;
    var _InactiveCount = 0;
    var _LastGazePlotTime = Date.now();
    var _LastGazePlotTimePP = Date.now();

    var LastRefreshHeatValue = 0;

    var _DelayStyleSetCount = 100;
    var _bCheckClearHeatMapE = true;
    var _img = null;
    var _Delay_imgC = 100;

    //----------------------

    function _StartGazePloLoop() {

        try {

            var dif = Date.now() - _LastGazePlotTime;

            if (!_isDocReadyToUse || bIsBusy) //v22
                dif = 0;

            if (dif < 30) {

                window.setTimeout(function () {
                    requestAnimationFrame(_StartGazePloLoop);
                }, 3);

                return;
            }

            _LastGazePlotTime = Date.now();
            try {
                if (!bisRady) {

                    //window.setTimeout(function() {requestAnimationFrame(_StartGazePloLoop);}, 10);

                    requestAnimationFrame(_StartGazePloLoop);
                    return;
                }
                //     var doc = replayer.iframe.contentDocument;
                var doc = _getIFrameDoc();
                var win = replayer.iframe.contentWindow;
                var t = replayer.baselineTime + replayer.timer.timeOffset;
                t += 33;
                if (t == LastTimeR) // pause
                {
                    _InactiveCount++;
                    // if(_InactiveCount > 2)
                    {
                        ShowLoadingContent(false);
                        requestAnimationFrame(_StartGazePloLoop);
                        return;
                    }
                } else _InactiveCount = 0;

                if (false) //v2
                    ShowLoadingContent(isLoading(t));

                LastTimeR = t;
                //console.log(" baselineTime" + replayer.baselineTime + " ofset " +replayer.timer.timeOffset  );
                var x = -100;
                var y = -100;
                var GazeData; //= GetGazeEvent(t);
                var scrollY = Math.max(doc.body.scrollTop, win.scrollY)
                var scrollX = Math.max(doc.body.scrollLeft, win.scrollX)

                if (true) //iframe/////
                {

                    if (true) //add heatmap
                    {

                        try {
                            var _heatmapIFrame = replayer.iframe.contentWindow.heatmap;
                            if (ScriptHeatMapAdded)
                                if (_heatmapIFrame != null)
                                    // if (GazeData != null)
                                {

                                    if (_bCheckClearHeatMapE) //////clear heat map//////////
                                    {

                                        var relem = doc.getElementById("RefreshHeatMapId");
                                        if (relem != null) {
                                            var v = doc.getElementById("RefreshHeatMapId").value;

                                            if (v != LastRefreshHeatValue) {
                                                LastRefreshHeatValue = v;
                                                replayer.iframe.contentWindow.Clearheatmap();
                                            }

                                        } else
                                            _bCheckClearHeatMapE = false;

                                    }
                                    //////end clear heat map//////////

                                    //  var GazeE = GetGazeEvents(-1, t);
                                    var GazeE = null;
                                    if (_BackWinTimeHeatMap > 0)
                                        GazeE = GetGazeEvents(-1, t);
                                    else
                                        GazeE = GetGazeEventsWin(t, 80);

                                    if (GazeE)
                                        if (GazeE.length > 0) {

                                            if (true) {

                                                GazeData = GazeE[GazeE.length - 1];

                                                x = GazeData.docX;
                                                y = GazeData.docY;
                                                if (true) {
                                                    x += scrollX;
                                                    y += scrollY;
                                                }

                                                if (GazeData.state != 0)
                                                    GazeData = null;
                                            }

                                            var _data = [];

                                            for (i = 0; i < GazeE.length; i++) {
                                                var g = GazeE[i];
                                                if (g.state != 0) continue;
                                                var v = g.duration / 33;

                                                if (v > 5) v = 5;

                                                var _x = g.docX + scrollX;
                                                var _y = g.docY + scrollY;


                                                /*
                                            if (true)

			{
                                                var pix =10;// 30;
                                                _x = Math.round(_x / pix) * pix;
                                                _y = Math.round(_y / pix) * pix;
                                            }
*/
                                                _data.push({
                                                    x: _x,
                                                    y: _y,
                                                    value: v
                                                });

                                            }
                                            ;

                                            _DelayStyleSetCount++;
                                            //if(_DelayStyleSetCount > 10)
                                            if (_DelayStyleSetCount > 30) {
                                                _DelayStyleSetCount = 0;
                                                doc.getElementById('heatmapContainer').style.zIndex = "999999";
                                                doc.getElementById('heatmapContainerWrapper').style.zIndex = "999999";
                                                //replayer.iframe.contentWindow.CheckInitializedHeatMap();


                                            }

                                            replayer.iframe.contentWindow.CheckInitializedHeatMap();

                                            replayer.iframe.contentWindow.heatmap.addData(_data);
                                        }
                                }

                        } catch (eee) {
                            console.log(" heat map exeption");
                        }
                    } ////////////////end add heatmap//////////////////////

                    var _dif = Date.now() - _LastGazePlotTimePP;

                    if (_dif > 60)
                        if (true) //////gaze plot//////
                        {
                            _LastGazePlotTimePP = Date.now();
                            //var _img = document.getElementById("gazeimg");

                            //    var _img = doc.getElementById("gazeimg");

                            if (_Delay_imgC > 10) {
                                _img = doc.getElementById("gazeimg");
                                _Delay_imgC = 0;
                            }
                            _Delay_imgC++;

                            if (_img == null) {
                                var itm = document.createElement('div');
                                itm.id = 'gazeimg';

                                itm.style = 'position: absolute;	display:none;	top: 120px;	left: 100px;	width: 150px;	height: 150px;	border-radius: 50%;	border: solid 2px  rgba(255, 255,255, .2);	box-shadow: 0 0 50px 3px rgba(125, 125,125, .9);	pointer-events: none;	z-index: 9999999';

                                doc.body.appendChild(itm);
                                _img = itm;
                            }
                            if (GazeData != null) {
                                x -= _img.clientWidth / 2;
                                y -= _img.clientHeight / 2;
                                //    if (GazeData != null)
                                {
                                    var _x = x + "px";
                                    var _y = y + "px";
                                    var dif = Math.sqrt((x - _Lastx) * (x - _Lastx) + (y - _Lasty) * (y - _Lasty));

                                    if (dif > 8)

                                        //if(true)
                                    {
                                        _img.style.left = _x;
                                        _img.style.top = _y;
                                        _Lastx = x;
                                        _Lasty = y;
                                        if (_img.style.display != 'block') _img.style.display = 'block';
                                        //  console.log("  change position"  )
                                    } else {
                                        // console.log(" no change position"  )
                                    }
                                }
                                if (GazeData == null) {
                                    _img.style.display = 'none';
                                }
                                if (GazeData.state != 0) _img.style.display = 'none';
                            }
                        } //////end gaze plot//////
                } //end iframe/////
            } catch (tt) {

            }
            ;

            {
                window.setTimeout(function () {
                    requestAnimationFrame(_StartGazePloLoop);
                    //    }, 30);
                }, 60);

                return;
            }

            requestAnimationFrame(_StartGazePloLoop);

        } catch (eeee) {

            console.log("GazePloLoop exept");
            requestAnimationFrame(_StartGazePloLoop);
        }
    }

    //------------------
    function StartGazePloLoop() {
        _StartGazePloLoop();
        return;
        if (GazePloLoop != null) clearInterval(GazePloLoop);
        GazePloLoop = setInterval(function () {
            try {
                if (!bisRady) return;
                //                    var doc = replayer.iframe.contentDocument;
                var doc = _getIFrameDoc();
                var win = replayer.iframe.contentWindow;
                var t = replayer.baselineTime + replayer.timer.timeOffset;
                if (t == LastTimeR) // pause
                {
                    _InactiveCount++;
                    // if(_InactiveCount > 2)
                    {
                        // var isloadin=isLoading(t);
                        // if(!_SkipLoading)
                        //  if(!isLoading(t))
                        ShowLoadingContent(false);
                        return;
                    }
                } else _InactiveCount = 0;
                ShowLoadingContent(isLoading(t));

                LastTimeR = t;
                //console.log(" baselineTime" + replayer.baselineTime + " ofset " +replayer.timer.timeOffset  );
                var x = -100;
                var y = -100;
                var GazeData = GetGazeEvent(t);
                var scrollY = Math.max(doc.body.scrollTop, win.scrollY)
                var scrollX = Math.max(doc.body.scrollLeft, win.scrollX)
                if (GazeData == null) return;
                if (GazeData != null) {
                    x = GazeData.docX;
                    y = GazeData.docY;
                    if (true) {
                        var scrollY = Math.max(doc.body.scrollTop, win.scrollY)
                        var scrollX = Math.max(doc.body.scrollLeft, win.scrollX)
                        x += scrollX;
                        y += scrollY;
                    }
                }
                if (true) //iframe/////
                {
                    //if(false)
                    if (true) //add heatmap
                    {
                        try {
                            var _heatmapIFrame = replayer.iframe.contentWindow.heatmap;
                            if (ScriptHeatMapAdded)
                                if (_heatmapIFrame != null)
                                    if (GazeData != null) {
                                        //if (GazeData.state != -1)//if (GazeData.state == 0) {
                                        doc.getElementById('heatmapContainer').style.zIndex = "999999";
                                        doc.getElementById('heatmapContainerWrapper').style.zIndex = "999999";
                                        if (false) replayer.iframe.contentWindow._adddata_(x, y, 1);
                                        else {
                                            var GazeE = GetGazeEvents(-1, t);
                                            if (GazeE) {
                                                //  console.log(" GazeE.length " + GazeE.length );
                                                for (i = 0; i < GazeE.length; i++) replayer.iframe.contentWindow._adddata_(GazeE[i].docX + scrollX, GazeE[i].docY + scrollY, 1);
                                            }
                                        }
                                    }
                        } catch (eee) {
                            console.log(" heat map exeption");
                        }
                    } ////////////////end add heatmap//////////////////////
                    if (true) //////gaze plot//////
                    {
                        //var _img = document.getElementById("gazeimg");
                        var _img = doc.getElementById("gazeimg");
                        if (_img == null) {
                            //var itm = document.getElementById("gazeimg")
                            //_img = itm.cloneNode(true);
                            var itm = document.createElement('div');
                            itm.id = 'gazeimg';
                            //itm.style = 'position: absolute;	display:none;	top: 120px;	left: 100px;	width: 120px;	height: 120px;	border-radius: 50%;	border: solid 2px  rgba(255, 255,255, .2);	box-shadow: 0 0 100px 3px rgba(125, 125,125, .9);	pointer-events: none;	z-index: 9999';

                            itm.style = 'position: absolute;	display:none;	top: 120px;	left: 100px;	width: 150px;	height: 150px;	border-radius: 50%;	border: solid 2px  rgba(255, 255,255, .2);	box-shadow: 0 0 50px 3px rgba(125, 125,125, .9);	pointer-events: none;	z-index: 9999999';

                            doc.body.appendChild(itm);
                        }
                        //x -= _img.width / 2;
                        //y -= _img.height / 2;
                        x -= _img.clientWidth / 2;
                        y -= _img.clientHeight / 2;
                        if (GazeData != null) {
                            var _x = x + "px";
                            var _y = y + "px";
                            var dif = Math.sqrt((x - _Lastx) * (x - _Lastx) + (y - _Lasty) * (y - _Lasty));
                            //if(_img.style.left !=_x || _img.style.top !=_y )
                            if (dif > 5) {
                                _img.style.left = _x;
                                _img.style.top = _y;
                                _Lastx = x;
                                _Lasty = y;
                                if (_img.style.display != 'block') _img.style.display = 'block';
                                //  console.log("  change position"  )
                            } else {
                                // console.log(" no change position"  )
                            }
                        }
                        if (false) {
                            if (GazeData.state != 0) _img.style.display = 'none';
                            else _img.style.display = 'block';
                        }
                    } //////end gaze plot//////
                    return;
                } //end iframe/////
            } catch (tt) {
            }
            ;
            //}, 35);
        }, 30);
        //}, 200);
    }

    //--------------------
    var _Lastx = 0;
    var _Lasty = 0;
    /*



    class Replayer {

      public wrapper: HTMLDivElement;



      constructor(events: eventWithTime[], config?: Partial<playerConfig>);



      public on(event: string, handler: mitt.Handler): void;

      public setConfig(config: Partial<playerConfig>): void;

      public getMetaData(): playerMetaData;

      public getTimeOffset(): number;

      public play(timeOffset?: number): void;

      public pause(): void;

      public resume(timeOffset?: number): void;

    }



    type playerConfig = {

      speed: number;

      root: Element;

      loadTimeout: number;

      skipInactive: Boolean;

    };



    type playerMetaData = {

      totalTime: number;

    };



    */
    //---------------------------
    var __replayer_ = null;
    this.FinishPlay = function () {

        ScriptHeatMapAdded = false;
        ScriptYouTubeAdded = false;

        if (__replayer_ != null) delete __replayer_;

        if (replayer != null) delete replayer

        if (GazePloLoop != null) clearInterval(GazePloLoop);
        if (PlayerContainer != null) PlayerContainer.innerHTML = '';

    }
    //---------------------------
    var _SkipLoading = true;

    var _bIsBusy = false;
    var _BusyC = 0;
    var setFocusW = false;

    function CheckIsReady() {

        _BusyC++;
        if (_BusyC > 10) {

            LastGazeIx = -1;
            replayer.config.speed = _LastSpeed;
            ShowLoadingContent(false);
            bIsBusy = false;

        } else
            setTimeout(CheckIsReady, 3);
    }

    function PlayResults() {

        //if(false)
        if (true)
            if (!setFocusW) {
                setFocusW = true;
                setInterval(function () {
                    window.focus();
                }, 2000);
                //}, 100);

            }

        InitGUI();

        try {
            GazePlayer.FinishPlay();
        } catch (e) {
        }

        //this.FinishPlay();
        //ShowLoadingContent(false);
        ShowLoadingContent(true);
        if (false) {
            replayer = new rrweb.Replayer(events);
            replayer.play();
            replayer.setConfig({
                speed: 1,
                root: document.body,
                loadTimeout: 10,
                skipInactive: true
            });
        } else {
            var containter = document.body;
            if (PlayerContainer != null) {
                containter = PlayerContainer;
                containter.style.display = 'block';
            }
            if (__replayer_ != null) delete __replayer_;
            __replayer = new rrwebPlayer({
                target: containter,
                data: {

                    //      events:eventsOnlyWeb,
                    events,
                    autoPlay: true,
                    //autoPlay: false,

                    skipInactive: false
                },
            });
            __replayer_ = __replayer;
            replayer = __replayer._state.replayer;
            if (true) {
                var cc = document.getElementsByClassName('switch svelte-a6h7w7')[0];
                cc.style.display = 'none';
            }
        }
        //////////////events//////////
        try {
            replayer.on("load-stylesheet-end", () => {
                var a = 1;
                a++;
            });


            replayer.on("finish", () => {
                GazePlayer.isPlaying = false;
            });

            replayer.on("pause", () => {
                GazePlayer.isPlaying = false;
            });
            replayer.on("resume", () => {
                GazePlayer.isPlaying = true;
            });

            replayer.on("start", () => {
                GazePlayer.isPlaying = true;
                ResetGazeEvents();

            });

            replayer.on("load-stylesheet-start", () => {
                console.log(" fload-stylesheet-start");
            });
            replayer.on("load-stylesheet-end", () => {
                console.log(" fload-stylesheet-end");
            });

            // replayer.on("skip-start", () => { console.log(" skip-start"  );});
            replayer.on("FullsnapshotStart", () => {


                ShowLoadingContent(true);


                if (false) {

                    if (loadid == null) loadid = document.getElementById("loadid");
                    loadid.style.display = 'block';
                }

                LastGazeIx = -1;


                bIsBusy = true;
                console.log(" FullsnapshotStart");

                _LastSpeed = replayer.config.speed;
                if (_LastSpeed < 1)
                    _LastSpeed = 1;
                replayer.config.speed = .001;
                _BusyC = 0;
                //setTimeout(function(){ ShowLoadingContent(true);},30);


                //console.log("fullsnapshot start");
                ShowLoadingContent(true);
            });

            replayer.on("fullsnapshot-rebuilded", () => {
                LastGazeIx = -1;

                if (replayer.config.speed < 1) {

                    CheckIsReady();

                }

                bisRady = true;
                console.log(" fullsnapshot-rebuilded");
                if (_SkipLoading) {
                    if (false) {
                        var t = replayer.baselineTime + replayer.timer.timeOffset;
                        var tt = GetEndLoadingTime(t);
                        var dd = tt - t;
                        console.log("shift t " + dd);
                        if (dd > 100) replayer.resume(replayer.timer.timeOffset + dd);
                        // window.setTimeout(function() { ShowLoadingContent(false);}, 200);
                        // ShowLoadingContent(false);
                    }
                }
                InitializeGazePlot();

                //  ShowLoadingContent(false);

            });
            if (false) {
                replayer.iframe.contentDocument.addEventListener("DOMNodeInserted", function (ev) {
                    replayer.iframe.contentWindow._Initheatmap(0);
                }, false);
                replayer.iframe.contentDocument.addEventListener("DOMAttrModified", function (ev) {
                    replayer.iframe.contentWindow._Initheatmap(0);
                }, false);
                replayer.iframe.contentDocument.addEventListener("DOMSubtreeModified", function (ev) {
                    replayer.iframe.contentWindow._Initheatmap(0);
                }, false);
            }
        } catch (ee) {
        }
        ////////////events////////
        StartGazePloLoop();

    }

    function getCoords(elem) { // crossbrowser version
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docEl = document.documentElement;
        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return {
            top: Math.round(top),
            left: Math.round(left)
        };
    }

    ///////////
    var bGuiInitialized = false;

    function InitGUI() {
        if (bGuiInitialized) return;
        bGuiInitialized = true;
        var _html = '<div id="loadid"  style= " height:100%; width:100%;left: 0px; position: fixed; top: 0%;display:none;opacity: 0.93; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> Loading...</h1> <div class="loader"></div> </div> <div id="_playerdiv_" style="background-color: white;position: absolute;top: 50%;left: 50%;margin-right: -50%; transform: translate(-50%, -50%) "></div>';

        _html += '<h1 id="nodataid"  style= " color:white; display:none ; position:absolute;left:50%; top:30% ; transform: translate(-50%, 0%);z-index: 999999;">No data</h1>';

        var _style = ' <link rel="stylesheet" href="https://app.gazerecorder.com/GazePlayerStyle.css"/>'

        _style = "<style>.rr-player.svelte-1wetjm2{width:100%;background:#fff;border-radius:5px;box-shadow:0 24px 48px rgba(17,16,62,.12)}.rr-player__frame.svelte-1wetjm2{overflow:hidden;background-color:#000}.replayer-wrapper{float:left;clear:both;transform-origin:top left;left:50%;top:50%;background-color:#000}.replayer-wrapper>iframe{border:none}.rr-controller.svelte-1cgfpn0{width:100%;height:80px;background:#fff;display:flex;flex-direction:column;justify-content:space-around;align-items:center;border-radius:0 0 5px 5px}.rr-timeline.svelte-1cgfpn0{width:80%;display:flex;align-items:center}.rr-timeline__time.svelte-1cgfpn0{padding:0 20px;color:#11103e}.rr-progress.svelte-1cgfpn0{width:100%;height:12px;background:#eee;position:relative;border-radius:3px;cursor:pointer;box-sizing:border-box;border-top:solid 4px #fff;border-bottom:solid 4px #fff}.rr-progress.disabled.svelte-1cgfpn0{cursor:not-allowed}.rr-progress__step.svelte-1cgfpn0{height:100%;position:absolute;left:0;top:0;background:#e0e1fe}.rr-progress__handler.svelte-1cgfpn0{width:20px;height:20px;border-radius:10px;position:absolute;top:2px;transform:translate(-50%,-50%);background:#4950f6}.rr-controller__btns.svelte-1cgfpn0{display:flex;align-items:center;justify-content:center;font-size:13px}.rr-controller__btns.svelte-1cgfpn0 button.svelte-1cgfpn0{width:32px;height:32px;display:flex;padding:0;align-items:center;justify-content:center;background:0 0;border:none;border-radius:50%;cursor:pointer}.rr-controller__btns.svelte-1cgfpn0 button.svelte-1cgfpn0:active{background:#e0e1fe}.rr-controller__btns.svelte-1cgfpn0 button.active.svelte-1cgfpn0{color:#fff;background:#4950f6}.rr-controller__btns.svelte-1cgfpn0 button.svelte-1cgfpn0:disabled{cursor:not-allowed}.switch.svelte-a6h7w7{height:1em;display:flex;align-items:center}.switch.disabled.svelte-a6h7w7{opacity:.5}.label.svelte-a6h7w7{margin:0 8px}.switch.svelte-a6h7w7 input[type=checkbox].svelte-a6h7w7{position:absolute;opacity:0}.switch.svelte-a6h7w7 label.svelte-a6h7w7{width:2em;height:1em;position:relative;cursor:pointer;display:block}.switch.disabled.svelte-a6h7w7 label.svelte-a6h7w7{cursor:not-allowed}.switch.svelte-a6h7w7 label.svelte-a6h7w7:before{content:'';position:absolute;width:2em;height:1em;left:.1em;transition:background .1s ease;background:rgba(73,80,246,.5);border-radius:50px}.switch.svelte-a6h7w7 label.svelte-a6h7w7:after{content:'';position:absolute;width:1em;height:1em;border-radius:50px;left:0;transition:all .2s ease;box-shadow:0 2px 5px 0 rgba(0,0,0,.3);background:#fcfff4;animation:switch-off .2s ease-out;z-index:2}.switch input[type=checkbox]:checked+label.svelte-a6h7w7:before{background:#4950f6}.switch input[type=checkbox]:checked+label.svelte-a6h7w7:after{animation:switch-on .2s ease-out;left:1.1em}</style>";

        _html = _style + _html;
        document.body.insertAdjacentHTML('beforeend', _html);
        if (PlayerContainer == null) PlayerContainer = document.getElementById("_playerdiv_");
        PlayerContainer.style.backgroundColor = "white";
        if (false) //buttons
        {
            document.getElementById("loadid");
            var cc = document.getElementsByClassName('rr-controller__btns svelte-1cgfpn0')[0];
            var _gazeplot = '<div class="switch svelte-a6h7w7"><input type="checkbox" id="showHeatMapid" class="svelte-a6h7w7"> <label for="HeatMap" class="svelte-a6h7w7"></label> <span class="label svelte-a6h7w7">Heat Map</span></div>';
            cc.innerHTML += _gazeplot;
        }
        return;
        var r = document.getElementsByClassName('rr-player__frame svelte-1wetjm2')[0];
        var rr = document.getElementsByClassName('rr-player__frame.svelte-1wetjm2')[0];
        loadid.style.display = 'none';
        if (loadid == null) loadid = document.getElementById("loadid");
        loadid = document.createElement('div');
        loadid.style = document.getElementById("loadid").style;
        loadid.style.position = "relative";
        var ll = document.createElement('div');
        ll.clasName = "loader";
        loadid.appendChild(ll);
        r.appendChild(loadid);
        //loadid = document.getElementById("loadid");
    }

    /////////////////////////////

    var _isDocReadyToUse = false; //true;

    var rrwebPlayer = function () {
        "use strict";

        function e() {
        }

        function t(e, t) {
            for (var i in t) e[i] = t[i];
            return e
        }

        function i(e, t) {
            for (var i in t) e[i] = 1;
            return e
        }

        function n(e) {
            e()
        }

        function r(e, t) {
            e.appendChild(t)
        }

        function s(e, t, i) {
            e.insertBefore(t, i)
        }

        function o(e) {
            e.parentNode.removeChild(e)
        }

        function a(e) {
            return document.createElement(e)
        }

        function l(e) {
            return document.createElementNS("http://www.w3.org/2000/svg", e)
        }

        function c(e) {
            return document.createTextNode(e)
        }

        function u(e, t, i, n) {
            e.addEventListener(t, i, n)
        }

        function h(e, t, i, n) {
            e.removeEventListener(t, i, n)
        }

        function f(e, t, i) {
            null == i ? e.removeAttribute(t) : e.setAttribute(t, i)
        }

        function d(e, t) {
            e.data = "" + t
        }

        function p(e, t, i) {
            e.style.setProperty(t, i)
        }

        function m(e, t, i) {
            e.classList[i ? "add" : "remove"](t)
        }

        function g() {
            return Object.create(null)
        }

        function v(e) {
            e._lock = !0, w(e._beforecreate), w(e._oncreate), w(e._aftercreate), e._lock = !1
        }

        function y(e, t) {
            e._handlers = g(), e._slots = g(), e._bind = t._bind, e._staged = {}, e.options = t, e.root = t.root || e, e.store = t.store || e.root.store, t.root || (e._beforecreate = [], e._oncreate = [], e._aftercreate = [])
        }

        function w(e) {
            for (; e && e.length;) e.shift()()
        }

        var b, _ = {
                destroy: function (t) {
                    this.destroy = e, this.fire("destroy"), this.set = e, this._fragment.d(!1 !== t), this._fragment = null, this._state = {}
                },
                get: function () {
                    return this._state
                },
                fire: function (e, t) {
                    var i = e in this._handlers && this._handlers[e].slice();
                    if (i)
                        for (var n = 0; n < i.length; n += 1) {
                            var r = i[n];
                            if (!r.__calling) try {
                                r.__calling = !0, r.call(this, t)
                            } finally {
                                r.__calling = !1
                            }
                        }
                },
                on: function (e, t) {
                    var i = this._handlers[e] || (this._handlers[e] = []);
                    return i.push(t), {
                        cancel: function () {
                            var e = i.indexOf(t);
                            ~e && i.splice(e, 1)
                        }
                    }
                },
                set: function (e) {
                    this._set(t({}, e)), this.root._lock || v(this.root)
                },
                _recompute: e,
                _set: function (e) {
                    var i = this._state,
                        n = {},
                        r = !1;
                    for (var s in e = t(this._staged, e), this._staged = {}, e) this._differs(e[s], i[s]) && (n[s] = r = !0);
                    r && (this._state = t(t({}, i), e), this._recompute(n, this._state), this._bind && this._bind(n, this._state), this._fragment && (this.fire("state", {
                        changed: n,
                        current: this._state,
                        previous: i
                    }), this._fragment.p(n, this._state), this.fire("update", {
                        changed: n,
                        current: this._state,
                        previous: i
                    })))
                },
                _stage: function (e) {
                    t(this._staged, e)
                },
                _mount: function (e, t) {
                    this._fragment[this._fragment.i ? "i" : "m"](e, t || null)
                },
                _differs: function (e, t) {
                    return e != e ? t == t : e !== t || e && "object" == typeof e || "function" == typeof e
                }
            },
            k = function () {
                return (k = Object.assign || function (e) {
                    for (var t, i = 1, n = arguments.length; i < n; i++)
                        for (var r in t = arguments[i]) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r]);
                    return e
                }).apply(this, arguments)
            };
        !function (e) {
            e[e.Document = 0] = "Document", e[e.DocumentType = 1] = "DocumentType", e[e.Element = 2] = "Element", e[e.Text = 3] = "Text", e[e.CDATA = 4] = "CDATA", e[e.Comment = 5] = "Comment"
        }(b || (b = {}));
        var x = /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//g;

        function M(e, t) {
            void 0 === t && (t = {});
            var i = 1,
                n = 1;

            function r(e) {
                var t = e.match(/\n/g);
                t && (i += t.length);
                var r = e.lastIndexOf("\n");
                n = -1 === r ? n + e.length : e.length - r
            }

            function s() {
                var e = {
                    line: i,
                    column: n
                };
                return function (t) {
                    return t.position = new o(e), d(), t
                }
            }

            var o = function () {
                return function (e) {
                    this.start = e, this.end = {
                        line: i,
                        column: n
                    }, this.source = t.source
                }
            }();
            o.prototype.content = e;
            var a = [];

            function l(r) {
                var s = new Error(t.source + ":" + i + ":" + n + ": " + r);
                if (s.reason = r, s.filename = t.source, s.line = i, s.column = n, s.source = e, !t.silent) throw s;
                a.push(s)
            }

            function c() {
                return f(/^{\s*/)
            }

            function u() {
                return f(/^}/)
            }

            function h() {
                var t, i = [];
                for (d(), p(i); e.length && "}" !== e.charAt(0) && (t = N() || E());) !1 !== t && (i.push(t), p(i));
                return i
            }

            function f(t) {
                var i = t.exec(e);
                if (i) {
                    var n = i[0];
                    return r(n), e = e.slice(n.length), i
                }
            }

            function d() {
                f(/^\s*/)
            }

            function p(e) {
                var t;
                for (void 0 === e && (e = []); t = m();) !1 !== t && e.push(t), t = m();
                return e
            }

            function m() {
                var t = s();
                if ("/" === e.charAt(0) && "*" === e.charAt(1)) {
                    for (var i = 2;
                         "" !== e.charAt(i) && ("*" !== e.charAt(i) || "/" !== e.charAt(i + 1));) ++i;
                    if (i += 2, "" === e.charAt(i - 1)) return l("End of comment missing");
                    var o = e.slice(2, i - 2);
                    return n += 2, r(o), e = e.slice(i), n += 2, t({
                        type: "comment",
                        comment: o
                    })
                }
            }

            function g() {
                var e = f(/^([^{]+)/);
                if (e) return S(e[0]).replace(/\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*\/+/g, "").replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function (e) {
                    return e.replace(/,/g, "‌")
                }).split(/\s*(?![^(]*\)),\s*/).map(function (e) {
                    return e.replace(/\u200C/g, ",")
                })
            }

            function v() {
                var e = s(),
                    t = f(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
                if (t) {
                    var i = S(t[0]);
                    if (!f(/^:\s*/)) return l("property missing ':'");
                    var n = f(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/),
                        r = e({
                            type: "declaration",
                            property: i.replace(x, ""),
                            value: n ? S(n[0]).replace(x, "") : ""
                        });
                    return f(/^[;\s]*/), r
                }
            }

            function y() {
                var e, t = [];
                if (!c()) return l("missing '{'");
                for (p(t); e = v();) !1 !== e && (t.push(e), p(t)), e = v();
                return u() ? t : l("missing '}'")
            }

            function w() {
                for (var e, t = [], i = s(); e = f(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/);) t.push(e[1]), f(/^,\s*/);
                if (t.length) return i({
                    type: "keyframe",
                    values: t,
                    declarations: y()
                })
            }

            var b, _ = T("import"),
                k = T("charset"),
                M = T("namespace");

            function T(e) {
                var t = new RegExp("^@" + e + "\\s*([^;]+);");
                return function () {
                    var i = s(),
                        n = f(t);
                    if (n) {
                        var r = {
                            type: e
                        };
                        return r[e] = n[1].trim(), i(r)
                    }
                }
            }

            function N() {
                if ("@" === e[0]) return function () {
                    var e = s(),
                        t = f(/^@([-\w]+)?keyframes\s*/);
                    if (t) {
                        var i = t[1];
                        if (!(t = f(/^([-\w]+)\s*/))) return l("@keyframes missing name");
                        var n, r = t[1];
                        if (!c()) return l("@keyframes missing '{'");
                        for (var o = p(); n = w();) o.push(n), o = o.concat(p());
                        return u() ? e({
                            type: "keyframes",
                            name: r,
                            vendor: i,
                            keyframes: o
                        }) : l("@keyframes missing '}'")
                    }
                }() || function () {
                    var e = s(),
                        t = f(/^@media *([^{]+)/);
                    if (t) {
                        var i = S(t[1]);
                        if (!c()) return l("@media missing '{'");
                        var n = p().concat(h());
                        return u() ? e({
                            type: "media",
                            media: i,
                            rules: n
                        }) : l("@media missing '}'")
                    }
                }() || function () {
                    var e = s(),
                        t = f(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
                    if (t) return e({
                        type: "custom-media",
                        name: S(t[1]),
                        media: S(t[2])
                    })
                }() || function () {
                    var e = s(),
                        t = f(/^@supports *([^{]+)/);
                    if (t) {
                        var i = S(t[1]);
                        if (!c()) return l("@supports missing '{'");
                        var n = p().concat(h());
                        return u() ? e({
                            type: "supports",
                            supports: i,
                            rules: n
                        }) : l("@supports missing '}'")
                    }
                }() || _() || k() || M() || function () {
                    var e = s(),
                        t = f(/^@([-\w]+)?document *([^{]+)/);
                    if (t) {
                        var i = S(t[1]),
                            n = S(t[2]);
                        if (!c()) return l("@document missing '{'");
                        var r = p().concat(h());
                        return u() ? e({
                            type: "document",
                            document: n,
                            vendor: i,
                            rules: r
                        }) : l("@document missing '}'")
                    }
                }() || function () {
                    var e = s();
                    if (f(/^@page */)) {
                        var t = g() || [];
                        if (!c()) return l("@page missing '{'");
                        for (var i, n = p(); i = v();) n.push(i), n = n.concat(p());
                        return u() ? e({
                            type: "page",
                            selectors: t,
                            declarations: n
                        }) : l("@page missing '}'")
                    }
                }() || function () {
                    var e = s();
                    if (f(/^@host\s*/)) {
                        if (!c()) return l("@host missing '{'");
                        var t = p().concat(h());
                        return u() ? e({
                            type: "host",
                            rules: t
                        }) : l("@host missing '}'")
                    }
                }() || function () {
                    var e = s();
                    if (f(/^@font-face\s*/)) {
                        if (!c()) return l("@font-face missing '{'");
                        for (var t, i = p(); t = v();) i.push(t), i = i.concat(p());
                        return u() ? e({
                            type: "font-face",
                            declarations: i
                        }) : l("@font-face missing '}'")
                    }
                }()
            }

            function E() {
                var e = s(),
                    t = g();
                return t ? (p(), e({
                    type: "rule",
                    selectors: t,
                    declarations: y()
                })) : l("selector missing")
            }

            return function e(t, i) {
                var n = t && "string" == typeof t.type;
                var r = n ? t : i;
                for (var s = 0, o = Object.keys(t); s < o.length; s++) {
                    var a = o[s],
                        l = t[a];
                    Array.isArray(l) ? l.forEach(function (t) {
                        e(t, r)
                    }) : l && "object" == typeof l && e(l, r)
                }
                n && Object.defineProperty(t, "parent", {
                    configurable: !0,
                    writable: !0,
                    enumerable: !1,
                    value: i || null
                });
                return t
            }((b = h(), {
                type: "stylesheet",
                stylesheet: {
                    source: t.source,
                    rules: b,
                    parsingErrors: a
                }
            }))
        }

        function S(e) {
            return e ? e.replace(/^\s+|\s+$/g, "") : ""
        }

        var T = {
            script: "noscript",
            altglyph: "altGlyph",
            altglyphdef: "altGlyphDef",
            altglyphitem: "altGlyphItem",
            animatecolor: "animateColor",
            animatemotion: "animateMotion",
            animatetransform: "animateTransform",
            clippath: "clipPath",
            feblend: "feBlend",
            fecolormatrix: "feColorMatrix",
            fecomponenttransfer: "feComponentTransfer",
            fecomposite: "feComposite",
            feconvolvematrix: "feConvolveMatrix",
            fediffuselighting: "feDiffuseLighting",
            fedisplacementmap: "feDisplacementMap",
            fedistantlight: "feDistantLight",
            fedropshadow: "feDropShadow",
            feflood: "feFlood",
            fefunca: "feFuncA",
            fefuncb: "feFuncB",
            fefuncg: "feFuncG",
            fefuncr: "feFuncR",
            fegaussianblur: "feGaussianBlur",
            feimage: "feImage",
            femerge: "feMerge",
            femergenode: "feMergeNode",
            femorphology: "feMorphology",
            feoffset: "feOffset",
            fepointlight: "fePointLight",
            fespecularlighting: "feSpecularLighting",
            fespotlight: "feSpotLight",
            fetile: "feTile",
            feturbulence: "feTurbulence",
            foreignobject: "foreignObject",
            glyphref: "glyphRef",
            lineargradient: "linearGradient",
            radialgradient: "radialGradient"
        };
        var N = /([^\\]):hover/g;

        function E(e) {
            var t = M(e, {
                silent: !0
            });
            return t.stylesheet ? (t.stylesheet.rules.forEach(function (t) {
                "selectors" in t && (t.selectors || []).forEach(function (t) {
                    if (N.test(t)) {
                        var i = t.replace(N, "$1.\\:hover");
                        e = e.replace(t, t + ", " + i)
                    }
                })
            }), e) : e
        }

        function I(e, t, i) {
            switch (e.type) {
                case b.Document:
                    return t.implementation.createDocument(null, "", null);
                case b.DocumentType:
                    return t.implementation.createDocumentType(e.name, e.publicId, e.systemId);
                case b.Element:
                    var n = function (e) {
                            var t = T[e.tagName] ? T[e.tagName] : e.tagName;
                            return "link" === t && e.attributes._cssText && (t = "style"), t
                        }(e),
                        r = void 0;
                    for (var s in r = e.isSVG ? t.createElementNS("http://www.w3.org/2000/svg", n) : t.createElement(n), e.attributes)
                        if (e.attributes.hasOwnProperty(s) && !s.startsWith("rr_")) {
                            var o = e.attributes[s];
                            o = "boolean" == typeof o ? "" : o;
                            var a = "textarea" === n && "value" === s,
                                l = "style" === n && "_cssText" === s;
                            if (l && i && (o = E(o)), a || l) {
                                for (var c = t.createTextNode(o), u = 0, h = Array.from(r.childNodes); u < h.length; u++) {
                                    var f = h[u];
                                    f.nodeType === r.TEXT_NODE && r.removeChild(f)
                                }
                                r.appendChild(c);
                                continue
                            }

                            ////////////////////////
                            //if(false)
                            if ("iframe" === n && "src" === s) {
                                //continue;

                                if (r.id === "playerss") //youtube

                                    //var base = document.getElementsByTagName("Base")[0];
                                    //if(base != null)
                                    //if( base.href.includes('https://www.youtube.com/')  )
                                    continue;

                            }
                            /////////////////

                            try {
                                e.isSVG && "xlink:href" === s ? r.setAttributeNS("http://www.w3.org/1999/xlink", s, o) : r.setAttribute(s, o)
                            } catch (e) {
                            }
                        } else e.attributes.rr_width && (r.style.width = e.attributes.rr_width), e.attributes.rr_height && (r.style.height = e.attributes.rr_height);
                    return r;
                case b.Text:
                    return t.createTextNode(e.isStyle && i ? E(e.textContent) : e.textContent);
                case b.CDATA:
                    return t.createCDATASection(e.textContent);
                case b.Comment:
                    return t.createComment(e.textContent);
                default:
                    return null
            }
        }

        function C(e, t, i, n, r) {
            void 0 === n && (n = !1), void 0 === r && (r = !0);
            var s = I(e, t, r);
            if (!s) return null;
            if (e.type === b.Document && (t.close(), t.open(), s = t), s.__sn = e, i[e.id] = s, (e.type === b.Document || e.type === b.Element) && !n)
                for (var o = 0, a = e.childNodes; o < a.length; o++) {
                    var l = a[o],
                        c = C(l, t, i, !1, r);
                    c ? s.appendChild(c) : console.warn("Failed to rebuild", l)
                }
            return s
        }

        var L, D, A, F, z = {
            map: {},
            getId: function (e) {
                return e.__sn ? e.__sn.id : -1
            },
            getNode: function (e) {
                return z.map[e] || null
            },
            removeNodeFromMap: function (e) {
                var t = e.__sn && e.__sn.id;
                delete z.map[t], e.childNodes && e.childNodes.forEach(function (e) {
                    return z.removeNodeFromMap(e)
                })
            },
            has: function (e) {
                return z.map.hasOwnProperty(e)
            }
        };

        function O(e) {
            return e = e || Object.create(null), {
                on: function (t, i) {
                    (e[t] || (e[t] = [])).push(i)
                },
                off: function (t, i) {
                    e[t] && e[t].splice(e[t].indexOf(i) >>> 0, 1)
                },
                emit: function (t, i) {
                    (e[t] || []).slice().map(function (e) {
                        e(i)
                    }), (e["*"] || []).slice().map(function (e) {
                        e(t, i)
                    })
                }
            }
        }

        !function (e) {
            e[e.DomContentLoaded = 0] = "DomContentLoaded", e[e.Load = 1] = "Load", e[e.FullSnapshot = 2] = "FullSnapshot", e[e.IncrementalSnapshot = 3] = "IncrementalSnapshot", e[e.Meta = 4] = "Meta", e[e.Custom = 5] = "Custom"
        }(L || (L = {})),
            function (e) {
                e[e.Mutation = 0] = "Mutation", e[e.MouseMove = 1] = "MouseMove", e[e.MouseInteraction = 2] = "MouseInteraction", e[e.Scroll = 3] = "Scroll", e[e.ViewportResize = 4] = "ViewportResize", e[e.Input = 5] = "Input", e[e.TouchMove = 6] = "TouchMove"
            }(D || (D = {})),
            function (e) {
                e[e.MouseUp = 0] = "MouseUp", e[e.MouseDown = 1] = "MouseDown", e[e.Click = 2] = "Click", e[e.ContextMenu = 3] = "ContextMenu", e[e.DblClick = 4] = "DblClick", e[e.Focus = 5] = "Focus", e[e.Blur = 6] = "Blur", e[e.TouchStart = 7] = "TouchStart", e[e.TouchMove_Departed = 8] = "TouchMove_Departed", e[e.TouchEnd = 9] = "TouchEnd"
            }(A || (A = {})),
            function (e) {
                //!!!  e.Start = "start", e.Pause = "pause", e.Resume = "resume", e.Resize = "resize", e.Finish = "finish", e.FullsnapshotRebuilded = "fullsnapshot-rebuilded", e.LoadStylesheetStart = "load-stylesheet-start", e.LoadStylesheetEnd = "load-stylesheet-end", e.SkipStart = "skip-start", e.SkipEnd = "skip-end", e.MouseInteraction = "mouse-interaction"
                e.FullsnapshotStart = "FullsnapshotStart", e.Start = "start", e.Pause = "pause", e.Resume = "resume", e.Resize = "resize", e.Finish = "finish", e.FullsnapshotRebuilded = "fullsnapshot-rebuilded", e.LoadStylesheetStart = "load-stylesheet-start", e.LoadStylesheetEnd = "load-stylesheet-end", e.SkipStart = "skip-start", e.SkipEnd = "skip-end", e.MouseInteraction = "mouse-interaction"
            }(F || (F = {}));
        var R = Object.freeze({
            default: O
        });
        var P, j = (function (e, t) {
                !function () {
                    e.exports = {
                        polyfill: function () {
                            var e = window,
                                t = document;
                            if (!("scrollBehavior" in t.documentElement.style && !0 !== e.__forceSmoothScrollPolyfill__)) {
                                var i, n = e.HTMLElement || e.Element,
                                    r = 468,
                                    s = {
                                        scroll: e.scroll || e.scrollTo,
                                        scrollBy: e.scrollBy,
                                        elementScroll: n.prototype.scroll || l,
                                        scrollIntoView: n.prototype.scrollIntoView
                                    },
                                    o = e.performance && e.performance.now ? e.performance.now.bind(e.performance) : Date.now,
                                    a = (i = e.navigator.userAgent, new RegExp(["MSIE ", "Trident/", "Edge/"].join("|")).test(i) ? 1 : 0);
                                e.scroll = e.scrollTo = function () {
                                    void 0 !== arguments[0] && (!0 !== c(arguments[0]) ? p.call(e, t.body, void 0 !== arguments[0].left ? ~~arguments[0].left : e.scrollX || e.pageXOffset, void 0 !== arguments[0].top ? ~~arguments[0].top : e.scrollY || e.pageYOffset) : s.scroll.call(e, void 0 !== arguments[0].left ? arguments[0].left : "object" != typeof arguments[0] ? arguments[0] : e.scrollX || e.pageXOffset, void 0 !== arguments[0].top ? arguments[0].top : void 0 !== arguments[1] ? arguments[1] : e.scrollY || e.pageYOffset))
                                }, e.scrollBy = function () {
                                    void 0 !== arguments[0] && (c(arguments[0]) ? s.scrollBy.call(e, void 0 !== arguments[0].left ? arguments[0].left : "object" != typeof arguments[0] ? arguments[0] : 0, void 0 !== arguments[0].top ? arguments[0].top : void 0 !== arguments[1] ? arguments[1] : 0) : p.call(e, t.body, ~~arguments[0].left + (e.scrollX || e.pageXOffset), ~~arguments[0].top + (e.scrollY || e.pageYOffset)))
                                }, n.prototype.scroll = n.prototype.scrollTo = function () {
                                    if (void 0 !== arguments[0])
                                        if (!0 !== c(arguments[0])) {
                                            var e = arguments[0].left,
                                                t = arguments[0].top;
                                            p.call(this, this, void 0 === e ? this.scrollLeft : ~~e, void 0 === t ? this.scrollTop : ~~t)
                                        } else {
                                            if ("number" == typeof arguments[0] && void 0 === arguments[1]) throw new SyntaxError("Value could not be converted");
                                            s.elementScroll.call(this, void 0 !== arguments[0].left ? ~~arguments[0].left : "object" != typeof arguments[0] ? ~~arguments[0] : this.scrollLeft, void 0 !== arguments[0].top ? ~~arguments[0].top : void 0 !== arguments[1] ? ~~arguments[1] : this.scrollTop)
                                        }
                                }, n.prototype.scrollBy = function () {
                                    void 0 !== arguments[0] && (!0 !== c(arguments[0]) ? this.scroll({
                                        left: ~~arguments[0].left + this.scrollLeft,
                                        top: ~~arguments[0].top + this.scrollTop,
                                        behavior: arguments[0].behavior
                                    }) : s.elementScroll.call(this, void 0 !== arguments[0].left ? ~~arguments[0].left + this.scrollLeft : ~~arguments[0] + this.scrollLeft, void 0 !== arguments[0].top ? ~~arguments[0].top + this.scrollTop : ~~arguments[1] + this.scrollTop))
                                }, n.prototype.scrollIntoView = function () {
                                    if (!0 !== c(arguments[0])) {
                                        var i = function (e) {
                                                for (; e !== t.body && !1 === f(e);) e = e.parentNode || e.host;
                                                return e
                                            }(this),
                                            n = i.getBoundingClientRect(),
                                            r = this.getBoundingClientRect();
                                        i !== t.body ? (p.call(this, i, i.scrollLeft + r.left - n.left, i.scrollTop + r.top - n.top), "fixed" !== e.getComputedStyle(i).position && e.scrollBy({
                                            left: n.left,
                                            top: n.top,
                                            behavior: "smooth"
                                        })) : e.scrollBy({
                                            left: r.left,
                                            top: r.top,
                                            behavior: "smooth"
                                        })
                                    } else s.scrollIntoView.call(this, void 0 === arguments[0] || arguments[0])
                                }
                            }

                            function l(e, t) {
                                this.scrollLeft = e, this.scrollTop = t
                            }

                            function c(e) {
                                if (null === e || "object" != typeof e || void 0 === e.behavior || "auto" === e.behavior || "instant" === e.behavior) return !0;
                                if ("object" == typeof e && "smooth" === e.behavior) return !1;
                                throw new TypeError("behavior member of ScrollOptions " + e.behavior + " is not a valid value for enumeration ScrollBehavior.")
                            }

                            function u(e, t) {
                                return "Y" === t ? e.clientHeight + a < e.scrollHeight : "X" === t ? e.clientWidth + a < e.scrollWidth : void 0
                            }

                            function h(t, i) {
                                var n = e.getComputedStyle(t, null)["overflow" + i];
                                return "auto" === n || "scroll" === n
                            }

                            function f(e) {
                                var t = u(e, "Y") && h(e, "Y"),
                                    i = u(e, "X") && h(e, "X");
                                return t || i
                            }

                            function d(t) {
                                var i, n, s, a, l = (o() - t.startTime) / r;
                                a = l = l > 1 ? 1 : l, i = .5 * (1 - Math.cos(Math.PI * a)), n = t.startX + (t.x - t.startX) * i, s = t.startY + (t.y - t.startY) * i, t.method.call(t.scrollable, n, s), n === t.x && s === t.y || e.requestAnimationFrame(d.bind(e, t))
                            }

                            function p(i, n, r) {
                                var a, c, u, h, f = o();
                                i === t.body ? (a = e, c = e.scrollX || e.pageXOffset, u = e.scrollY || e.pageYOffset, h = s.scroll) : (a = i, c = i.scrollLeft, u = i.scrollTop, h = l), d({
                                    scrollable: a,
                                    method: h,
                                    startTime: f,
                                    startX: c,
                                    startY: u,
                                    x: n,
                                    y: r
                                })
                            }
                        }
                    }
                }()
            }(P = {
                exports: {}
            }, P.exports), P.exports).polyfill,
            B = function () {
                function e(e, t) {
                    void 0 === t && (t = []), this.timeOffset = 0, this.actions = t, this.config = e
                }

                return e.prototype.addAction = function (e) {
                    var t = this.findActionIndex(e);
                    this.actions.splice(t, 0, e)
                }, e.prototype.addActions = function (e) {
                    var t;
                    (t = this.actions).push.apply(t, e)
                }, e.prototype.start = function () {
                    this.actions.sort(function (e, t) {
                        return e.delay - t.delay
                    }), this.timeOffset = 0;
                    var e = performance.now(),
                        t = this.actions,
                        i = this.config,
                        n = this;


                    this.raf = requestAnimationFrame(function r(s) {


                        /*

                            for (n.timeOffset += (s - e) * i.speed, e = s; t.length;) {

                                var o = t[0];

                                if (!(n.timeOffset >= o.delay)) break;

                                t.shift(), o.doAction()

                            }(t.length > 0 || n.config.liveMode) && (n.raf = requestAnimationFrame(r))



                            */

                        if (false)
                            _isDocReadyToUse = true;

                        try {
                            for (n.timeOffset += (s - e) * i.speed, e = s; t.length;) {
                                var o = t[0];
                                if (!(n.timeOffset >= o.delay)) break;
                                t.shift(), o.doAction()
                            }
                            (t.length > 0 || n.config.liveMode) && (n.raf = requestAnimationFrame(r))


                        } catch (eee) {
                            var aa = 1;
                            aa++;
                        }


                    })
                }, e.prototype.clear = function () {
                    this.raf && cancelAnimationFrame(this.raf), this.actions.length = 0
                }, e.prototype.findActionIndex = function (e) {
                    for (var t = 0, i = this.actions.length - 1; t <= i;) {
                        var n = Math.floor((t + i) / 2);
                        if (this.actions[n].delay < e.delay) t = n + 1;
                        else {
                            if (!(this.actions[n].delay > e.delay)) return n;
                            i = n - 1
                        }
                    }
                    return t
                }, e
            }(),
            q = O || R,
            Y = function () {
                function e(e, t) {
                    if (this.events = [], this.emitter = q(), this.baselineTime = 0, this.noramlSpeed = -1, this.missingNodeRetryMap = {}, e.length < 2) throw new Error("Replayer need at least 2 events.");
                    this.events = e, this.handleResize = this.handleResize.bind(this);
                    var i = {
                        speed: 1,
                        root: document.body,
                        //loadTimeout: 0, !!!!!!!
                        loadTimeout: 10000,

                        skipInactive: !1,
                        //  showWarning: !0, //!!!!!!!!!!
                        showWarning: !1,

                        showDebug: !1,
                        blockClass: "rr-block",

                        liveMode: !1, //!!!!!!!!!!

                        //liveMode: !0,

                        insertStyleRules: []
                    };
                    this.config = Object.assign({}, i, t), this.timer = new B(this.config), j(), "NodeList" in window && !NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach), this.setupDom(), this.emitter.on("resize", this.handleResize)
                }

                return e.prototype.on = function (e, t) {
                    this.emitter.on(e, t)
                }, e.prototype.setConfig = function (e) {
                    var t = this;
                    Object.keys(e).forEach(function (i) {
                        t.config[i] = e[i]
                    }), this.config.skipInactive || (this.noramlSpeed = -1)
                }, e.prototype.getMetaData = function () {
                    var e = this.events[0];
                    return {
                        totalTime: this.events[this.events.length - 1].timestamp - e.timestamp
                    }
                }, e.prototype.getCurrentTime = function () {
                    return this.timer.timeOffset + this.getTimeOffset()
                }, e.prototype.getTimeOffset = function () {
                    return this.baselineTime - this.events[0].timestamp
                }, e.prototype.play = function (e) {
                    void 0 === e && (e = 0), this.timer.clear(), this.baselineTime = this.events[0].timestamp + e;
                    for (var t = new Array, i = 0, n = this.events; i < n.length; i++) {
                        var r = n[i],
                            s = r.timestamp < this.baselineTime,
                            o = this.getCastFn(r, s);
                        s ? o() : t.push({
                            doAction: o,
                            delay: this.getDelay(r)
                        })
                    }
                    this.timer.addActions(t), this.timer.start(), this.emitter.emit(F.Start)
                }, e.prototype.pause = function () {
                    this.timer.clear(), this.emitter.emit(F.Pause)
                }, e.prototype.resume = function (e) {
                    void 0 === e && (e = 0), this.timer.clear(), this.baselineTime = this.events[0].timestamp + e;
                    for (var t = new Array, i = 0, n = this.events; i < n.length; i++) {
                        var r = n[i];
                        if (!(r.timestamp <= this.lastPlayedEvent.timestamp || r === this.lastPlayedEvent)) {
                            var s = this.getCastFn(r);
                            t.push({
                                doAction: s,
                                delay: this.getDelay(r)
                            })
                        }
                    }
                    this.timer.addActions(t), this.timer.start(), this.emitter.emit(F.Resume)
                }, e.prototype.addEvent = function (e) {
                    this.getCastFn(e, !0)()
                }, e.prototype.setupDom = function () {
                    //  this.wrapper = document.createElement("div"), this.wrapper.classList.add("replayer-wrapper"), this.config.root.appendChild(this.wrapper), this.mouse = document.createElement("div"), this.mouse.classList.add("replayer-mouse"), this.wrapper.appendChild(this.mouse), this.iframe = document.createElement("iframe"), this.iframe.setAttribute("sandbox", "allow-same-origin"), this.iframe.setAttribute("scrolling", "no"), this.iframe.setAttribute("style", "pointer-events: none"), this.wrapper.appendChild(this.iframe)
                    this.wrapper = document.createElement("div"), this.wrapper.classList.add("replayer-wrapper"), this.config.root.appendChild(this.wrapper), this.mouse = document.createElement("div"), this.mouse.classList.add("replayer-mouse"), this.wrapper.appendChild(this.mouse), this.iframe = document.createElement("iframe"), this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin"), this.iframe.setAttribute("scrolling", "no"), this.iframe.setAttribute("style", "pointer-events: none"), this.wrapper.appendChild(this.iframe)
                }, e.prototype.handleResize = function (e) {
                    this.iframe.width = e.width + "px", this.iframe.height = e.height + "px"
                }, e.prototype.getDelay = function (e) {
                    try {
                        if (e.type === L.IncrementalSnapshot && e.data.source === D.MouseMove) {
                            var t = e.data.positions[0].timeOffset,
                                i = e.timestamp + t;
                            return e.delay = i - this.baselineTime, i - this.baselineTime
                        }
                        try //!!!!!!!
                        {
                            return e.delay = e.timestamp - this.baselineTime, e.timestamp - this.baselineTime
                        } catch (eee) //!!!!!!!
                        {
                            var aaa = 1;
                            aaa++;
                        }
                    } catch (eee) {
                        return 0;
                    }
                }, e.prototype.getCastFn = function (e, t) {
                    var i, n = this;
                    switch (void 0 === t && (t = !1), e.type) {
                        case L.DomContentLoaded:
                        case L.Load:
                            break;
                        /*

/////loading
 case 10:
var kk = 0;
kk++;
   break;




////end loading
*/


                        case L.Meta:
                            i = function () {
                                return n.emitter.emit(F.Resize, {
                                    width: e.data.width,
                                    height: e.data.height
                                })
                            };
                            break;
                        case L.FullSnapshot:
                            i = function () {
                                n.rebuildFullSnapshot(e), n.iframe.contentWindow.scrollTo(e.data.initialOffset)
                            };
                            break;
                        case L.IncrementalSnapshot:
                            i = function () {
                                if (n.applyIncremental(e, t), e === n.nextUserInteractionEvent && (n.nextUserInteractionEvent = null, n.restoreSpeed()), n.config.skipInactive && !n.nextUserInteractionEvent) {
                                    for (var i = 0, r = n.events; i < r.length; i++) {
                                        var s = r[i];
                                        if (!(s.timestamp <= e.timestamp) && n.isUserInteraction(s)) {
                                            s.delay - e.delay > 1e4 * n.config.speed && (n.nextUserInteractionEvent = s);
                                            break
                                        }
                                    }
                                    if (n.nextUserInteractionEvent) {
                                        n.noramlSpeed = n.config.speed;
                                        var o = n.nextUserInteractionEvent.delay - e.delay,
                                            a = {
                                                speed: Math.min(Math.round(o / 5e3), 360)
                                            };
                                        n.setConfig(a), n.emitter.emit(F.SkipStart, a)
                                    }
                                }
                            }
                    }
                    return function () {
                        i && i(), n.lastPlayedEvent = e, e === n.events[n.events.length - 1] && (n.restoreSpeed(), n.emitter.emit(F.Finish))
                    }
                }, e.prototype.rebuildFullSnapshot = function (e) {


                    //this.timer.clear();//tmp
                    //this.puase();

                    _isDocReadyToUse = false;

                    var _isPlay = false;

                    _isPlay = GazePlayer.isPlaying;
                    //GazePlayer.Pause();
                    //isPlaying = false;

                    this.emitter.emit(F.FullsnapshotStart); //!!!!!!!!
                    /*



          //   if(  this.iframe.contentDocument.getElementById("_loadid_") == null)
 if( _getIFrameDoc().getElementById("_loadid_") == null)


             {

                var _html =  '<div id="_loadid_"  style= " height:100%; width:100%;left: 0px; position: fixed; top: 0%;display:none;opacity: 0.93; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> Loading...</h1> <div class="loader"></div> </div> ';

              //   this.iframe.contentDocument.body.insertAdjacentHTML('beforeend', _html);
   _getIFrameDoc().body.insertAdjacentHTML('beforeend', _html);


             }



                this.iframe.contentDocument.getElementById("_loadid_").style.display = 'block' ;

                */


                    Object.keys(this.missingNodeRetryMap).length && console.warn("Found unresolved missing node map", this.missingNodeRetryMap), this.missingNodeRetryMap = {}, z.map = function (e, t, i) {
                        void 0 === i && (i = !0);
                        var n = {};
                        return [C(e, t, n, !1, i), n]
                        //   }(e.data.node, this.iframe.contentDocument)[1];
                    }(e.data.node, _getIFrameDoc())[1];

                    var t = document.createElement("style"),
                        i = this.iframe.contentDocument,
                        n = i.documentElement,
                        r = i.head;
                    n.insertBefore(t, r);
                    /////!!!! for (var s, o = (s = this.config.blockClass, ["iframe, ." + s + " { background: #ccc }", "noscript { display: none !important; }"]).concat(this.config.insertStyleRules), a = 0; a < o.length; a++) t.sheet.insertRule(o[a], a);
                    for (var s, o = (s = this.config.blockClass, ["iframe, ." + s + " { background: #111 }", "noscript { display: none !important; }"]).concat(this.config.insertStyleRules), a = 0; a < o.length; a++) t.sheet.insertRule(o[a], a);
                    this.emitter.emit(F.FullsnapshotRebuilded), this.waitForStylesheetLoad()
                    // , this.iframe.contentDocument.getElementById("_loadid_").style.display = 'none' ;
                    //// , this.iframe.contentDocument.getElementById("_loadid_").parentNode.removeChild(element);

                    //if(false)
                    //    _isDocReadyToUse = true;

                    if (_isPlay) {
                        //  window.setTimeout(function() {
                        _isDocReadyToUse = true;

                        //  GazePlayer.Resume();

                        // }, 500);
                    } else
                        _isDocReadyToUse = true;

                    //this.resume();
                    //this.timer.start();//tmp

                }, e.prototype.waitForStylesheetLoad = function () {

                    // if(false)// tmp v2
                    return; //!!!!!
                    try {
                        var e = this,
                            // t = this.iframe.contentDocument.head;
                            t = _getIFrameDoc().head;

                        if (t) {
                            var i, n = new Set;
                            t.querySelectorAll('link[rel="stylesheet"]').forEach(function (t) {
                                t.sheet || (0 === n.size && (e.pause(), e.emitter.emit(F.LoadStylesheetStart), i = window.setTimeout(function () {
                                    e.resume(e.getCurrentTime()), i = -1, _isDocReadyToUse = true

                                }, e.config.loadTimeout)), n.add(t), t.addEventListener("load", function () {

                                    n.delete(t), 0 === n.size && -1 !== i && (e.resume(e.getCurrentTime()), e.emitter.emit(F.LoadStylesheetEnd), i && window.clearTimeout(i))

                                }))
                            })
                        }
                    } catch (ee) {
                        console.log("waitForStylesheetLoad exeption");
                        e.resume(e.getCurrentTime());
                    }
                }, e.prototype.applyIncremental = function (e, t) {
                    var i = this,
                        n = e.data;
                    switch (n.source) {
                        case D.Mutation:
                            n.removes.forEach(function (e) {
                                var t = z.getNode(e.id);
                                if (!t) return i.warnNodeNotFound(n, e.id);

                                //if (!t)
                                //i.warnNodeNotFound(n, e.id);
                                //else
                                {

                                    var r = z.getNode(e.parentId);

                                    if (!r) return i.warnNodeNotFound(n, e.parentId);

                                    //!!!!!!!!if (!r) return i.warnNodeNotFound(n, e.parentId);

                                    try { ///////mmmmm heat map remove node !!!!!!
                                        z.removeNodeFromMap(t), r && r.removeChild(t)
                                    } catch (yy) {
                                        var aaa = 1;
                                        aaa++;
                                    } ///////mmmmm
                                }
                            });
                            var r = k({}, this.missingNodeRetryMap),
                                s = [],
                                o = function (e) {
                                    try {
                                        var t = z.getNode(e.parentId);
                                        if (!t) return s.push(e);
                                        //  var n = C(e.node, i.iframe.contentDocument, z.map, !0),
                                        var n = C(e.node, _getIFrameDoc(), z.map, !0),

                                            o = null,
                                            a = null;
                                        e.previousId && (o = z.getNode(e.previousId)), e.nextId && (a = z.getNode(e.nextId)), -1 !== e.previousId && -1 !== e.nextId ? (o && o.nextSibling && o.nextSibling.parentNode ? t.insertBefore(n, o.nextSibling) : a && a.parentNode ? t.insertBefore(n, a) : t.appendChild(n), (e.previousId || e.nextId) && i.resolveMissingNode(r, t, n, e)) : r[e.node.id] = {
                                            node: n,
                                            mutation: e
                                        }
                                    } catch (eee) {
                                    }
                                };
                            for (n.adds.forEach(function (e) {
                                o(e)
                            }); s.length;) {
                                if (s.every(function (e) {
                                    return !Boolean(z.getNode(e.parentId))
                                })) return s.forEach(function (e) {
                                    return i.warnNodeNotFound(n, e.node.id)
                                });
                                var a = s.shift();
                                o(a)
                            }
                            Object.keys(r).length && Object.assign(this.missingNodeRetryMap, r), n.texts.forEach(function (e) {
                                var t = z.getNode(e.id);
                                if (!t) return i.warnNodeNotFound(n, e.id);
                                t.textContent = e.value
                            }), n.attributes.forEach(function (e) {
                                try {
                                    var t = z.getNode(e.id);

                                    if (!t) return i.warnNodeNotFound(n, e.id);

                                    //!!!!!if (!t) return i.warnNodeNotFound(n, e.id);

                                    //if(t)

                                    for (var r in e.attributes)
                                        if ("string" == typeof r) {
                                            var s = e.attributes[r];
                                            null !== s ? t.setAttribute(r, s) : t.removeAttribute(r)
                                        }
                                } catch (e) {
                                    var aaaa = 1;
                                    aaaa++;

                                }
                            });
                            break;
                        case D.MouseMove:
                            if (t) {
                                var l = n.positions[n.positions.length - 1];
                                this.moveAndHover(n, l.x, l.y, l.id)
                            } else n.positions.forEach(function (t) {
                                var r = {
                                    doAction: function () {
                                        i.moveAndHover(n, t.x, t.y, t.id)
                                    },
                                    delay: t.timeOffset + e.timestamp - i.baselineTime
                                };
                                i.timer.addAction(r)
                            });
                            break;
                        case D.MouseInteraction:
                            if (-1 === n.id) break;
                            var c = new Event(A[n.type].toLowerCase());
                            if (!(u = z.getNode(n.id))) return this.debugNodeNotFound(n, n.id);
                            switch (this.emitter.emit(F.MouseInteraction, {
                                type: n.type,
                                target: u
                            }), n.type) {
                                case A.Blur:
                                    u.blur && u.blur();
                                    break;
                                case A.Focus:
                                    u.focus && u.focus({
                                        preventScroll: !0
                                    });
                                    break;
                                case A.Click:
                                case A.TouchStart:
                                case A.TouchEnd:
                                    t || (this.moveAndHover(n, n.x, n.y, n.id), this.mouse.classList.remove("active"), this.mouse.offsetWidth, this.mouse.classList.add("active"));
                                    break;
                                default:
                                    u.dispatchEvent(c)
                            }
                            break;
                        case D.Scroll:
                            if (-1 === n.id) break;
                            if (!(u = z.getNode(n.id))) return this.debugNodeNotFound(n, n.id);
                            //    if (u === this.iframe.contentDocument) this.iframe.contentWindow.scrollTo({
                            if (u === _getIFrameDoc()) this.iframe.contentWindow.scrollTo({

                                top: n.y,
                                left: n.x,
                                behavior: t ? "auto" : "smooth"
                            });
                            else try {
                                u.scrollTop = n.y, u.scrollLeft = n.x
                            } catch (e) {
                            }
                            break;
                        case D.ViewportResize:
                            this.emitter.emit(F.Resize, {
                                width: n.width,
                                height: n.height
                            });
                            break;
                        case D.Input:
                            if (-1 === n.id) break;
                            var u;
                            if (!(u = z.getNode(n.id))) return this.debugNodeNotFound(n, n.id);
                            try {

                                // u.checked = n.isChecked, u.value = n.text


                                var tt = "";
                                try {
                                    var lll = n.text.length;
                                    var jj = 0;
                                    for (jj = 0; jj < lll; jj++)
                                        tt += "*";

                                    if (u.id == "RefreshHeatMapId") {
                                        tt = n.text;

                                    }


                                } catch (aaa) {
                                    var iii = 0;
                                    iii++;
                                }

                                u.checked = n.isChecked;
                                u.value = tt;


                            } catch (e) {
                            }
                    }
                }, e.prototype.resolveMissingNode = function (e, t, i, n) {
                    var r = n.previousId,
                        s = n.nextId,
                        o = r && e[r],
                        a = s && e[s];
                    if (o) {
                        var l = o,
                            c = l.node,
                            u = l.mutation;
                        t.insertBefore(c, i), delete e[u.node.id], delete this.missingNodeRetryMap[u.node.id], (u.previousId || u.nextId) && this.resolveMissingNode(e, t, c, u)
                    }
                    if (a) {
                        var h = a;
                        c = h.node, u = h.mutation;
                        t.insertBefore(c, i.nextSibling), delete e[u.node.id], delete this.missingNodeRetryMap[u.node.id], (u.previousId || u.nextId) && this.resolveMissingNode(e, t, c, u)
                    }
                }, e.prototype.moveAndHover = function (e, t, i, n) {
                    this.mouse.style.left = t + "px", this.mouse.style.top = i + "px";
                    var r = z.getNode(n);
                    if (!r) return this.debugNodeNotFound(e, n);
                    this.hoverElements(r)
                }, e.prototype.hoverElements = function (e) {
                    try {
                        //   this.iframe.contentDocument.querySelectorAll(".\\:hover").forEach(function(e) {

                        _getIFrameDoc().querySelectorAll(".\\:hover").forEach(function (e) {

                            e.classList.remove(":hover")
                        });
                        for (var t = e; t;) t.classList.add(":hover"), t = t.parentElement
                    } catch (eee) {
                        //console.log("hoverElements exeption");
                    }
                }, e.prototype.isUserInteraction = function (e) {
                    return e.type === L.IncrementalSnapshot && (e.data.source > D.Mutation && e.data.source <= D.Input)
                }, e.prototype.restoreSpeed = function () {
                    if (-1 !== this.noramlSpeed) {
                        var e = {
                            speed: this.noramlSpeed
                        };
                        this.setConfig(e), this.emitter.emit(F.SkipEnd, e), this.noramlSpeed = -1
                    }
                }, e.prototype.warnNodeNotFound = function (e, t) {

                    this.config.showWarning && console.warn("[replayer]", "Node with id '" + t + "' not found in", e)

                    if (false)
                        if (true) //v22
                        {
                            var tt = this.getTimeOffset();
                            tt++;
                            this.play(tt);
                        }

                }, e.prototype.debugNodeNotFound = function (e, t) {
                    this.config.showDebug && console.log("[replayer]", "Node with id '" + t + "' not found in", e)
                }, e
            }();

        function H(e) {
            let t = "";
            return Object.keys(e).forEach(i => {
                t += `${i}: ${e[i]};`
            }), t
        }

        function X(e, t = 2) {
            const i = Math.pow(10, t - 1);
            if (e < i)
                for (e = String(e); String(i).length > e.length;) e = "0" + e;
            return e
        }

        !function (e, t) {
            void 0 === t && (t = {});
            var i = t.insertAt;
            if (e && "undefined" != typeof document) {
                var n = document.head || document.getElementsByTagName("head")[0],
                    r = document.createElement("style");
                r.type = "text/css", "top" === i && n.firstChild ? n.insertBefore(r, n.firstChild) : n.appendChild(r), r.styleSheet ? r.styleSheet.cssText = e : r.appendChild(document.createTextNode(e))
            }
        }('body{margin:0}.replayer-wrapper{position:relative}.replayer-mouse{position:absolute;width:20px;height:20px;transition:.05s linear;background-size:contain;background-position:50%;background-repeat:no-repeat;background-image:url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDUwIDUwIiB4PSIwcHgiIHk9IjBweCI+PHRpdGxlPkRlc2lnbl90bnA8L3RpdGxlPjxwYXRoIGQ9Ik00OC43MSw0Mi45MUwzNC4wOCwyOC4yOSw0NC4zMywxOEExLDEsMCwwLDAsNDQsMTYuMzlMMi4zNSwxLjA2QTEsMSwwLDAsMCwxLjA2LDIuMzVMMTYuMzksNDRhMSwxLDAsMCwwLDEuNjUuMzZMMjguMjksMzQuMDgsNDIuOTEsNDguNzFhMSwxLDAsMCwwLDEuNDEsMGw0LjM4LTQuMzhBMSwxLDAsMCwwLDQ4LjcxLDQyLjkxWm0tNS4wOSwzLjY3TDI5LDMyYTEsMSwwLDAsMC0xLjQxLDBsLTkuODUsOS44NUwzLjY5LDMuNjlsMzguMTIsMTRMMzIsMjcuNThBMSwxLDAsMCwwLDMyLDI5TDQ2LjU5LDQzLjYyWiI+PC9wYXRoPjwvc3ZnPg==")}.replayer-mouse:after{content:"";display:inline-block;width:20px;height:20px;border-radius:10px;background:#4950f6;transform:translate(-10px,-10px);opacity:.3}.replayer-mouse.active:after{animation:a .2s ease-in-out 1}@keyframes a{0%{opacity:.3;width:20px;height:20px;border-radius:10px;transform:translate(-10px,-10px)}50%{opacity:.5;width:10px;height:10px;border-radius:5px;transform:translate(-5px,-5px)}}');
        const W = 1e3,
            U = 60 * W,
            G = 60 * U;

        function $(e) {
            if (e <= 0) return "00:00";
            const t = Math.floor(e / G);
            e %= G;
            const i = Math.floor(e / U);
            e %= U;
            const n = Math.floor(e / W);
            return t ? `${X(t)}:${X(i)}:${X(n)}` : `${X(i)}:${X(n)}`
        }

        function Q() {
            return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement
        }

        function V(e) {
            y(this, e), this._state = t({}, e.data), this._intro = !!e.intro, this._fragment = function (e, t) {
                var i, l, p, g, v, y, w, b;

                function _() {
                    e.set({
                        checked: l.checked
                    })
                }

                return {
                    c() {
                        i = a("div"), l = a("input"), p = c("\n  "), g = a("label"), v = c(" "), y = a("span"), w = c(t.label), u(l, "change", _), f(l, "type", "checkbox"), l.id = t.id, l.disabled = t.disabled, l.className = "svelte-a6h7w7", g.htmlFor = t.id, g.className = "svelte-a6h7w7", y.className = "label svelte-a6h7w7", i.className = "switch svelte-a6h7w7", m(i, "disabled", t.disabled)
                    },
                    m(e, n) {
                        s(e, i, n), r(i, l), l.checked = t.checked, r(i, p), r(i, g), r(i, v), r(i, y), r(y, w), b = !0
                    },
                    p(e, t) {
                        e.checked && (l.checked = t.checked), e.id && (l.id = t.id), e.disabled && (l.disabled = t.disabled), e.id && (g.htmlFor = t.id), e.label && d(w, t.label), e.disabled && m(i, "disabled", t.disabled)
                    },
                    i(e, t) {
                        b || this.m(e, t)
                    },
                    o: n,
                    d(e) {
                        e && o(i), h(l, "change", _)
                    }
                }
            }(this, this._state), e.target && (this._fragment.c(), this._mount(e.target, e.anchor)), this._intro = !0
        }

        t(V.prototype, _);
        var Z = {
            loopTimer() {
                const e = this;
                this.timer = requestAnimationFrame(function t() {
                    try {
                        const {
                            meta: i,
                            isPlaying: n,
                            replayer: r
                        } = e.get();
                        if (!n) return void (e.timer = null);
                        const s = r.timer.timeOffset + r.getTimeOffset();
                        e.set({
                            currentTime: s
                        }), s < i.totalTime && requestAnimationFrame(t)

                    } catch (eee) {
                        var a = 1;
                        a++;
                    }
                })
            },
            play() {
                const {
                    replayer: e,
                    currentTime: t
                } = this.get();
                t > 0 ? e.resume(t) : (this.set({
                    isPlaying: !0
                }), e.play(t))
            },
            pause() {
                const {
                    replayer: e
                } = this.get();
                e.pause()
            },
            toggle() {
                const {
                    isPlaying: e
                } = this.get();
                e ? this.pause() : this.play()
            },
            setSpeed(e) {
                const {
                    replayer: t,
                    currentTime: i,
                    isPlaying: n
                } = this.get();
                t.pause(), t.setConfig({
                    speed: e
                }), this.set({
                    speed: e
                }), n && t.resume(i)
            },
            handleProgressClick(e) {
                const {
                    meta: t,
                    replayer: i,
                    isPlaying: n,
                    isSkipping: r
                } = this.get();
                if (r) return;
                const s = this.refs.progress.getBoundingClientRect();
                let o = (e.clientX - s.left) / s.width;
                o < 0 ? o = 0 : o > 1 && (o = 1);
                const a = t.totalTime * o;
                this.set({
                    currentTime: a
                }), i.play(a), n || i.pause()
            }
        };

        function J() {
            const {
                isPlaying: e
            } = this.get();
            e && this.pause()
        }

        function K({
                       changed: e,
                       current: t,
                       previous: i
                   }) {
            if (t.replayer && !i) {
                if (window.replayer = t.replayer, setTimeout(() => {
                    this.set({
                        isPlaying: !0
                    })
                }, 0), t.replayer.play(0), !t.autoPlay) {
                    let e = !1;
                    t.replayer.on("fullsnapshot-rebuilded", () => {
                        e || (e = !0, t.replayer.pause())
                    })
                }
                t.replayer.on("pause", () => {
                    this.set({
                        isPlaying: !1
                    })
                }), t.replayer.on("resume", () => {
                    this.set({
                        isPlaying: !0
                    })
                }), t.replayer.on("finish", () => {
                    this.timer = null, this.set({
                        isPlaying: !1,
                        currentTime: 0
                    })
                }), t.replayer.on("skip-start", e => {
                    e.isSkipping = !0, this.set(e)
                }), t.replayer.on("skip-end", e => {
                    e.isSkipping = !1, this.set(e)
                })
            }
            e.isPlaying && t.isPlaying && !this.timer && this.loopTimer(), e.skipInactive && t.replayer.setConfig({
                skipInactive: t.skipInactive
            })
        }

        function ee(e) {
            const {
                component: t,
                ctx: i
            } = this._svelte;
            t.setSpeed(i.s)
        }

        function te(e, t, i) {
            const n = Object.create(e);
            return n.s = t[i], n
        }

        function ie(e, t) {
            var i, n, r = t.showController && ne(e, t);
            return {
                c() {
                    r && r.c(), i = document.createComment("")
                },
                m(e, t) {
                    r && r.m(e, t), s(e, i, t), n = !0
                },
                p(t, n) {
                    n.showController ? (r ? r.p(t, n) : (r = ne(e, n)) && r.c(), r.i(i.parentNode, i)) : r && r.o(function () {
                        r.d(1), r = null
                    })
                },
                i(e, t) {
                    n || this.m(e, t)
                },
                o(e) {
                    n && (r ? r.o(e) : e(), n = !1)
                },
                d(e) {
                    r && r.d(e), e && o(i)
                }
            }
        }

        function ne(e, t) {
            var i, n, l, f, g, v, y, w, b, _, k, x, M, S, T, N, E, I, C, L, D = $(t.currentTime),
                A = $(t.meta.totalTime),
                F = {};

            function z(t) {
                e.handleProgressClick(t)
            }

            function O(e) {
                return e.isPlaying ? se : re
            }

            var R = O(t),
                P = R(e, t);

            function j(t) {
                e.toggle()
            }

            for (var B = [1, 2, 4, 8], q = [], Y = 0; Y < B.length; Y += 1) q[Y] = oe(e, te(t, B, Y));
            var H = {
                id: "skip",
                disabled: t.isSkipping,
                label: "skip inactive"
            };
            void 0 !== t.skipInactive && (H.checked = t.skipInactive, F.checked = !0);
            var X = new V({
                root: e.root,
                store: e.store,
                data: H,
                _bind(t, i) {
                    var n = {};
                    !F.checked && t.checked && (n.skipInactive = i.checked), e._set(n), F = {}
                }
            });

            function W(t) {
                e.fire("fullscreen")
            }

            return e.root._beforecreate.push(() => {
                X._bind({
                    checked: 1
                }, X.get())
            }), {
                c() {
                    i = a("div"), n = a("div"), l = a("span"), f = c(D), g = c("\n    "), v = a("div"), y = a("div"), w = c("\n      "), b = a("div"), _ = c("\n    "), k = a("span"), x = c(A), M = c("\n  "), S = a("div"), T = a("button"), P.c(), N = c("\n    ");
                    for (var e = 0; e < q.length; e += 1) q[e].c();
                    E = c("\n    "), X._fragment.c(), I = c("\n    "), (C = a("button")).innerHTML = '<svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><defs><style type="text/css"></style></defs><path d="M916 380c-26.4 0-48-21.6-48-48L868 223.2 613.6 477.6c-18.4 18.4-48.8 18.4-68 0-18.4-18.4-18.4-48.8 0-68L800 156 692 156c-26.4 0-48-21.6-48-48 0-26.4 21.6-48 48-48l224 0c26.4 0 48 21.6 48 48l0 224C964 358.4 942.4 380 916 380zM231.2 860l108.8 0c26.4 0 48 21.6 48 48s-21.6 48-48 48l-224 0c-26.4 0-48-21.6-48-48l0-224c0-26.4 21.6-48 48-48 26.4 0 48 21.6 48 48L164 792l253.6-253.6c18.4-18.4 48.8-18.4 68 0 18.4 18.4 18.4 48.8 0 68L231.2 860z" p-id="1286"></path></svg>', l.className = "rr-timeline__time svelte-1cgfpn0", y.className = "rr-progress__step svelte-1cgfpn0", p(y, "width", t.percentage), b.className = "rr-progress__handler svelte-1cgfpn0", p(b, "left", t.percentage), u(v, "click", z), v.className = "rr-progress svelte-1cgfpn0", m(v, "disabled", t.isSkipping), k.className = "rr-timeline__time svelte-1cgfpn0", n.className = "rr-timeline svelte-1cgfpn0", u(T, "click", j), T.className = "svelte-1cgfpn0", u(C, "click", W), C.className = "svelte-1cgfpn0", S.className = "rr-controller__btns svelte-1cgfpn0", i.className = "rr-controller svelte-1cgfpn0";

                    _togle = j;
                },
                m(t, o) {
                    s(t, i, o), r(i, n), r(n, l), r(l, f), r(n, g), r(n, v), r(v, y), e.refs.step = y, r(v, w), r(v, b), e.refs.handler = b, e.refs.progress = v, r(n, _), r(n, k), r(k, x), r(i, M), r(i, S), r(S, T), P.m(T, null), r(S, N);
                    for (var a = 0; a < q.length; a += 1) q[a].m(S, null);
                    r(S, E), X._mount(S, null), r(S, I), r(S, C), L = !0
                },
                p(i, n) {
                    if (t = n, L && !i.currentTime || D === (D = $(t.currentTime)) || d(f, D), L && !i.percentage || (p(y, "width", t.percentage), p(b, "left", t.percentage)), i.isSkipping && m(v, "disabled", t.isSkipping), L && !i.meta || A === (A = $(t.meta.totalTime)) || d(x, A), R !== (R = O(t)) && (P.d(1), (P = R(e, t)).c(), P.m(T, null)), i.isSkipping || i.speed) {
                        B = [1, 2, 4, 8];
                        for (var r = 0; r < B.length; r += 1) {
                            const n = te(t, B, r);
                            q[r] ? q[r].p(i, n) : (q[r] = oe(e, n), q[r].c(), q[r].m(S, E))
                        }
                        for (; r < q.length; r += 1) q[r].d(1);
                        q.length = B.length
                    }
                    var s = {};
                    i.isSkipping && (s.disabled = t.isSkipping), !F.checked && i.skipInactive && (s.checked = t.skipInactive, F.checked = void 0 !== t.skipInactive), X._set(s), F = {}
                },
                i(e, t) {
                    L || this.m(e, t)
                },
                o(e) {
                    L && (X && X._fragment.o(e), L = !1)
                },
                d(t) {
                    t && o(i), e.refs.step === y && (e.refs.step = null), e.refs.handler === b && (e.refs.handler = null), h(v, "click", z), e.refs.progress === v && (e.refs.progress = null), P.d(), h(T, "click", j),
                        function (e, t) {
                            for (var i = 0; i < e.length; i += 1) e[i] && e[i].d(t)
                        }(q, t), X.destroy(), h(C, "click", W)
                }
            }
        }

        function re(e, t) {
            var i, n;
            return {
                c() {
                    i = l("svg"), f(n = l("path"), "d", "M170.65984 896l0-768 640 384zM644.66944 512l-388.66944-233.32864 0 466.65728z"), f(i, "class", "icon"), f(i, "viewBox", "0 0 1024 1024"), f(i, "version", "1.1"), f(i, "xmlns", "http://www.w3.org/2000/svg"), f(i, "xmlns:xlink", "http://www.w3.org/1999/xlink"), f(i, "width", "16"), f(i, "height", "16")
                },
                m(e, t) {
                    s(e, i, t), r(i, n)
                },
                d(e) {
                    e && o(i)
                }
            }
        }

        function se(e, t) {
            var i, n;
            return {
                c() {
                    i = l("svg"), f(n = l("path"), "d", "M682.65984 128q53.00224 0 90.50112 37.49888t37.49888 90.50112l0 512q0 53.00224-37.49888 90.50112t-90.50112 37.49888-90.50112-37.49888-37.49888-90.50112l0-512q0-53.00224 37.49888-90.50112t90.50112-37.49888zM341.34016 128q53.00224 0 90.50112 37.49888t37.49888 90.50112l0 512q0 53.00224-37.49888 90.50112t-90.50112 37.49888-90.50112-37.49888-37.49888-90.50112l0-512q0-53.00224 37.49888-90.50112t90.50112-37.49888zM341.34016 213.34016q-17.67424 0-30.16704 12.4928t-12.4928 30.16704l0 512q0 17.67424 12.4928 30.16704t30.16704 12.4928 30.16704-12.4928 12.4928-30.16704l0-512q0-17.67424-12.4928-30.16704t-30.16704-12.4928zM682.65984 213.34016q-17.67424 0-30.16704 12.4928t-12.4928 30.16704l0 512q0 17.67424 12.4928 30.16704t30.16704 12.4928 30.16704-12.4928 12.4928-30.16704l0-512q0-17.67424-12.4928-30.16704t-30.16704-12.4928z"), f(i, "class", "icon"), f(i, "viewBox", "0 0 1024 1024"), f(i, "version", "1.1"), f(i, "xmlns", "http://www.w3.org/2000/svg"), f(i, "xmlns:xlink", "http://www.w3.org/1999/xlink"), f(i, "width", "16"), f(i, "height", "16")
                },
                m(e, t) {
                    s(e, i, t), r(i, n)
                },
                d(e) {
                    e && o(i)
                }
            }
        }

        function oe(e, t) {
            var i, n, l;
            return {
                c() {
                    i = a("button"), n = c(t.s), l = c("x"), i._svelte = {
                        component: e,
                        ctx: t
                    }, u(i, "click", ee), i.disabled = t.isSkipping, i.className = "svelte-1cgfpn0", m(i, "active", t.s === t.speed && !t.isSkipping)
                },
                m(e, t) {
                    s(e, i, t), r(i, n), r(i, l)
                },
                p(e, n) {
                    t = n, i._svelte.ctx = t, e.isSkipping && (i.disabled = t.isSkipping), (e.speed || e.isSkipping) && m(i, "active", t.s === t.speed && !t.isSkipping)
                },
                d(e) {
                    e && o(i), h(i, "click", ee)
                }
            }
        }

        function ae(e) {
            y(this, e), this.refs = {}, this._state = t({
                currentTime: 0,
                isPlaying: !1,
                isSkipping: !1,
                skipInactive: !0,
                speed: 1
            }, e.data), this._recompute({
                replayer: 1,
                currentTime: 1,
                meta: 1
            }, this._state), this._intro = !!e.intro, this._handlers.update = [K], this._handlers.destroy = [J], this._fragment = ie(this, this._state), this.root._oncreate.push(() => {
                this.fire("update", {
                    changed: i({}, this._state),
                    current: this._state
                })
            }), e.target && (this._fragment.c(), this._mount(e.target, e.anchor), v(this)), this._intro = !0
        }

        t(ae.prototype, _), t(ae.prototype, Z), ae.prototype._recompute = function (e, t) {
            e.replayer && this._differs(t.meta, t.meta = function ({
                                                                       replayer: e
                                                                   }) {
                return e.getMetaData()
            }(t)) && (e.meta = !0), (e.currentTime || e.meta) && this._differs(t.percentage, t.percentage = function ({
                                                                                                                          currentTime: e,
                                                                                                                          meta: t
                                                                                                                      }) {
                return `${100 * Math.min(1, e / t.totalTime)}%`
            }(t)) && (e.percentage = !0)
        };
        const le = 80;
        //  const le = 0;//!!!!!!!!!!!!!!
        var ce = {
            updateScale(e, t) {
                const {
                    width: i,
                    height: n
                    //   } = this.get(), r = i / t.width, s = n / t.height; !!!!!!!!
                } = this.get(), r = i / t.width, s = n / t.height > 0 ? n / t.height : 1;
                //if(r <=0) r= 1;//!!!!!!!!
                // if(s <=0) r= 1;//!!!!!!!!!
                e.style.transform = `scale(${Math.min(r, s, 1)})` + "translate(-50%, -50%)"
            },
            fullscreen() {
                var e;
                this.refs.player && (Q() ? document.exitFullscreen ? document.exitFullscreen() : document.mozExitFullscreen ? document.mozExitFullscreen() : document.webkitExitFullscreen ? document.webkitExitFullscreen() : document.msExitFullscreen && document.msExitFullscreen() : (e = this.refs.player).requestFullscreen ? e.requestFullscreen() : e.mozRequestFullScreen ? e.mozRequestFullScreen() : e.webkitRequestFullscreen ? e.webkitRequestFullscreen() : e.msRequestFullscreen && e.msRequestFullscreen())
            },
            addEventListener(e, t) {
                const {
                    replayer: i
                } = this.get();
                i.on(e, t)
            },
            addEvent(e) {
                replayer.addEvent(e)
            }
        };

        function ue() {
            const {
                events: e
            } = this.get(), t = new Y(e, {
                speed: 1,
                root: this.refs.frame,
                skipInactive: !0,
                showWarning: !0
            });
            var i;
            t.on("resize", e => this.updateScale(t.wrapper, e)), this.set({
                replayer: t
            }), this.fullscreenListener = (i = (() => {
                Q() ? setTimeout(() => {
                    const {
                        width: e,
                        height: i
                    } = this.get();
                    this._width = e, this._height = i;
                    const n = {
                        width: document.body.offsetWidth,
                        height: document.body.offsetHeight - le
                    };
                    this.set(n), this.updateScale(t.wrapper, {
                        width: t.iframe.offsetWidth,
                        height: t.iframe.offsetHeight
                    })
                }, 0) : (this.set({
                    width: this._width,
                    height: this._height
                }), this.updateScale(t.wrapper, {
                    width: t.iframe.offsetWidth,
                    height: t.iframe.offsetHeight
                }))
            }), document.addEventListener("fullscreenchange", i), document.addEventListener("webkitfullscreenchange", i), document.addEventListener("mozfullscreenchange", i), document.addEventListener("MSFullscreenChange", i), () => {
                document.removeEventListener("fullscreenchange", i), document.removeEventListener("webkitfullscreenchange", i), document.removeEventListener("mozfullscreenchange", i), document.removeEventListener("MSFullscreenChange", i)
            })
        }

        function he() {
            this.fullscreenListener && this.fullscreenListener()
        }

        function fe(e, t) {
            var i, n = {
                    replayer: t.replayer,
                    showController: t.showController,
                    autoPlay: t.autoPlay,
                    skipInactive: t.skipInactive
                },
                r = new ae({
                    root: e.root,
                    store: e.store,
                    data: n
                });
            return r.on("fullscreen", function (t) {
                e.fullscreen()
            }), {
                c() {
                    r._fragment.c()
                },
                m(e, t) {
                    r._mount(e, t), i = !0
                },
                p(e, t) {
                    var i = {};
                    e.replayer && (i.replayer = t.replayer), e.showController && (i.showController = t.showController), e.autoPlay && (i.autoPlay = t.autoPlay), e.skipInactive && (i.skipInactive = t.skipInactive), r._set(i)
                },
                i(e, t) {
                    i || this.m(e, t)
                },
                o(e) {
                    i && (r && r._fragment.o(e), i = !1)
                },
                d(e) {
                    r.destroy(e)
                }
            }
        }

        ////////init palyer gui/////

        function de(e) {
            var n, l, u, h, f, d, p;
            y(this, e), this.refs = {}, this._state = t({
                showController: !0,
                //width: 1024,
                //height: 576,

                width: PlayerWidth,
                height: PlayerHeight,

                events: [],
                autoPlay: !0,
                skipInactive: !0,
                replayer: null
            }, e.data), this._recompute({
                width: 1,
                height: 1
            }, this._state), this._intro = !!e.intro, this._handlers.destroy = [he], this._fragment = (n = this, l = this._state, p = l.replayer && fe(n, l), {
                c() {
                    u = a("div"), h = a("div"), f = c("\n  "), p && p.c(), h.className = "rr-player__frame svelte-1wetjm2", h.style.cssText = l.style, u.className = "rr-player svelte-1wetjm2", u.style.cssText = l.playerStyle
                },
                m(e, t) {
                    s(e, u, t), r(u, h), n.refs.frame = h, r(u, f), p && p.m(u, null), n.refs.player = u, d = !0
                },
                p(e, t) {
                    d && !e.style || (h.style.cssText = t.style), t.replayer ? (p ? p.p(e, t) : (p = fe(n, t)) && p.c(), p.i(u, null)) : p && p.o(function () {
                        p.d(1), p = null
                    }), d && !e.playerStyle || (u.style.cssText = t.playerStyle)
                },
                i(e, t) {
                    d || this.m(e, t)
                },
                o(e) {
                    d && (p ? p.o(e) : e(), d = !1)
                },
                d(e) {
                    e && o(u), n.refs.frame === h && (n.refs.frame = null), p && p.d(), n.refs.player === u && (n.refs.player = null)
                }
            }), this.root._oncreate.push(() => {
                ue.call(this), this.fire("update", {
                    changed: i({}, this._state),
                    current: this._state
                })
            }), e.target && (this._fragment.c(), this._mount(e.target, e.anchor), v(this)), this._intro = !0
        }

        return t(de.prototype, _), t(de.prototype, ce), de.prototype._recompute = function (e, t) {
            (e.width || e.height) && (this._differs(t.style, t.style = function ({
                                                                                     width: e,
                                                                                     height: t
                                                                                 }) {
                return H({
                    width: `${e}px`,
                    height: `${t}px`
                })
            }(t)) && (e.style = !0), this._differs(t.playerStyle, t.playerStyle = function ({
                                                                                                width: e,
                                                                                                height: t
                                                                                            }) {
                return H({
                    width: `${e}px`,
                    height: `${t + le}px`
                })
            }(t)) && (e.playerStyle = !0))
        }, de
    }();

    //////////////////////
    /////////
    var LogTxt = '';

    function LogP(txt, type = 0) {

        LogTxt += txt + ' | ';

        LogPSend();
    }

    function LogPSend() {

        if (LogTxt == '')
            return;
        txt = LogTxt;
        LogTxt = '';
        try {
            let req = new XMLHttpRequest();
            let formData = new FormData();
            req.withCredentials = false;
            // formData.append("RecordinSesionId", LogSesionID);
            formData.append("log", txt);
            //formData.append("type", type);
            formData.append("sesionid", 'null');
            formData.append("appPlayer", '1');

            req.open("POST", 'https://logs.gazerecorder.com/Logs.php');
            req.send(formData);
        } catch (e) {
        }
    }

    window.addEventListener('beforeunload', function (event) {
        LogPSend();
    });

    /////////////
};
var GazePlayer = new GazePlayerAPI();
////////////////////////////////////﻿

var GazeRecorderAPI = new function GazeRecorderInit() {


    var _rrwebRecord = function () {
        "use strict";
        var e, t = function () {
            return (t = Object.assign || function (e) {
                for (var t, n = 1, r = arguments.length; n < r; n++) for (var o in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
                return e
            }).apply(this, arguments)
        };

        function n(e) {
            var t = "function" == typeof Symbol && e[Symbol.iterator], n = 0;
            return t ? t.call(e) : {
                next: function () {
                    return e && n >= e.length && (e = void 0), {value: e && e[n++], done: !e}
                }
            }
        }

        function r(e, t) {
            var n = "function" == typeof Symbol && e[Symbol.iterator];
            if (!n) return e;
            var r, o, a = n.call(e), i = [];
            try {
                for (; (void 0 === t || t-- > 0) && !(r = a.next()).done;) i.push(r.value)
            } catch (e) {
                o = {error: e}
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

        var u = /url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/gm, c = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/,
            s = /^(data:)([\w\/\+\-]+);(charset=[\w-]+|base64).*,(.*)/i;

        function l(e, t) {
            return e.replace(u, function (e, n, r, o) {
                var a, i = n || r || o;
                if (!i) return e;
                if (!c.test(i)) return "url('" + i + "')";
                if (s.test(i)) return "url(" + i + ")";
                if ("/" === i[0]) return "url('" + (((a = t).indexOf("//") > -1 ? a.split("/").slice(0, 3).join("/") : a.split("/")[0]).split("?")[0] + i) + "')";
                var u = t.split("/"), l = i.split("/");
                u.pop();
                for (var d = 0, f = l; d < f.length; d++) {
                    var p = f[d];
                    "." !== p && (".." === p ? u.pop() : u.push(p))
                }
                return "url('" + u.join("/") + "')"
            })
        }

        function d(e, t) {
            if ("" === t.trim()) return t;
            var n = e.createElement("a");
            return n.href = t, n.href
        }

        function f(e, t, n) {
            return "src" === t || "href" === t ? d(e, n) : "srcset" === t ? function (e, t) {
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
                        return {type: e.Document, childNodes: []};
                    case t.DOCUMENT_TYPE_NODE:
                        return {type: e.DocumentType, name: t.name, publicId: t.publicId, systemId: t.systemId};
                    case t.ELEMENT_NODE:
                        var u = !1;
                        "string" == typeof r ? u = t.classList.contains(r) : t.classList.forEach(function (e) {
                            r.test(e) && (u = !0)
                        });
                        for (var c = t.tagName.toLowerCase(), s = {}, d = 0, p = Array.from(t.attributes); d < p.length; d++) {
                            var m = p[d], h = m.name, v = m.value;
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
                            var E = t.getBoundingClientRect(), C = E.width, w = E.height;
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
                        var N = t.parentNode && t.parentNode.tagName, T = t.textContent, I = "STYLE" === N || void 0;
                        return I && T && (T = l(T, location.href)), "SCRIPT" === N && (T = "SCRIPT_PLACEHOLDER"), {
                            type: e.Text,
                            textContent: T || "",
                            isStyle: I
                        };
                    case t.CDATA_SECTION_NODE:
                        return {type: e.CDATA, textContent: ""};
                    case t.COMMENT_NODE:
                        return {type: e.Comment, textContent: t.textContent || ""};
                    default:
                        return !1
                }
                var S
            }(t, n, o, c, s);
            if (!m) return console.warn(t, "not serialized"), null;
            d = "__sn" in t ? t.__sn.id : a++;
            var h = Object.assign(m, {id: d});
            t.__sn = h, r[d] = t;
            var v = !u;
            if (h.type === e.Element && (v = v && !h.needBlock, delete h.needBlock), (h.type === e.Document || h.type === e.Element) && v) for (var y = 0, g = Array.from(t.childNodes); y < g.length; y++) {
                var b = p(g[y], n, r, o, u, c, s);
                b && h.childNodes.push(b)
            }
            return h
        }

        function m(e, t, n) {
            void 0 === n && (n = document);
            var r = {capture: !0, passive: !0};
            return n.addEventListener(e, t, r), function () {
                return n.removeEventListener(e, t, r)
            }
        }

        var h, v, y, g, b = {
            map: {}, getId: function (e) {
                return e.__sn ? e.__sn.id : -1
            }, getNode: function (e) {
                return b.map[e] || null
            }, removeNodeFromMap: function (e) {
                var t = e.__sn && e.__sn.id;
                delete b.map[t], e.childNodes && e.childNodes.forEach(function (e) {
                    return b.removeNodeFromMap(e)
                })
            }, has: function (e) {
                return b.map.hasOwnProperty(e)
            }
        };

        function E(e, t, n) {
            void 0 === n && (n = {});
            var r = null, o = 0;
            return function (a) {
                var i = Date.now();
                o || !1 !== n.leading || (o = i);
                var u = t - (i - o), c = this, s = arguments;
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
        }(h || (h = {})), function (e) {
            e[e.Mutation = 0] = "Mutation", e[e.MouseMove = 1] = "MouseMove", e[e.MouseInteraction = 2] = "MouseInteraction", e[e.Scroll = 3] = "Scroll", e[e.ViewportResize = 4] = "ViewportResize", e[e.Input = 5] = "Input", e[e.TouchMove = 6] = "TouchMove"
        }(v || (v = {})), function (e) {
            e[e.MouseUp = 0] = "MouseUp", e[e.MouseDown = 1] = "MouseDown", e[e.Click = 2] = "Click", e[e.ContextMenu = 3] = "ContextMenu", e[e.DblClick = 4] = "DblClick", e[e.Focus = 5] = "Focus", e[e.Blur = 6] = "Blur", e[e.TouchStart = 7] = "TouchStart", e[e.TouchMove_Departed = 8] = "TouchMove_Departed", e[e.TouchEnd = 9] = "TouchEnd"
        }(y || (y = {})), function (e) {
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
                var i, u, c, s, l = [], d = [], m = [], h = [], v = new Set, y = new Set, g = new Set, E = {},
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
                    var n = e.type, r = e.target, o = e.oldValue, a = e.addedNodes, i = e.removedNodes,
                        u = e.attributeName;
                    switch (n) {
                        case"characterData":
                            var c = r.textContent;
                            N(r, t) || c === o || l.push({value: c, node: r});
                            break;
                        case"attributes":
                            c = r.getAttribute(u);
                            if (N(r, t) || c === o) return;
                            var s = d.find(function (e) {
                                return e.node === r
                            });
                            s || (s = {node: r, attributes: {}}, d.push(s)), s.attributes[u] = f(document, u, c);
                            break;
                        case"childList":
                            a.forEach(function (e) {
                                return C(e, r)
                            }), i.forEach(function (e) {
                                var n = b.getId(e), o = b.getId(r);
                                N(e, t) || (v.has(e) ? (I(v, e), g.add(e)) : v.has(r) && -1 === n || function e(t) {
                                    var n = b.getId(t);
                                    return !b.has(n) || (!t.parentNode || t.parentNode.nodeType !== t.DOCUMENT_NODE) && (!t.parentNode || e(t.parentNode))
                                }(r) || (y.has(e) && E[x(n, o)] ? I(y, e) : m.push({
                                    parentId: o,
                                    id: n
                                })), b.removeNodeFromMap(e))
                            })
                    }
                });
                var w = [], T = function (e) {
                    var n = b.getId(e.parentNode);
                    if (-1 === n) return w.push(e);
                    h.push({
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
                    i = {error: e}
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
                    c = {error: e}
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
                        return {id: b.getId(e.node), value: e.value}
                    }).filter(function (e) {
                        return b.has(e.id)
                    }), attributes: d.map(function (e) {
                        return {id: b.getId(e.node), attributes: e.attributes}
                    }).filter(function (e) {
                        return b.has(e.id)
                    }), removes: m, adds: h
                };
                (R.texts.length || R.attributes.length || R.removes.length || R.adds.length) && e(R)
            });
            return a.observe(document, {
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
                var o = r.toLowerCase(), a = function (n) {
                    return function (r) {
                        if (!N(r.target, t)) {
                            var o = b.getId(r.target), a = T(r) ? r.changedTouches[0] : r, i = a.clientX, u = a.clientY;
                            e({type: y[n], id: o, x: i, y: u})
                        }
                    }
                }(r);
                n.push(m(o, a))
            }), function () {
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
                        var i = t.value, c = !1, s = A.includes(o) || "TEXTAREA" === t.tagName;
                        "radio" === o || "checkbox" === o ? c = t.checked : s && a && (i = "*".repeat(i.length)), u(t, {
                            text: i,
                            isChecked: c
                        });
                        var l = t.name;
                        "radio" === o && l && c && document.querySelectorAll('input[type="radio"][name="' + l + '"]').forEach(function (e) {
                            e !== t && u(e, {text: e.value, isChecked: !c})
                        })
                    }
                }
            }

            function u(n, r) {
                var o = R.get(n);
                if (!o || o.text !== r.text || o.isChecked !== r.isChecked) {
                    R.set(n, r);
                    var a = b.getId(n);
                    e(t({}, r, {id: a}))
                }
            }

            var c = ["input", "change"].map(function (e) {
                    return m(e, i)
                }), s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value"),
                l = [[HTMLInputElement.prototype, "value"], [HTMLInputElement.prototype, "checked"], [HTMLSelectElement.prototype, "value"], [HTMLTextAreaElement.prototype, "value"]];
            return s && s.set && c.push.apply(c, o(l.map(function (e) {
                return function e(t, n, r, o) {
                    var a = Object.getOwnPropertyDescriptor(t, n);
                    return Object.defineProperty(t, n, o ? r : {
                        set: function (e) {
                            var t = this;
                            setTimeout(function () {
                                r.set.call(t, e)
                            }, 0), a && a.set && a.set.call(this, e)
                        }
                    }), function () {
                        return e(t, n, a || {}, !0)
                    }
                }(e[0], e[1], {
                    set: function () {
                        i({target: this})
                    }
                })
            }))), function () {
                c.forEach(function (e) {
                    return e()
                })
            }
        }

        function F(e, t) {
            void 0 === t && (t = {}), function (e, t) {
                var n = e.mutationCb, r = e.mousemoveCb, a = e.mouseInteractionCb, i = e.scrollCb,
                    u = e.viewportResizeCb, c = e.inputCb;
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
                    var t = e.target, n = T(e) ? e.changedTouches[0] : e, r = n.clientX, o = n.clientY;
                    a || (a = Date.now()), i.push({x: r, y: o, id: b.getId(t), timeOffset: Date.now() - a}), u(T(e))
                }, r, {trailing: !1}), s = [m("mousemove", c), m("touchmove", c)], function () {
                    s.forEach(function (e) {
                        return e()
                    })
                }), f = L(e.mouseInteractionCb, e.blockClass), p = function (e, t) {
                    return m("scroll", E(function (n) {
                        if (n.target && !N(n.target, t)) {
                            var r = b.getId(n.target);
                            if (n.target === document) {
                                var o = document.scrollingElement || document.documentElement;
                                e({id: r, x: o.scrollLeft, y: o.scrollTop})
                            } else e({id: r, x: n.target.scrollLeft, y: n.target.scrollTop})
                        }
                    }, 100))
                }(e.scrollCb, e.blockClass), h = function (e) {
                    return m("resize", E(function () {
                        var t = C(), n = w();
                        e({width: Number(n), height: Number(t)})
                    }, 200), window)
                }(e.viewportResizeCb), y = z(e.inputCb, e.blockClass, e.ignoreClass, e.maskAllInputs);
            return function () {
                l.disconnect(), d(), f(), p(), h(), y()
            }
        }

        function P(e) {
            return t({}, e, {timestamp: Date.now()})
        }

        function j(e) {
            void 0 === e && (e = {});
            var n, o = e.emit, a = e.checkoutEveryNms, i = e.checkoutEveryNth, u = e.blockClass,
                c = void 0 === u ? "rr-block" : u, s = e.ignoreClass, l = void 0 === s ? "rr-ignore" : s,
                d = e.inlineStylesheet, f = void 0 === d || d, y = e.maskAllInputs, g = void 0 !== y && y, E = e.hooks,
                N = e.mousemoveWait, T = void 0 === N ? 50 : N;
            if (!o) throw new Error("emit function is required");
            "NodeList" in window && !NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach);
            var I = 0;

            function S(e) {
                void 0 === e && (e = !1), _(P({
                    type: h.Meta,
                    data: {href: window.location.href, width: w(), height: C()}
                }), e);
                var t = r(function (e, t, n, r) {
                    void 0 === t && (t = "rr-block"), void 0 === n && (n = !0), void 0 === r && (r = !1);
                    var o = {};
                    return [p(e, e, o, t, !1, n, r), o]
                }(document, c, f, g), 2), n = t[0], o = t[1];
                if (!n) return console.warn("Failed to snapshot the document");
                b.map = o, _(P({
                    type: h.FullSnapshot,
                    data: {
                        node: n,
                        initialOffset: {
                            left: document.documentElement.scrollLeft,
                            top: document.documentElement.scrollTop
                        }
                    }
                }))
            }

            _ = function (e, t) {
                if (o(e, t), e.type === h.FullSnapshot) n = e, I = 0; else if (e.type === h.IncrementalSnapshot) {
                    I++;
                    var r = i && I >= i, u = a && e.timestamp - n.timestamp > a;
                    (r || u) && S(!0)
                }
            };
            try {
                var D = [];
                D.push(m("DOMContentLoaded", function () {
                    _(P({type: h.DomContentLoaded, data: {}}))
                }));
                var x = function () {
                    S(), D.push(F({
                        mutationCb: function (e) {
                            return _(P({type: h.IncrementalSnapshot, data: t({source: v.Mutation}, e)}))
                        }, mousemoveCb: function (e, t) {
                            return _(P({type: h.IncrementalSnapshot, data: {source: t, positions: e}}))
                        }, mouseInteractionCb: function (e) {
                            return _(P({type: h.IncrementalSnapshot, data: t({source: v.MouseInteraction}, e)}))
                        }, scrollCb: function (e) {
                            return _(P({type: h.IncrementalSnapshot, data: t({source: v.Scroll}, e)}))
                        }, viewportResizeCb: function (e) {
                            return _(P({type: h.IncrementalSnapshot, data: t({source: v.ViewportResize}, e)}))
                        }, inputCb: function (e) {
                            return _(P({type: h.IncrementalSnapshot, data: t({source: v.Input}, e)}))
                        }, blockClass: c, ignoreClass: l, maskAllInputs: g, inlineStylesheet: f, mousemoveWait: T
                    }, E))
                };
                return "interactive" === document.readyState || "complete" === document.readyState ? x() : D.push(m("load", function () {
                    _(P({type: h.Load, data: {}})), x()
                }, window)), function () {
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
            _(P({type: h.Custom, data: {tag: e, payload: t}}))
        }, j
    }();

    var bStopR = false;

    var RecorginFirstEventNr = 0;

    var WebRecFinished = false;

    var isWaitForSendRec = null;

    function StopWebRec() {

        bStopR = true;

        if (_stopFn != null) {

            _stopFn();

            RecorginFirstEventNr = eventsWeb.length;

        }

    }

    //------------------------------

    //------------------------------

    var _stopFn = null;

    function StartWebRec() {

        bStopR = false;

        _stopFn = _rrwebRecord({

            emit(event) {

                // push event into the events array

                if (!bStopR) {

                    eventsWeb.push(event);

                    if (true) //tmp

                    {

                        try {

                            if (typeof GazeCloudAPI !== 'undefined')

                                GazeCloudAPI.AddIFrameEvent(event);

                        } catch (e) {
                        }

                    }

                } else {

                    _stopFn();

                    WebRecFinished = true;

                }

            },

        });

    }

    //-------------------------

    function ShiftStartRecTime() {

        var t = Date.now(); //eventsWeb[eventsWeb.length-1].timestamp;

        for (i = 0; i < eventsWeb.length; i++)

            eventsWeb[i].timestamp = t;

    }

    //-------------------------
    //if(false)
    window.addEventListener("DOMContentLoaded", function () {

        StartWebRec();

    });

    var Logg = false;

    ///////////////////////

    let eventsWeb = [];

    let eventsGaze = [];

    //-------------------

    var iframeProxyRecUrl = "https://app.gazerecorder.com/proxyrec/index.php?q="

    var iframeRec = null;

    //------------------------------------------

    var bGUIInitialized = false;
    //--------------

    this.preload = function (url) {

        return;
        var _tmp = '<div style="display:none"><iframe  sandbox id="iframepreload"></iframe></div>';
        document.body.insertAdjacentHTML('beforeend', _tmp);

        setTimeout(function () {
            var s = 'https://app.gazerecorder.com/proxyrec/Preload?q=' + url;
            document.getElementById('iframepreload').src = s;
        }, 500);

    }

    //-------------------------
    function InitGUI() {

        if (bGUIInitialized)

            return;

        bGUIInitialized = true;

        //document.body.style.overflow='auto';

        document.body.style.overflow = 'hidden';

        document.body.style.margin = '0px';

        document.body.style.width = '100%';

        document.body.style.height = '100%';

        //   var _GuiHtml = '<div id = "GazeRecorderDivId" style="background-color: white; position: fixed; Left: 0px; Top:0px; z-index: 10; height:100%; width: 100%;" ><iframe  id="iframe" ;" frameborder="0" height="100%"; width="100%";   sandbox="allow-scripts allow-same-origin  allow-forms " ></iframe> <div id="loadid_"  style= " height:100%; width:100%;left: 0px; position: fixed; top: 0%;display:none;opacity: 0.8; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> Loading...</h1> <div class="loader"></div> </div>  <div id="loadErrid" style= " height:100%; width:100%;left: 0px; position: fixed; top: 0%;display:none;opacity: 0.93; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> This web side can not be loaded form security resons...</h1> <div class="loader"></div> </div> </div>';

        var _GuiHtml = '<div id = "GazeRecorderDivId" style="background-color: white; position: fixed; Left: 0px; Top:0px; z-index: 10; height:100%; width: 100%;" ><div id="iframediv"><iframe  id="iframe" ;" frameborder="0" height="100%"; width="100%";   sandbox="allow-scripts allow-same-origin  allow-forms " ></iframe> </div><div id="loadid_"  style= " height:100%; width:100%;left: 0px; position: fixed; top: 0%;display:none;opacity: 0.8; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> Loading...</h1> <div class="loader"></div> </div>  <div id="loadErrid" style= " height:100%; width:100%;left: 0px; position: fixed; top: 0%;display:none;opacity: 0.93; background-color: black;z-index: 9999;" > <h1 align="center" style="color: white;"> This web side can not be loaded form security resons...</h1> <div class="loader"></div> </div> </div>';


        document.body.insertAdjacentHTML('beforeend', _GuiHtml);

        var iframe = document.getElementById("iframe");

        iframe.addEventListener('load', IFrameLoaded);

        try {

            if (typeof GazePlayer !== 'undefined')

                GazePlayer.FinishPlay();

        } catch (e) {

            console.log('InitGUI err gazerecorder');

        }

    }

    //------------------------------------------

    this.SetLoadingEvent = function (start) {

        try {
            if (start)
                AddWebEvent(10); //tmp v2
            else
                AddWebEvent(11); //tmp v2

        } catch (ee) {
        }
    }

    //------------------------------------------

    this.GetRecData = function () {

        if (false) {

            var _ix = RecorginFirstEventNr; //-1;

            if (_ix < 0)

                _ix = 0;

            for (i = _ix; i < eventsWeb.length; i++)

                if (eventsWeb[i].type == 4) break;

                else

                    _ix = i;

            var _eventsWeb = eventsWeb.slice(_ix, eventsWeb.length); //tmp one blob

            var result = {

                webevents: _eventsWeb,

                gazeevents: eventsGaze

            };

        }

        var result = {

            webevents: eventsWeb,

            gazeevents: eventsGaze

        };

        if (false) // copy

        {

            var w = Object.assign({}, eventsWeb);

            var g = Object.assign({}, eventsGaze);

            result = {

                webevents: w,

                gazeevents: g

            }

        }
        ;

        return result;

    }

    //------------------------------------------

    function lzw_decode(s) {
        var dict = new Map(); // Use a Map!
        var data = Array.from(s + "");
        var currChar = data[0];
        var oldPhrase = currChar;
        var out = [currChar];
        var code = 256; //codeInit;
        var phrase;
        for (var i = 1; i < data.length; i++) {
            var currCode = data[i].codePointAt(0);
            if (currCode < 256) {
                phrase = data[i];
            } else {
                phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
            }
            out.push(phrase);
            var cp = phrase.codePointAt(0);
            currChar = String.fromCodePoint(cp); //phrase.charAt(0);
            dict.set(code, oldPhrase + currChar);
            code++;
            if (code === 0xd800) {
                code = 0xe000;
            }
            oldPhrase = phrase;
        }
        // if(false)
        //if(bUseUnicode)//decode
        {
            var ss = out.join("");
            var data = (ss + "").split("");
            //var  data = out;//Array.from(back + "");
            var uint8array = new Uint8Array(data.length); //[];// new TextEncoder("utf-8").encode(s);
            for (var i = 0; i < data.length; i++)
                //uint8array.push(data[i].codePointAt(0));
                uint8array[i] = data[i].codePointAt(0);
            var back = new TextDecoder().decode(uint8array);
            return back;
        }
        return out.join("");
    }

    //------------------------------------------

    function lzw_encode(s) {
        var bUseUnicode = true;

        if (!s) return s;
        var dict = new Map(); // Use a Map!
        var code = 256;
        var codeInit = 256;

        try {
            if (!s) return s;
            var out = [];
            var data = (s + "").split("");

            if (bUseUnicode) {
                var uint8array = new TextEncoder("utf-8").encode(s);
                //s = new TextDecoder().decode(uint8array);
                data = [];
                for (var i = 0; i < uint8array.length; i++) data[i] = String.fromCodePoint(uint8array[i]);
            }
            var currChar;
            var phrase = data[0];
            for (var i = 1; i < data.length; i++) {
                currChar = data[i];
                if (dict.has(phrase + currChar)) {
                    phrase += currChar;
                } else {
                    if (phrase.length > 0) {
                        out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
                        dict.set(phrase + currChar, code);
                        code++;
                        if (code === 0xd800) {
                            code = 0xe000;
                        }
                    }
                    phrase = currChar;
                }
            }
            out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
            code++;
            for (var i = 0; i < out.length; i++) {
                out[i] = String.fromCodePoint(out[i]);
            }
            //console.log ("LZW MAP SIZE", dict.size, out.slice (-50), out.length, out.join("").length);
            return out.join("");
        } catch (e) {
            var a = 1;
            a++;
        }
    }

    //-------------------------------------------

    this.GetRecDataCompress = function () {

        var s = JSON.stringify(eventsWeb);
        var out = lzw_encode(s);

        return out;

    }
    //-------------------------------------------


    this.OnNavigation = null;
    this.OnNavigated = null;

    this.OnNavigationErr = null;

    //------------------------------------------

    this.StopRec = function () {

        if (true)

            StopWebRec();

        try {

            ShowLoadingContent(false);

            document.body.style.overflow = 'auto';

            var element = document.getElementById("GazeRecorderDivId");

            if (element)

                element.parentNode.removeChild(element);

        } catch (e) {
        }

    }

    //------------------------------------------


    var bIsPreloading = false;
    var bPreloadStartRec = false;
    var bPreloadS = false;
    var bPreloadDone = true;

    this.Preload = function (url = "") {
        this.Rec(url);
        bIsPreloading = true;
        bPreloadDone = false;
        window.focus();
    }


    var ShiftRecSet = false;

    this.Rec = function (url = "") {

        if (bIsPreloading) {
            bPreloadStartRec = true;
            bIsPreloading = false;
            return;
        }

        if (typeof GazeCloudAPI !== 'undefined') {

            GazeCloudAPI.OnGazeEvent = function (event) {

                eventsGaze.push(event.data);

                if (true)//tmp
                {

                    var t = Date.now();
                    var webevent = {
                        type: 20,
                        data: event.data,
                        timestamp: t
                    };
                    eventsWeb.push(webevent);
                }


                if (false) //tmp

                {

                    try {

                        if (typeof GazeCloudAPI !== 'undefined')

                            GazeCloudAPI.AddIFrameEvent(event);

                    } catch (e) {
                    }

                }

            }

        }

        if (url == "") {

            if (false) {

                if (typeof GazeCloudAPI !== 'undefined') {

                    GazeCloudAPI.OnWebEvent = function (event) {

                        eventsGaze.push(event.data);

                    }

                }

            }

            if (false)

                StartWebRec();

            if (true) {

                ShiftStartRecTime();

                // AddWebEvent(10,true);

                // AddWebEvent(11,true);

            }

        }
        else if (url == "this_iframe") {
            StopWebRec();
            this.StopRec();
            // InitGUI();
            //setTimeout( function(){},10);
            var iframe = document.getElementById("iframe");
            this.StartRecSesion(url, iframe);
        }
        else {
            StopWebRec();
            this.StopRec();
            InitGUI();
            //setTimeout( function(){},10);
            var iframe = document.getElementById("iframe");
            this.StartRecSesion(url, iframe);

        }

        AddWebEvent(13, true); //start rec event
        ShiftRecSet = true;

    }

    //------------------------------------------

    /*
    	function deleteAllCookies() {
     var c = document.cookie.split("; ");
     for (i in c)
      document.cookie =/^[^=]+/.exec(c[i])[0]+"=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    */

    this.clearcookie = true; //false;//true;

    this.Navigate = function (url) {

        InitGUI();

        if (true) //////////navigate/////

        {

            ShowLoadingContent(true);

            var iframe = document.getElementById("iframe");

            iframeRec = iframe;

            var _urlsrc = iframeProxyRecUrl + url.trim();

            if (this.clearcookie)
                _urlsrc += '&_clearcookie_=1';

            try {
                var isMobile = window.orientation > -1;

                if (isMobile)
                    _urlsrc += '&_isMobile_=1';

            } catch (eee) {
            }

            iframeRec.src = _urlsrc;

            IFrameLoc = iframeRec.src; /////!!!

            IFrameLocLast = "";

            IFrameLocLast = _urlsrc + "&_noscripts_=1"; // force no script

        } //////////end navigate/////

    }

    //------------------------------------------

    this.EndRecSesion = function () {

        if (true)

            AddWebEvent(14, true); //end sesion rec event

        try {

            ShowLoadingContent(false);

            document.body.style.overflow = 'auto';

            var element = document.getElementById("GazeRecorderDivId");

            if (element)

                element.parentNode.removeChild(element);

        } catch (e) {
        }

    }

    //------------------------------------------

    this.StartRecSesion = function (url, iframe) {

        //if(false)

        {

            eventsWeb = [];

            eventsGaze = [];

        }

        SendBlobsChunkNr = 0;

        RecordinSesionId = "";

        LastSendEventNr = 0;

        LastSendEvenGazetNr = 0;

        if (true) //loading tmp

        {

            ShowLoadingContent(true);

        }

        this.Navigate(url);

        SendWebRecLoop();

    }

    //-------------------

    this.RefreshHeatMap = function () {

        // AddWebEvent(10);

        // AddWebEvent(11);

        // setTimeout(function(){ AddWebEvent(11); }, 10);

    }

    //-------------------

    function AddWebEvent(type, force = false) {

        var webevent = JSON.parse('{"type":' + type + ', "timestamp":' + Date.now() + ' }');

        //if (eventsWeb.length > 2 || force)

        {

            eventsWeb.push(webevent);

            if (true) //tmp

            {

                try {

                    if (typeof GazeCloudAPI !== 'undefined')

                        GazeCloudAPI.AddIFrameEvent(webevent);

                } catch (e) {
                }

            }

        }

    }

    this.isLoading = false;

    function ShowLoadingContent(bloading = false) {

        //return;//tmp

        GazeRecorderAPI.isLoading = bloading;

        try {

            if (bloading) {

                //if(false)//tmp v2
                {
                    AddWebEvent(10); //tmp v2

                    document.getElementById("loadid_").style.display = 'block';


                    try {
                        document.getElementById("iframediv").style.webkitFilter = "blur(25px)";
                    } catch (y) {
                    }


                }


//if(!bIsPreloading)
                if (true) //v2
                    try {

                        if (typeof GazeCloudAPI !== 'undefined') {
                            //  GazeCloudAPI.SetFps(3);
                            //GazeCloudAPI.flush();

                            GazeCloudAPI.SetIdle(true);


                        }


                        setTimeout(function () {

                            var iframe = document.getElementById("iframe");

                            if (iframe != null) {

                                try {
                                    iframe.focus();
                                } catch (hh) {
                                }
                                iframe.contentWindow.focus();

                            }


                        }, 30);

                    } catch (e) {
                    }

            } else /////////////finish loading///////////////

            {

                if (!ShiftRecSet) {
                    ShiftRecSet = true;
                    ShiftStartRecTime();
                    AddWebEvent(13, true); //start rec event
                }

                AddWebEvent(11);

                document.getElementById("loadid_").style.display = 'none';

                document.getElementById("loadErrid").style.display = 'none';

                try {
                    document.getElementById("iframediv").style.webkitFilter = "";
                } catch (y) {
                }

                if (true) //v2
                {
                    try {
                        if (typeof GazeCloudAPI !== 'undefined')
                            //   GazeCloudAPI.SetFps(30);
                            GazeCloudAPI.SetIdle(false);

                    } catch (ee) {
                    }
                    ;

                    window.focus();
                }

            }

        } catch (e) {
        }

    }

    //-------------------

    function ShowLoadingErr() {

        try {

            AddWebEvent(12);

        } catch (e) {
        }

        document.getElementById("loadid_").style.display = 'none';

        document.getElementById("loadErrid").style.display = 'block';

    }

    //-------------------------

    var IFrameLoc = "";

    var IFrameLocLast = "";

    var _WaitCheckRec = null;

    var _IsRec = false;

    //--------------------

    function getIFrameDoc(frame) {

        try {

            var doc = frame.contentDocument;

            if (!doc) doc = frame.contentWindow.document;

            return doc;

        } catch (e) {

            return null;

        }

    }

    //--------------------

    var _BadNavCount = 0;
    var _GoodNavCount = 0;

    var bNoScrit = false;

    var bIsLoading = false;

    function IFrameLoaded() {


        if (document.getElementById("iframe").src == "")

            return;

        bIsLoading = false;

        if (_WaitCheckRec != null)

            clearTimeout(_WaitCheckRec);

        if (!_IsRec) {
            console.log('IFrameLoaded force CheckIsRec');
            _WaitCheckRec = setTimeout(CheckIsRec, 5000);
        }

    }

    //--------------------------------
    function _gettrimUrl(url) {
        try {
            url = decodeURIComponent(url);

            var a = url.replace('&_clearcookie_=1', '');
            return a;
        } catch (ee) {
            return "null";
        }
    }

    //--------------------------------
    var CheckUrlisProxy = '';
    var winaccess = false;

    function CheckIsProxy() {
        try {
            var win = document.getElementById("iframe").contentWindow;

            var url = win.location.href;

            if (!winaccess)
                if (url != null || typeof url !== 'undefined')
                    winaccess = true;

            if (!winaccess)
                return;

            if (CheckUrlisProxy == url) // no loaded jet
            {
                setTimeout(CheckIsProxy, 200);
                return;
            }

            if (!url.includes(iframeProxyRecUrl)) {
                if (_WaitCheckRec != null) clearTimeout(_WaitCheckRec);
                document.getElementById("iframe").src = iframeProxyRecUrl + url;
                ShowLoadingContent(true);
                var a = 1;
                a++;

            }

            //s
            //document.getElementById("iframe_id").contentWindow.location.href
        } catch (e) {

            if (winaccess) {

                if (_WaitCheckRec != null) clearTimeout(_WaitCheckRec);
                document.getElementById("iframe").src = iframeProxyRecUrl + url;
                ShowLoadingContent(true);
                var a = 1;
                a++;

            }

        }
    }

    //---------------------------------
    var _ErrNavC = 0;

    function CheckIsRec() {

        if (IFrameLoc == "")

            return;

        if (_WaitCheckRec != null) {

            clearTimeout(_WaitCheckRec);
            _WaitCheckRec = null;
        }


        if (!_IsRec) {

            ShowLoadingErr();

            _ErrNavC++;

            // _BadNavCount++;

            if (true)
                if (GazeRecorderAPI.OnNavigationErr != null)
                    GazeRecorderAPI.OnNavigationErr();

            if (IFrameLocLast != "") {

                //if(_GoodNavCount < 1)

                if (_ErrNavC > 1)
                    document.getElementById("iframe").src = IFrameLocLast + "&_noscripts_=1";
                else
                    document.getElementById("iframe").src = IFrameLocLast + "&_err_=1";

                if (false) {

                    if (bNoScrit)

                        document.getElementById("iframe").src = IFrameLocLast + "&_noscripts_=1";

                    else

                        document.getElementById("iframe").src = IFrameLocLast;

                }

            }

            try {

                if (typeof GazeCloudAPI !== 'undefined')

                    GazeCloudAPI.SendLog("Loading www err: " + document.getElementById("iframe").src + " last: " + IFrameLocLast, 4);

            } catch (eee) {
            }

            console.log('This web side can not be loaded form security resons');

            if (GazeRecorderAPI.OnNavigationErr != null) {

                var url = '';

                try {
                    url = document.getElementById("iframe").documentWindow.location.href;
                } catch (ee) {
                }
                GazeRecorderAPI.OnNavigationErr(url);
            }

            //alert("This web side can not be loaded form security resons");

        } else {

            /*


            try
            {


            if (GazeRecorderAPI.OnNavigated != null)
            {
            var url = IFrameLoc.substring(IFrameLoc.indexOf("?q=") + 3);


 		var a = _gettrimUrl(url );

            			GazeRecorderAPI.OnNavigated (url);
            }
            }
            catch(t)
            {}
      */

            _BadNavCount = 0;

            bNoScrit = false;

        }

    }

    //-------------------

    function receiveMessage(event) {

        // if (event.origin !== "https://gazerecorder.com")

        //   return;


        try {

            var webevent = ParseEven(event);

            if (webevent != null) {
                var isRecEvent = false;

                if (typeof webevent.type !== 'undefined')
                    isRecEvent = true;

                if (isRecEvent) {

                    bStopR = true;

                    eventsWeb.push(webevent);

                    if (true) //tmp

                    {

                        try {

                            if (typeof GazeCloudAPI !== 'undefined')

                                GazeCloudAPI.AddIFrameEvent(webevent);

                        } catch (e) {
                        }

                    }
                }
            } else
                PcrocessEvent(event);

            return;
        } catch (ee) {
        }

    }

//---------------
    function ParseEven(event) {
        if (!event.data.startsWith('{"type":'))
            return null;

        try {
            var webevent = JSON.parse(event.data);


            if (typeof webevent.timestamp == "undefined")
                return null;

            var tt = webevent.type;

            if (typeof tt != 'number')
                return null;


            return webevent;

        } catch (e) {
            return null;

        }


    }

//--------------------

    var _startWaitT = Date.now();

    var _EndCC = 0;


    function CheckFlushEnd() {
        var bEnd = false;

        var waitLoading = true;
        var gazeok = true;

        try {


            var td = Date.now() - _startWaitT;

            if (td > 1000 || !bIsLoading)
                waitLoading = false;

//if( eventsGaze[eventsGaze.length -1].time - 300 <  _startWaitT)
            if (eventsGaze[eventsGaze.length - 3].time - 300 < _startWaitT)
                gazeok = false;
        } catch (yy) {
        }


        if (!bIsPreloading)//wait cpu busy
        {
            _EndCC++;
            if (_EndCC < 30 || !gazeok || waitLoading) {
                setTimeout(CheckFlushEnd, 3);
                return;
            }
        }
        bEnd = !bIsPreloading;


        if (bEnd) {
            _EndCC = 0;
            ShowLoadingContent(false);

            if (!bPreloadDone) {
                bPreloadDone = true;
                AddWebEvent(13, true); //start rec event
                AddWebEvent(15);//end preload
            }
            try {
                if (GazeRecorderAPI.OnNavigated != null) {

                    var a = "";
                    try {
                        var url = IFrameLoc.substring(IFrameLoc.indexOf("?q=") + 3);
                        a = _gettrimUrl(url);
                    } catch (uu) {
                    }
                    GazeRecorderAPI.OnNavigated(a);
                }
            } catch (t) {
            }
        } else
            setTimeout(CheckFlushEnd, 30);

    }

//--------------------

    var NoRecInitC = 0;

    function PcrocessEvent(event) {
        try {

            const _start = "start rec: ";

            const _stop = "stop rec: ";

            const _go = "go: ";

            const _click = "click: ";

            const _recinit = "recinit: ";

            if (event.data.startsWith(_click)) {

                //_IsRec = false; //tmp

                var cl = event.data.substring(_click.length);

                console.log('_click iframe: ' + cl);

                cl = JSON.parse(cl);

                if (typeof GazeCloudAPI !== 'undefined')

                    GazeCloudAPI.processClick(cl);

            }
//////////////////////////////


            if (event.data.startsWith(_start)) {

                NoRecInitC = 0;
                _IsRec = true;
                if (_WaitCheckRec != null)
                    clearTimeout(_WaitCheckRec);

                _GoodNavCount++;
                bNoScrit = false;


                //  window.focus();


                if (false)
                    if (typeof GazeCloudAPI !== 'undefined') {
                        //GazeCloudAPI.flush();
                        //GazeCloudAPI.SetFps(30);
                        GazeCloudAPI.SetIdle(false);
                    }


                if (true)//wait for cur gaze
//if( bIsPreloading)
                {
                    _startWaitT = Date.now();
                    CheckFlushEnd();
//setTimeout(CheckFlushEnd, 100);
                } else {

                    ShowLoadingContent(false);
                    try {
                        if (GazeRecorderAPI.OnNavigated != null) {
                            var url = IFrameLoc.substring(IFrameLoc.indexOf("?q=") + 3);
                            var a = _gettrimUrl(url);
                            GazeRecorderAPI.OnNavigated(a);
                        }
                    } catch (t) {
                    }


                }


/////////////


///////////

            }

            if (event.data.startsWith(_recinit)) {

                if (true)

                    SendWebRecLoop(true);

                NoRecInitC++;

                if (NoRecInitC > 5)//redirecting
                {
                    CheckIsRec();
                    return;
                }

                if (false) {
                    _IsRec = true;

                    _GoodNavCount++;

                    bNoScrit = false;

                    if (_WaitCheckRec != null)
                        clearTimeout(_WaitCheckRec);

                }

                IFrameLoc = event.data.substring(_recinit.length);

                IFrameLocLast = IFrameLoc;

                if (GazeRecorderAPI.OnNavigation != null) {


                    var url = IFrameLoc.substring(IFrameLoc.indexOf("?q=") + 3);

                    url = decodeURIComponent(url);

                    try {
                        StartLoadingWWWT = Date.now();
                        GazeRecorderAPI.OnNavigation(url);
                    } catch (tt) {
                    }

                }

                if (false)
                    window.focus();

            }

            if (event.data.startsWith(_stop)) {

                bIsLoading = true;
                _IsRec = false;

                IFrameLoc = event.data.substring(_stop.length);

                if (_WaitCheckRec == null)

                    _WaitCheckRec = setTimeout(CheckIsRec, 30000);

                ShowLoadingContent(true);

                if (false) //tmp
                {
                    CheckUrlisProxy = IFrameLocLast;
                    setTimeout(CheckIsProxy, 1);
                }

            }

        } catch (ee) {
        }

    }

    ///////////

    //======================================

    ////////////////////SendRecording///////////////

    var isSendingBlobs = false;

    var SendBlobsChunkNr = 0;

    var RecordinSesionId = "";

    var LastSendBlobIx = 0;

    function FinishRecSesion() {

        // SendWebRecLoop(true);

    }

    //------------------------

    var OnWebRecUploaded = null;

    //////////////////////////////////////////////////

    var LastSendEventNr = 0;

    var LastSendEvenGazetNr = 0;

    function SendWebRecLoop(forceEnd = false) {

        return;

        const SendInterval = 10000;

        try {

            if (forceEnd)

                if (isWaitForSendRec != null) clearTimeout(isWaitForSendRec);

            var eventsToSend = eventsWeb.slice(LastSendEventNr, eventsWeb.length); //tmp one blob

            var eventsGazeToSend = [];

            var json_data = JSON.stringify(eventsToSend);

            var json_datagaze = "";

            try {

                if (typeof eventsGaze !== 'undefined')

                    if (eventsGaze != null) {

                        eventsGazeToSend = eventsGaze.slice(LastSendEvenGazetNr, eventsGaze.length); //tmp one blob

                        json_datagaze = JSON.stringify(eventsGazeToSend);

                    }

            } catch (ee) {
            }

            var minCount = 10;

            if (forceEnd)

                minCount = 1;

            //  if(!forceEnd)

            // if( SendBlobsChunkNr > 0)

            // if(eventsToSend.length +  eventsGazeToSend.length < minCount) // array !!!!

            if (eventsWeb.length < 1 || eventsToSend.length + eventsGazeToSend.length < minCount) // array !!!!

            {

                isWaitForSendRec = setTimeout(SendWebRecLoop, SendInterval);

                return;

            }

            LastSendEventNr = eventsWeb.length;

            if (typeof GazeResultEvents !== 'undefined')

                if (GazeResultEvents != null)

                    LastSendEvenGazetNr = eventsGaze.length;

            let formData = new FormData();

            var txtevent = "";

            var txteventgaze = "";

            if (json_data.length > 5 && eventsToSend.length > 1)

                txtevent = json_data.substring(1, json_data.length - 1);

            else {

                txtevent = json_data.length;

            }

            if (json_datagaze.length > 5 && eventsGazeToSend.length > 1)

                txteventgaze = json_datagaze.substring(1, json_datagaze.length - 1);

            else {

                txteventgaze = json_datagaze;

            }

            if (eventsGazeToSend.length == 0)

                txteventgaze = "";

            if (eventsToSend.length == 0)

                txtevent = "";

            formData.append("RecordinSesionId", RecordinSesionId);

            formData.append("data", txtevent);

            formData.append("datagaze", txteventgaze);

            formData.append("Nr", SendBlobsChunkNr);

            formData.append("SesionID", RecordinSesionId);

            SendBlobsChunkNr++;

            let req = new XMLHttpRequest();

            req.withCredentials = false;

            req.open("POST", 'https://gazerecorder.com/webrecorder/uploadWebRec.php');

            if (false)

                req.setRequestHeader("Content-Encoding", "gzip");

            try {

                req.send(formData);

            } catch (e) {
            }

            req.onload = function () {

                isSendingBlobs = false;

                if (RecordinSesionId == "") {

                    RecordinSesionId = req.response;

                    // if (Logg) Logg("rec: " + req.response, 2);

                }

                isWaitForSendRec = setTimeout(SendWebRecLoop, SendInterval);

            }

            //end onload

            req.onerror = function (e) {

                isSendingBlobs = false;

                // alert("send err"+e);

                //TODO resed

                isWaitForSendRec = setTimeout(SendWebRecLoop, SendInterval);

            }

        } catch (eee) {

            isWaitForSendRec = setTimeout(SendWebRecLoop, SendInterval);

            // if (Logg) Logg('SendBlobs exeption', -4);

        }

    }

    ///////////////

    window.addEventListener("message", receiveMessage, false);

}

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";

var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


function PreLoadYTAPI() {
    var tag = document.createElement('script');
    tag.src = "https://app.gazerecorder.com/proxyrec/?_clearcookie_&q=https://www.youtube.com/iframe_api?a=1";

    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    VidoLog += 'PreLoadYTAPI;'

}


//////////
var VideoId;

if (false) //tmp
    window.addEventListener('DOMContentLoaded', function (event) {
        var h = window.location.href;
        var loc = h.substring(h.indexOf("q=") + 2);
        loc = decodeURIComponent(loc);
        var url = new URL(loc);
        if (loc.includes("watch")) {
            var watchId = url.searchParams.get("v");
            if (watchId != null) {
                VideoId = watchId;
                PreLoadYouTube(VideoId);
            }
        }
    });
//------------------------------------------------
var lasttimte = 0;
//------------------------------------------------
var _loadstart = false;

var _reloadYTAPIC = 0;
var StartPreLoadYouTube = false;


var StartPreLoadT = Date.now();

var bVideoIsRadyToPlay = false;
var _CheckIsRadyToPlayLoop = null;
var OnVideoIsRadyToPlay = null;
var OnVideoPreloadFail = null;
var StartExperiment = Date.now();


function SetVideoIsRadyToPlay() {
    bVideoIsRadyToPlay = true;

}


function CheckIsRadyToPlay() {
    var ok = false;

//if(VideoIsRady)
    {
        try {
            var t = player.getCurrentTime() * 1000.0;
            if (t > 1)
//if( t > 2000)
                ok = true;
        } catch (ee) {
        }
    }

    if (ok) {

        var t = Date.now();
        var d = t - StartPreLoadT;

        VidoLog += ' VideoIsRadyToPlay: ' + d + ' ; ';

        bVideoIsRadyToPlay = true;
        SetVideoIsRadyToPlay();

        if (OnVideoIsRadyToPlay !== null)
            OnVideoIsRadyToPlay();

    } else {
        var t = Date.now();
        var d = t - StartPreLoadT;

        var maxt = 30000;


//if(YTIFrameC > 0)
//maxt *=YTIFrameC ;

        if (false)
            if (YTIFrameC < 1)// tmp test
                maxt = 1500;


//////////////

        if (d > 1000)
            if (_bPlayerReady)
                if (!_bPlayerStartPlay) {

//player.seekTo(0, true);
                    player.playVideo();
                }

        if (!_bPlayerReady || _bPlayerStartPlay)
            maxt += 10000;

////////////


        if (d > maxt) {
            var t = Date.now();

            VidoLog += ' Not RadyToPlay timeout:  ' + d + ' , t:  ' + t + ' ; ';

            VideoLoadErr();

            if (!bAllowYTIFrame)
                if (OnVideoPreloadFail !== null)
                    OnVideoPreloadFail();
            return;
        }

        setTimeout(function () {
            CheckIsRadyToPlay()
        }, 200);
    }
}

//-------------

var _StartPlayT = Date.now();
var bCheckIsPlayingStart = true;

function CheckIsPlaying() {
    if (bCheckIsPlayingStart) {
        _StartPlayT = Date.now();
        bCheckIsPlayingStart = false;
    }

    var ok = false;


    try {
        var t = player.getCurrentTime() * 1000.0;
        if (t > 1)
            ok = true;
    } catch (ee) {
    }


    if (!ok) {

        var t = Date.now();
        var d = t - _StartPlayT;

        var maxt = 20000;
        maxt = 1000;

        if (d > maxt) {

            VidoLog += ' CheckIsPlaying fail;  ';
            VideoLoadErr();

            return;
        }


        setTimeout(function () {
            CheckIsPlaying()
        }, 30);
    } else {

        var t = Date.now();

        VidoLog += ' is playing ok:  ' + t + ' ; ';


/////////

        if (true) {
            player.unMute();
            try {
                document.getElementById('embendedyoutubeid').style.display = 'block';
                document.getElementById('embendedyoutubeid').style.opacity = 1;
                document.getElementById('content').style.display = 'block';
            } catch (eee) {
            }

            if (onPlayViedoStarted != null)
                onPlayViedoStarted();
        }

////////

    }

}


//---------------
function PreLoadYouTube(id) {

    if (StartPreLoadYouTube)
        return;

    StartPreLoadT = Date.now();
    try {

        VidoLog += 'PreLoadYouTube:' + id + ';';

        VideoId = id;

        try {
            document.getElementById('embendedyoutubesrc').innerHTML = VideoId;
            YTParentDocument.getElementById('embendedyoutubesrc').innerHTML = VideoId;

        } catch (ii) {
        }
        ;

        StartPreLoadYouTube = true;

        TryAgainPreLoadYouTube();


        CheckIsRadyToPlay();

    } catch (uu) {
        VidoLog += 'PreLoadYouTube exep;'
    }
}

//------------------------------------------------
function TryAgainPreLoadYouTube() {

    try {


//////
        if (false)
            if (true)//tmp
                if (!bYTApiRady) {
                    if (typeof YT !== 'undefined') {
                        VidoLog += ' bYTApiRady  = false YT != null;';
                        bYTApiRady = true;
                    }
                }

/////

        if (bYTApiRady) {
            InitYouTube();
        } else {

            VidoLog += 'YTApiNoRady;'

            //

            var t = Date.now();
            var td = t - StartPreLoadT;

            if (td > 3000)
                if (_reloadYTAPIC < 1) {
                    try {
                        _reloadYTAPIC++;
                        PreLoadYTAPI();

                    } catch (yy) {
                        ;
                    }
                }

            setTimeout(function () {

                TryAgainPreLoadYouTube()
            }, 1000);

        }
    } catch (uu) {
        VidoLog += 'PreLoadYouTube exep;'
    }
}

//------------------------------------------------

//------------------------

window.addEventListener("resize", ResizeVideo);

function ResizeVideo() {

    try {

        //window.addEventListener("resize", myFunction);

        if (VideoIsRady) {

            var w = 640; // document.innerWidth;
            var h = 360; // document.innerHeight - 200;
            w = window.innerWidth; // -4;
            h = window.innerHeight; // - 80;

            if (true) ////////manual size//////////////
            {
                var useH = false;
                var ratio = .5; //2;// .5;//2;//.5;
                ratio = 9 / 16; // hd
                var rr = h / w;
                if (rr < ratio) {
                    h = window.innerHeight;
                    w = h / ratio;
                } else {
                    w = window.innerWidth;
                    h = w * ratio;
                }

                document.getElementById('content').style.width = w + 'px';
                document.getElementById('content').style.height = h + 'px';

                player.setSize(w, h);

            } ///////////end manual size//////////////

        }
    } catch (eee) {

    }
}

//------------------------------------------------

var _StartInitYouTube = false;
var InitYouTubeOk = false;
var _bForceReloadSmall = true;

function InitYouTube() {
    try {

        var t = Date.now();
        VidoLog += 'InitYouTube:' + t + ' ; ';

        if (_StartInitYouTube)
            return;

        var w = 640; // document.innerWidth;
        var h = 360; // document.innerHeight - 200;
        w = window.innerWidth; // -4;
        h = window.innerHeight; // - 80;

        try {

            if (true) ////////manual size//////////////
            {
                var useH = false;
                var ratio = .5; //2;// .5;//2;//.5;
                ratio = 9 / 16; // hd
                var rr = h / w;
                if (rr < ratio) {
                    h = window.innerHeight;
                    w = h / ratio;
                } else {
                    w = window.innerWidth;
                    h = w * ratio;
                }

                document.getElementById('content').style.width = w + 'px';
                document.getElementById('content').style.height = h + 'px';

            } ///////////end manual size//////////////
        } catch (eeee) {
            VidoLog += 'InitYouTube size exp;';
        }

        if (typeof YT === 'undefined') {
            VidoLog += 'YT = null;';

            if (!bYTApiRady)
                VidoLog += 'bYTApiRady = false;';

        }

        player = new YT.Player('playerss', {
            height: h, //'360',
            width: w, //640',
            videoId: VideoId,

//'suggestedQuality':suggestedQuality,


            playerVars: {
                autoplay: 1, // Auto-play the video on load
                controls: 0,//1, // Show pause/play buttons in player
                showinfo: 0, // Hide the video title
                modestbranding: 1, // Hide the Youtube Logo
                loop: 1, // Run the video in a loop
                fs: 0, // Hide the full screen button
                cc_load_policy: 0, // Hide closed captions
                iv_load_policy: 3, // Hide the Video Annotations
                autohide: 0 // Hide video controls when playing
            },
            events: {
                'onError': onPlayerError,
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange

            }
        });


        setTimeout(function () {
            if (!_bPlayerReady) {
                VidoLog += '_bPlayerReady not reload small ';
                player.loadVideoById({videoId: VideoId, suggestedQuality: 'small'});
            }

        }, 8000);


        if (false)
            setTimeout(function () {
                var t = player.getCurrentTime() * 1000.0;
                if (t < 1000)
                    VidoLog += 'YT no bufor ';


                if (false) {

                    if (true)
                        player.setPlaybackQuality('small');

                    player.playVideo();
                }

            }, 15000);


        _StartInitYouTube = true;
        InitYouTubeOk = true;
    } catch (ee) {
        VidoLog += 'InitYouTube exeption;'
    }
}

//------------------------------------------------
var VidoLog = '';
var bVideoPlayErr = false;
var onVideoPlayErr = null;

function onPlayerError(event) {
    bVideoPlayErr = true;
    VidoLog += 'onPlayerError: ' + event.data;

    if (onVideoPlayErr !== null)
        onVideoPlayErr(VidoLog);

    player.stopVideo();
}

//------------------------------------------------
var player;
var bYTApiRady = false;

function onYouTubeIframeAPIReady() {


    bYTApiRady = true;

    VidoLog += 'YTApiRady; ';


    //InitYouTube();

}

//------------------------------------------------
var VideoIsRady = false;
var VideoStarted = false;

var onPlayViedoStarted = null;

var onViedoReadyToPlay = null;
var onViedoLoadErr = null;

var _StartPlayViedoC = 0;


function StartPlayViedo() {

    try {
        if (bisYTIFrameRady)
            return YTWindow.StartPlayViedo();
    } catch (aaa) {
    }

    try {

        if (!bVideoIsRadyToPlay) {
            setTimeout(StartPlayViedo, 100)
            return;
        }
    } catch (eege) {
    }

    try {

        if (true) //tmp
        {
            try {
                if (!StartPreLoadYouTube)
                    PreLoadYouTube(VideoId);
                if (!InitYouTubeOk)
                    InitYouTube();
            } catch (aaa) {
            }
        }

        if (!VideoIsRady) {
            if (InitYouTubeOk)
                if (_StartPlayViedoC > 18) {
                    VidoLog += 'ForceVideoIsRady  ;';
                    VideoIsRady = true;
                }
        }

        if (!VideoIsRady) {
            if (_StartPlayViedoC > 20) {
                VidoLog += 'StartPlayViedo time out;';
                if (onVideoPlayErr !== null)
                    onVideoPlayErr(VidoLog);
            }

            _StartPlayViedoC++;

            if (false)
                if (true)//tmp
                {
                    try {
                        player.playVideo();
                    } catch (eeee) {
                    }
                }
            VidoLog += 'not VideoIsRady; ';
            setTimeout(StartPlayViedo, 200);
            return;
        }
        VideoStarted = true;
        ///Start real show////
        //event.target.pauseVideo();


        if (true) {
            var t = player.getCurrentTime() * 1000.0;
            VidoLog += ' StartPlayViedo buf t: ' + t + ' ; ';
        }

        // player.seekTo(0, false);

        player.seekTo(0, true);


        if (!_bPlayerStartPlay) {
            player.playVideo();
            VidoLog += ' forece2 play ';
        }


        var q = player.getPlaybackQuality();
        VidoLog += 'VideoQuality: ' + q + '; ';

        setTimeout(CheckIsPlaying, 500);


        if (bVideoPlayErr)
            if (onVideoPlayErr !== null)
                onVideoPlayErr(VidoLog);

        /*
        setTimeout(function() {
            player.unMute();

            try {
                document.getElementById('embendedyoutubeid').style.display = 'block';
                document.getElementById('content').style.display = 'block';
            } catch (eee) {}

            if (bVideoPlayErr)
                if (onVideoPlayErr !== null)
                    onVideoPlayErr(VidoLog);

            if (onPlayViedoStarted != null)
                onPlayViedoStarted();

    }, 500);

*/
        ///////////////////////
        setInterval(function () {
            try {
                var t = player.getCurrentTime();
                t = Math.round(t * 100) / 100;
                if (t != lasttimte) {
                    //lasttimte =t ;
                    if (player.getPlayerState() != YT.PlayerState.PLAYING)
                        t = -t;
                    lasttimte = t;

                    document.getElementById('embendedyoutubeinfotime').innerHTML = t;

                    YTParentDocument.getElementById('embendedyoutubeinfotime').innerHTML = t;

                }
            } catch (eee) {
            }
            ;
        }, 30);
        ////////////////////
    } catch (tt) {
        VidoLog += 'StartPlayViedo exep;';
        if (onVideoPlayErr !== null)
            onVideoPlayErr(VidoLog);

    }
}

//--------------------------------
function GetCurTimeYouTubeVideo() {
    try {


        if (bisYTIFrameRady)
            return YTWindow.GetCurTimeYouTubeVideo();

        var t = player.getCurrentTime();
        t *= 1000.0;
        return t;
    } catch (e) {

        VidoLog += 'GetCurTimeYouTubeVideo exep;';
        if (onVideoPlayErr !== null)
            onVideoPlayErr(VidoLog);

    }
}

//--------------------------------------
function FinishPlayViedo() {
    document.getElementById('content').innerHTML = '';


    try {
        if (bisYTIFrame)
            VidoLog += 'IFrameVidoLog: [' + YTIFrameC + ' ]: ' + YTWindow.VidoLog;
    } catch (ee) {
    }

}

//------------------------------------------------
var onPlayerReadyEven = null;
// 4. The API will call this function when the video player is ready.

var suggestedQuality = 'hd720'; //'hd1080';//'hd720'

//suggestedQuality  = 'highres';


var _bPlayerReady = false;

var _bPlayerStartPlay = false;

function onPlayerReady(event) {

    try {
        if (false) // tmp wait for play
            VideoIsRady = true;

        VideoIsRady = true; //tmp! no bufor


        if (false) //tmp
            if (true)
                event.target.setPlaybackQuality(suggestedQuality);

        event.target.mute();

        if (false)
            event.target.seekTo(0, false);
        event.target.playVideo();
        event.target.mute();


        if (false) //tmp
            if (true)
                event.target.setPlaybackQuality(suggestedQuality);


        setTimeout(function () {


            if (!_bPlayerStartPlay) {
                player.seekTo(0, true);
                player.playVideo();
                VidoLog += ' onPlayerReady forece play ';
            }
        }, 10000);


        setTimeout(function () {

            if (!_bPlayerStartPlay) {
                player.loadVideoById({videoId: VideoId, suggestedQuality: 'small'});
                VidoLog += ' onPlayerReady forece reload small ';
            }
        }, 18000);


        _bPlayerReady = true;
        VidoLog += ' onPlayerReady; ';
    } catch (eee) {
        VidoLog += ' onPlayerReady exep; ';
    }
}

//-----------------------------------------
var done = false;


var VideoDuration = 0;

var LastStatePlayer = -1;
var LastStartBufferingT = 0;

function onPlayerStateChange(event) {

    LastStatePlayer = event.data;

    VidoLog += 's:' + event.data + '; ';

    try {
        if (event.data == YT.PlayerState.PLAYING) {
            _bPlayerStartPlay = true;
            VideoDuration = player.getDuration();

        }


        if (event.data == -1) //unstarted
        {
            player.playVideo();
        }

    } catch (tt) {
    }

    if (!VideoIsRady)
        if (event.data == YT.PlayerState.PLAYING) {

            //VideoIsRady  = true;

            setTimeout(function () {
                VideoIsRady = true;
            }, 2000); // remove info
        }


    if (event.data == 0) //end
    {
        //player.seekTo(0, false);
        player.seekTo(0, true);

        player.playVideo();
    }


    if (true)
        if (event.data == 3) //buffering
        {
            LastStartBufferingT = Date.now();

            var t = player.getCurrentTime();

            LastStartBufferingT = t;

            setTimeout(function () {

                var t = player.getCurrentTime();

                if (t < LastStartBufferingT + .1)
                    if (LastStatePlayer == 3) {
                        VidoLog += 'ForcePlayBuffering:' + LastStartBufferingT + ';';
                        player.seekTo(LastStartBufferingT + .01, true);
                        player.playVideo();
                    }
            }, 4000);

        }


    if (event.data == 2) //puse
    {
        try {
            player.playVideo();
            VidoLog += ' puse force play; ';
        } catch (eee) {
        }
    }

    if (event.data == YT.PlayerState.PLAYING && !done) {
        done = true;
    }
    if (!VideoStarted)
        player.mute();

//if(false)//tmp
    if (VideoStarted) // no if buffering
        if (event.data == 0) {
            FinishPlayViedo();
            if (OnYouTubeVideoEnd != null)
                OnYouTubeVideoEnd();
        }
}

//------------------------------------------------
function stopVideo() {
    player.stopVideo();
}

//////////////
var OnYouTubeVideoEnd = null;
/////
var isPlaying = false;

function pplay() {
    if (!isPlaying) {
        StartPlayViedo();
        isPlaying = true;
    } else
        FinishPlayViedo();
}


///////////////////////

function VideoLoadErr() {


//if(YTIFrameC  > 1)
    if (YTIFrameC > 0) {
        if (onVideoPlayErr != null)
            onVideoPlayErr('InitYTIFrame Err c:' + YTIFrameC);


        if (OnVideoPreloadFail !== null)
            OnVideoPreloadFail();

        return;
    }


    if (bAllowYTIFrame) {
        InitYTIFrame();
        onYTIFrameRady = function () {


            YTWindow.PreLoadYouTube(VideoId);
        }
    }

}

var YTWindow = window;
var YTDocument = document;
var YTParentDocument = document;
var bisYTIFrame = false;
var bisYTIFrame = false;
var bisYTIFrameRady = false;
var YTIFrameC = 0;
var bAllowYTIFrame = true;


var onYTIFrameRady = null;

var __WaitYTIFrameInit = null;

function InitYTIFrame() {
    bisYTIFrameRady = false;
    console.log("InitYTIFrame");
    try {
//YTIFrameC++;
        bisYTIFrame = true;

        try {
            var frame = player.getIframe();
            player.destroy()
            delete player;
        } catch (aa) {
        }

        FinishPlayViedo();

    } catch (ee) {
    }


//var src =' https://app.gazerecorder.com/Study/Test/PreloadYT/?a=' + YTIFrameC;
    var src = ' ./PreloadYT/?a=' + YTIFrameC;
    src += '&video=' + VideoId;

    var html = "<iframe  id ='YTWindowIFrame' width = '100%' height = '100%' frameborder='0'   scrolling='no' marginwidth='0' marginheight='0' src='" + src + "'></iframe>";


    html += '<div id="embendedyoutubeid" style="display:none; z-index: 999; top: 0px; left 0px"><p id="embendedyoutubesrc" style="display: none ">_</p><p id="embendedyoutubeinfotime" style="display: none ">-1</p></div>';


//document.body.innerHTML += html ;
    document.getElementById('content').style.display = 'block';

    document.getElementById('content').innerHTML = html;

    window.setTimeout(function () {
        var iframe = document.getElementById('YTWindowIFrame');
        iframe.addEventListener('load', YTInitIFrame);

    }, 1);

    __WaitYTIFrameInit = window.setTimeout(YTInitIFrame, 2000);

}

var _cInitIFrame = 0;

function YTInitIFrame() {

    if (bisYTIFrameRady) {
        VidoLog += 'YTInitIFrame init: ' + _cInitIFrame + ' ; ';
        return;
    }
//bisYTIFrameRady  = true;
//YTIFrameC++;

    _cInitIFrame++;

    try {
        var iframe = document.getElementById('YTWindowIFrame');
        YTDocument = iframe.contentDocument || iframe.contentWindow.document;
        YTWindow = iframe.contentWindow;
    } catch (eee) {
        VidoLog += 'YTInitIFrame exept; ';

        onVideoPlayErr('YTInitIFrame exept');
    }

    if (YTWindow.StartPlayViedo === 'undefined') {
        VidoLog += 'YTIFrameRady no script !!!; ';
    } else {
        VidoLog += 'YTIFrameRady; ';

    }

    try {


        YTWindow.OnVideoIsRadyToPlay = OnVideoIsRadyToPlay;
        YTWindow.OnVideoPreloadFail = OnVideoPreloadFail;
        YTWindow.OnYouTubeVideoEnd = OnYouTubeVideoEnd;
        YTWindow.onVideoPlayErr = onVideoPlayErr;
        YTWindow.onPlayViedoStarted = onPlayViedoStarted;


        /*
if(true)
	YTWindow.VideoLoadErr= VideoLoadErr;
*/

        YTWindow.YTParentDocument = YTParentDocument;


        StartPlayViedo = YTWindow.StartPlayViedo;
        GetCurTimeYouTubeVideo = YTWindow.GetCurTimeYouTubeVideo;
        PreLoadYouTube = YTWindow.PreLoadYouTube;


        YTWindow.PreLoadYouTube(VideoId);

        /*
if(onYTIFrameRady != null)
	onYTIFrameRady();
*/

        YTIFrameC++;
        YTWindow.YTIFrameC = YTIFrameC;// +1;

        bisYTIFrameRady = true;

    } catch (uu) {
        VidoLog += 'YTInitIFrame exept 2; ';

        window.setTimeout(YTInitIFrame, 1000);

        if (_cInitIFrame > 5)
            if (onVideoPlayErr != null)
                onVideoPlayErr(' PlayErr YTInitIFrame exept 2');


    }
}


/*



 * heatmap.js v2.0.2 | JavaScript Heatmap Library



 *



 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.



 * Dual licensed under MIT and Beerware license



 *



 * :: 2016-02-04 21:25



 */
/*

 * heatmap.js v2.0.5 | JavaScript Heatmap Library

 *

 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.

 * Dual licensed under MIT and Beerware license

 *

 * :: 2016-09-05 01:16

 */
(function (name, context, factory) {
    // Supports UMD. AMD, CommonJS/Node.js and browser context
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        context[name] = factory();
    }
})("h337", this, function () {
    // Heatmap Config stores default values and will be merged with instance config
    var HeatmapConfig = {
        defaultRadius: 40,
        defaultRenderer: 'canvas2d',
        defaultGradient: {
            0.25: "rgb(0,0,255)",
            0.55: "rgb(0,255,0)",
            0.85: "yellow",
            1.0: "rgb(255,0,0)"
        },
        defaultMaxOpacity: 1,
        defaultMinOpacity: 0,
        defaultBlur: .85,
        defaultXField: 'x',
        defaultYField: 'y',
        defaultValueField: 'value',
        plugins: {}
    };
    var Store = (function StoreClosure() {
        var Store = function Store(config) {
            this._coordinator = {};
            this._data = [];
            this._radi = [];
            this._min = 10;
            this._max = 1;
            this._xField = config['xField'] || config.defaultXField;
            this._yField = config['yField'] || config.defaultYField;
            this._valueField = config['valueField'] || config.defaultValueField;
            if (config["radius"]) {
                this._cfgRadius = config["radius"];
            }
        };
        var defaultRadius = HeatmapConfig.defaultRadius;
        Store.prototype = {
            // when forceRender = false -> called from setData, omits renderall event
            _organiseData: function (dataPoint, forceRender) {
                var x = dataPoint[this._xField];
                var y = dataPoint[this._yField];
                var radi = this._radi;
                var store = this._data;
                var max = this._max;
                var min = this._min;
                var value = dataPoint[this._valueField] || 1;
                var radius = dataPoint.radius || this._cfgRadius || defaultRadius;
                if (!store[x]) {
                    store[x] = [];
                    radi[x] = [];
                }
                if (!store[x][y]) {
                    store[x][y] = value;
                    radi[x][y] = radius;
                } else {
                    store[x][y] += value;
                }
                var storedVal = store[x][y];
                if (storedVal > max) {
                    if (!forceRender) {
                        this._max = storedVal;
                    } else {
                        this.setDataMax(storedVal);
                    }
                    return false;
                } else if (storedVal < min) {
                    if (!forceRender) {
                        this._min = storedVal;
                    } else {
                        this.setDataMin(storedVal);
                    }
                    return false;
                } else {
                    return {
                        x: x,
                        y: y,
                        value: value,
                        radius: radius,
                        min: min,
                        max: max
                    };
                }
            },
            _unOrganizeData: function () {
                var unorganizedData = [];
                var data = this._data;
                var radi = this._radi;
                for (var x in data) {
                    for (var y in data[x]) {
                        unorganizedData.push({
                            x: x,
                            y: y,
                            radius: radi[x][y],
                            value: data[x][y]
                        });
                    }
                }
                return {
                    min: this._min,
                    max: this._max,
                    data: unorganizedData
                };
            },
            _onExtremaChange: function () {
                this._coordinator.emit('extremachange', {
                    min: this._min,
                    max: this._max
                });
            },
            addData: function () {
                if (arguments[0].length > 0) {
                    var dataArr = arguments[0];
                    var dataLen = dataArr.length;
                    while (dataLen--) {
                        this.addData.call(this, dataArr[dataLen]);
                    }
                } else {
                    // add to store
                    var organisedEntry = this._organiseData(arguments[0], true);
                    if (organisedEntry) {
                        // if it's the first datapoint initialize the extremas with it
                        if (this._data.length === 0) {
                            this._min = this._max = organisedEntry.value;
                        }
                        this._coordinator.emit('renderpartial', {
                            min: this._min,
                            max: this._max,
                            data: [organisedEntry]
                        });
                    }
                }
                return this;
            },
            setData: function (data) {
                var dataPoints = data.data;
                var pointsLen = dataPoints.length;
                // reset data arrays
                this._data = [];
                this._radi = [];
                for (var i = 0; i < pointsLen; i++) {
                    this._organiseData(dataPoints[i], false);
                }
                this._max = data.max;
                this._min = data.min || 0;
                this._onExtremaChange();
                this._coordinator.emit('renderall', this._getInternalData());
                return this;
            },
            removeData: function () {
                // TODO: implement
            },
            setDataMax: function (max) {
                this._max = max;
                this._onExtremaChange();
                this._coordinator.emit('renderall', this._getInternalData());
                return this;
            },
            setDataMin: function (min) {
                this._min = min;
                this._onExtremaChange();
                this._coordinator.emit('renderall', this._getInternalData());
                return this;
            },
            setCoordinator: function (coordinator) {
                this._coordinator = coordinator;
            },
            _getInternalData: function () {
                return {
                    max: this._max,
                    min: this._min,
                    data: this._data,
                    radi: this._radi
                };
            },
            getData: function () {
                return this._unOrganizeData();
            }
            /*,

                  TODO: rethink.

                getValueAt: function(point) {

                  var value;

                  var radius = 100;

                  var x = point.x;

                  var y = point.y;

                  var data = this._data;

                  if (data[x] && data[x][y]) {

                    return data[x][y];

                  } else {

                    var values = [];

                    // radial search for datapoints based on default radius

                    for(var distance = 1; distance < radius; distance++) {

                      var neighbors = distance * 2 +1;

                      var startX = x - distance;

                      var startY = y - distance;

                      for(var i = 0; i < neighbors; i++) {

                        for (var o = 0; o < neighbors; o++) {

                          if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {

                            if (data[startY+i] && data[startY+i][startX+o]) {

                              values.push(data[startY+i][startX+o]);

                            }

                          } else {

                            continue;

                          }

                        }

                      }

                    }

                    if (values.length > 0) {

                      return Math.max.apply(Math, values);

                    }

                  }

                  return false;

                }*/
        };
        return Store;
    })();
    var Canvas2dRenderer = (function Canvas2dRendererClosure() {
        var _getColorPalette = function (config) {
            var gradientConfig = config.gradient || config.defaultGradient;
            var paletteCanvas = document.createElement('canvas');
            var paletteCtx = paletteCanvas.getContext('2d');
            paletteCanvas.width = 256;
            paletteCanvas.height = 1;
            var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
            for (var key in gradientConfig) {
                gradient.addColorStop(key, gradientConfig[key]);
            }
            paletteCtx.fillStyle = gradient;
            paletteCtx.fillRect(0, 0, 256, 1);
            return paletteCtx.getImageData(0, 0, 256, 1).data;
        };
        var _getPointTemplate = function (radius, blurFactor) {
            var tplCanvas = document.createElement('canvas');
            var tplCtx = tplCanvas.getContext('2d');
            var x = radius;
            var y = radius;
            tplCanvas.width = tplCanvas.height = radius * 2;
            if (blurFactor == 1) {
                tplCtx.beginPath();
                tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
                tplCtx.fillStyle = 'rgba(0,0,0,1)';
                tplCtx.fill();
            } else {
                var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);
                gradient.addColorStop(0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                tplCtx.fillStyle = gradient;
                tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
            }
            return tplCanvas;
        };
        var _prepareData = function (data) {
            var renderData = [];
            var min = data.min;
            var max = data.max;
            var radi = data.radi;
            var data = data.data;
            var xValues = Object.keys(data);
            var xValuesLen = xValues.length;
            while (xValuesLen--) {
                var xValue = xValues[xValuesLen];
                var yValues = Object.keys(data[xValue]);
                var yValuesLen = yValues.length;
                while (yValuesLen--) {
                    var yValue = yValues[yValuesLen];
                    var value = data[xValue][yValue];
                    var radius = radi[xValue][yValue];
                    renderData.push({
                        x: xValue,
                        y: yValue,
                        value: value,
                        radius: radius
                    });
                }
            }
            return {
                min: min,
                max: max,
                data: renderData
            };
        };

        function Canvas2dRenderer(config) {
            var container = config.container;
            var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
            var canvas = this.canvas = config.canvas || document.createElement('canvas');
            var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];
            var computed = getComputedStyle(config.container) || {};
            canvas.className = 'heatmap-canvas';
            this._width = canvas.width = shadowCanvas.width = config.width || +(computed.width.replace(/px/, ''));
            this._height = canvas.height = shadowCanvas.height = config.height || +(computed.height.replace(/px/, ''));
            this.shadowCtx = shadowCanvas.getContext('2d');
            this.ctx = canvas.getContext('2d');
            // @TODO:
            // conditional wrapper
            canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';
            container.style.position = 'relative';
            container.appendChild(canvas);
            this._palette = _getColorPalette(config);
            this._templates = {};
            this._setStyles(config);
        };
        Canvas2dRenderer.prototype = {
            renderPartial: function (data) {
                if (data.data.length > 0) {
                    this._drawAlpha(data);
                    this._colorize();
                }
            },
            renderAll: function (data) {
                // reset render boundaries
                this._clear();
                try {
                    // if (data.data.length > 0)
                    {
                        this._drawAlpha(_prepareData(data));
                        this._colorize();
                    }
                } catch (e) {
                }
            },
            _updateGradient: function (config) {
                this._palette = _getColorPalette(config);
            },
            updateConfig: function (config) {
                if (config['gradient']) {
                    this._updateGradient(config);
                }
                this._setStyles(config);
            },
            setDimensions: function (width, height) {
                this._width = width;
                this._height = height;
                this.canvas.width = this.shadowCanvas.width = width;
                this.canvas.height = this.shadowCanvas.height = height;
            },
            _clear: function () {
                this.shadowCtx.clearRect(0, 0, this._width, this._height);
                this.ctx.clearRect(0, 0, this._width, this._height);
            },
            _setStyles: function (config) {
                this._blur = (config.blur == 0) ? 0 : (config.blur || config.defaultBlur);
                if (config.backgroundColor) {
                    this.canvas.style.backgroundColor = config.backgroundColor;
                }
                this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width;
                this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height;
                this._opacity = (config.opacity || 0) * 255;
                this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
                this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
                this._useGradientOpacity = !!config.useGradientOpacity;
            },
            _drawAlpha: function (data) {
                var min = this._min = data.min;
                var max = this._max = data.max;
                var data = data.data || [];
                var dataLen = data.length;
                // on a point basis?
                var blur = 1 - this._blur;
                while (dataLen--) {
                    var point = data[dataLen];
                    var x = point.x;
                    var y = point.y;
                    var radius = point.radius;
                    // if value is bigger than max
                    // use max as value
                    var value = Math.min(point.value, max);
                    var rectX = x - radius;
                    var rectY = y - radius;
                    var shadowCtx = this.shadowCtx;
                    var tpl;
                    if (!this._templates[radius]) {
                        this._templates[radius] = tpl = _getPointTemplate(radius, blur);
                    } else {
                        tpl = this._templates[radius];
                    }
                    // value from minimum / value range
                    // => [0, 1]
                    var templateAlpha = (value - min) / (max - min);
                    // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
                    shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha;
                    shadowCtx.drawImage(tpl, rectX, rectY);
                    // update renderBoundaries
                    if (rectX < this._renderBoundaries[0]) {
                        this._renderBoundaries[0] = rectX;
                    }
                    if (rectY < this._renderBoundaries[1]) {
                        this._renderBoundaries[1] = rectY;
                    }
                    if (rectX + 2 * radius > this._renderBoundaries[2]) {
                        this._renderBoundaries[2] = rectX + 2 * radius;
                    }
                    if (rectY + 2 * radius > this._renderBoundaries[3]) {
                        this._renderBoundaries[3] = rectY + 2 * radius;
                    }
                }
            },
            _colorize: function () {
                var x = this._renderBoundaries[0];
                var y = this._renderBoundaries[1];
                var width = this._renderBoundaries[2] - x;
                var height = this._renderBoundaries[3] - y;
                var maxWidth = this._width;
                var maxHeight = this._height;
                var opacity = this._opacity;
                var maxOpacity = this._maxOpacity;
                var minOpacity = this._minOpacity;
                var useGradientOpacity = this._useGradientOpacity;
                if (x < 0) {
                    x = 0;
                }
                if (y < 0) {
                    y = 0;
                }
                if (x + width > maxWidth) {
                    width = maxWidth - x;
                }
                if (y + height > maxHeight) {
                    height = maxHeight - y;
                }
                var img = this.shadowCtx.getImageData(x, y, width, height);
                var imgData = img.data;
                var len = imgData.length;
                var palette = this._palette;
                for (var i = 3; i < len; i += 4) {
                    var alpha = imgData[i];
                    var offset = alpha * 4;
                    if (!offset) {
                        continue;
                    }
                    var finalAlpha;
                    if (opacity > 0) {
                        finalAlpha = opacity;
                    } else {
                        if (alpha < maxOpacity) {
                            if (alpha < minOpacity) {
                                finalAlpha = minOpacity;
                            } else {
                                finalAlpha = alpha;
                            }
                        } else {
                            finalAlpha = maxOpacity;
                        }
                    }
                    imgData[i - 3] = palette[offset];
                    imgData[i - 2] = palette[offset + 1];
                    imgData[i - 1] = palette[offset + 2];
                    imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;
                }
                img.data = imgData;
                this.ctx.putImageData(img, x, y);
                this._renderBoundaries = [1000, 1000, 0, 0];
            },
            getValueAt: function (point) {
                var value;
                var shadowCtx = this.shadowCtx;
                var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
                var data = img.data[3];
                var max = this._max;
                var min = this._min;
                value = (Math.abs(max - min) * (data / 255)) >> 0;
                return value;
            },
            getDataURL: function () {
                return this.canvas.toDataURL();
            }
        };
        return Canvas2dRenderer;
    })();
    var Renderer = (function RendererClosure() {
        var rendererFn = false;
        if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
            rendererFn = Canvas2dRenderer;
        }
        return rendererFn;
    })();
    var Util = {
        merge: function () {
            var merged = {};
            var argsLen = arguments.length;
            for (var i = 0; i < argsLen; i++) {
                var obj = arguments[i]
                for (var key in obj) {
                    merged[key] = obj[key];
                }
            }
            return merged;
        }
    };
    // Heatmap Constructor
    var Heatmap = (function HeatmapClosure() {
        var Coordinator = (function CoordinatorClosure() {
            function Coordinator() {
                this.cStore = {};
            };
            Coordinator.prototype = {
                on: function (evtName, callback, scope) {
                    var cStore = this.cStore;
                    if (!cStore[evtName]) {
                        cStore[evtName] = [];
                    }
                    cStore[evtName].push((function (data) {
                        return callback.call(scope, data);
                    }));
                },
                emit: function (evtName, data) {
                    var cStore = this.cStore;
                    if (cStore[evtName]) {
                        var len = cStore[evtName].length;
                        for (var i = 0; i < len; i++) {
                            var callback = cStore[evtName][i];
                            callback(data);
                        }
                    }
                }
            };
            return Coordinator;
        })();
        var _connect = function (scope) {
            var renderer = scope._renderer;
            var coordinator = scope._coordinator;
            var store = scope._store;
            coordinator.on('renderpartial', renderer.renderPartial, renderer);
            coordinator.on('renderall', renderer.renderAll, renderer);
            coordinator.on('extremachange', function (data) {
                scope._config.onExtremaChange &&
                scope._config.onExtremaChange({
                    min: data.min,
                    max: data.max,
                    gradient: scope._config['gradient'] || scope._config['defaultGradient']
                });
            });
            store.setCoordinator(coordinator);
        };

        function Heatmap() {
            var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
            this._coordinator = new Coordinator();
            if (config['plugin']) {
                var pluginToLoad = config['plugin'];
                if (!HeatmapConfig.plugins[pluginToLoad]) {
                    throw new Error('Plugin \'' + pluginToLoad + '\' not found. Maybe it was not registered.');
                } else {
                    var plugin = HeatmapConfig.plugins[pluginToLoad];
                    // set plugin renderer and store
                    this._renderer = new plugin.renderer(config);
                    this._store = new plugin.store(config);
                }
            } else {
                this._renderer = new Renderer(config);
                this._store = new Store(config);
            }
            _connect(this);
        };
        // @TODO:
        // add API documentation
        Heatmap.prototype = {
            addData: function () {
                this._store.addData.apply(this._store, arguments);
                return this;
            },
            removeData: function () {
                this._store.removeData && this._store.removeData.apply(this._store, arguments);
                return this;
            },
            setData: function () {
                this._store.setData.apply(this._store, arguments);
                return this;
            },
            setDataMax: function () {
                this._store.setDataMax.apply(this._store, arguments);
                return this;
            },
            setDataMin: function () {
                this._store.setDataMin.apply(this._store, arguments);
                return this;
            },
            configure: function (config) {
                this._config = Util.merge(this._config, config);
                this._renderer.updateConfig(this._config);
                this._coordinator.emit('renderall', this._store._getInternalData());
                return this;
            },
            repaint: function () {
                this._coordinator.emit('renderall', this._store._getInternalData());
                return this;
            },
            getData: function () {
                return this._store.getData();
            },
            getDataURL: function () {
                return this._renderer.getDataURL();
            },
            getValueAt: function (point) {
                if (this._store.getValueAt) {
                    return this._store.getValueAt(point);
                } else if (this._renderer.getValueAt) {
                    return this._renderer.getValueAt(point);
                } else {
                    return null;
                }
            }
        };
        return Heatmap;
    })();
    // core
    var heatmapFactory = {
        create: function (config) {
            return new Heatmap(config);
        },
        register: function (pluginKey, plugin) {
            HeatmapConfig.plugins[pluginKey] = plugin;
        }
    };
    return heatmapFactory;
});
var DynamicHeatMap = new function DynamicHeatMapInit() {
    /////////////////////////////////////
    var _GuiHeatMapHtml = '<style>  #heatmapContainerWrapper { width:100%; height:100%; position:absolute; left:0%; top:0%;  z-index:0;  pointer-events: none; } #heatmapContainer { width:100%; height:100% ;position:absolute; left:0%; top:0%;pointer-events: none; z-index:9999;} </style> <div id="heatmapContainerWrapper"> <div id="heatmapContainer"> </div>   </div>';
    //_GuiHeatMapHtml = ' <style> #heatmapContainer { width:100%; height:100% ;position:fixed; left:0%; top:0%;pointer-events: none; z-index:9999; } </style> <div id="heatmapContainer">   </div>';
    var HeatMapOpacityOptions = .1; //.6;//8;
    var HeatMapMaxValOptions = 15;
    var HeatSizeFOptions = 1;
    var HeatMapCanvas;
    var heatmap = null;

    function Initheatmap(hm) {
        heatmap = hm;
        Clearheatmap();
    }

    var ResetHeatMap = false;
    var _LastInitWidth = 0;

    function RemoveHeatMap() {
        try {
            if (heatmap != null) // remove old
            {
                var element = document.querySelector(".heatmap-canvas");
                if (typeof element !== 'undefined')
                    element.parentNode.removeChild(element);
                delete heatmap;
                heatmap = null;
            }
        } catch (rr) {
        }
    }

    var Radius = 50;

    function _Initheatmap(h = -1) {
        try {
            RemoveHeatMap();
            var element = document.getElementById("heatmapContainer");
            if (typeof element === 'undefined' || element == null) {
                document.body.insertAdjacentHTML('afterbegin', _GuiHeatMapHtml);
                // console.log(" _Initheatmap(0) insert heatmapContainer"  );
            }
            //setTimeout(function(){
            if (h == -1)
                document.getElementById('heatmapContainer').style.zIndex = "0";
            else
                document.getElementById('heatmapContainer').style.zIndex = "9999";
            //  document.getElementById('heatmapContainer').style.zIndex = "0";
            if (h > 0)
                document.body.style.height = h + 'px'; //'5000px';//'100%';// '5000px';
            // doc.documentElement;
            _LastInitWidth = getComputedStyle(document.body).width;
            var body = document.body,
                html = document.documentElement;
            var height = Math.max(body.scrollHeight, body.offsetHeight,
                html.clientHeight, html.scrollHeight, html.offsetHeight);
            if (h == 0) {
                //document.body.style.height="100%";
                //document.body.style.height=height+ 'px';;
            }
            var body = document.body;
            var bodyStyle = getComputedStyle(body);
            var hmEl = document.getElementById('heatmapContainerWrapper');
            hmEl.style.width = bodyStyle.width;
            // hmEl.style.height =h + 100 + 'px';
            // hmEl.style.height =h + 'px';
            hmEl.style.height = height + 'px';
            ;
            if (h < 0) {
                document.body.style.height = "100%";
                hmEl.style.height = "100%";
            }
            var hm = document.getElementById('heatmapContainer');
            var s = 80;
            var f = window.screen.width;
            if (window.screen.height < window.screen.width)
                f = window.screen.height;
            s = f * (80.0 / 1000.0) / window.devicePixelRatio;
            ;
            ;
            if (true) {
                var ww = window.innerWidth / 12; //10;//12.0;
                var hh = window.innerHeight / 12; //10;//12.0;
                s = ww;
                if (s > hh)
                    s = hh;
            }
            if (false) {
                var isMobile = window.orientation > -1;
                if (isMobile)
                    s = 40;
                if (true)
                    s = 70;
                if (true)
                    s /= window.devicePixelRatio;
                ;
            }
            s *= HeatSizeFOptions;
            if (s < 40)
                s = 40;
            // if(s <20)
            //s = 20;
            if (s > 200)
                s = 200;
            Radius = s;
            heatmap = h337.create({
                container: hm,
                maxOpacity: HeatMapOpacityOptions,
                radius: s
            });
            HeatMapCanvas = document.querySelector(".heatmap-canvas");
            Clearheatmap();
            // document.getElementById('heatmapContainerWrapper').style.display = 'none' ;
            //}, 5);// end time out
        } catch (ee) {
            console.log(" _Initheatmap(0) exeption");
        }
    }

    //-------------------------------------
    function ShowHeatMap(a) {
        if (a == true)
            document.getElementById('heatmapContainerWrapper').style.zIndex = 999999;
        else
            document.getElementById('heatmapContainerWrapper').style.zIndex = -1;
    }

    //-------------------------------------
    function Clearheatmap() {
        var data = {
            max: HeatMapMaxValOptions, // 15,//10,//5,//15,
            min: 0,
            data: []
        };
        if (heatmap != null)
            heatmap.setData(data);
    }

    //////////
    function onResizeWin() {
        if (_LastInitWidth != getComputedStyle(document.body).width)
            _Initheatmap(0);
    }

    if (true) {
        window.addEventListener('resize', onResizeWin);
        window.addEventListener("DOMContentLoaded", function () {
            ////init gui///
            document.body.insertAdjacentHTML('afterbegin', _GuiHeatMapHtml);
            _Initheatmap(0);
            //  ShowHeatMap(true);
            // RefreshPlotHeatMap();
        });
    }

    function _adddata(_x, _y, v) {
        heatmap.addData({
            x: _x,
            y: _y,
            value: v
        });
    }

    //--------------------------
    var delayCheckCount = 30;

    function CheckInitializedHeatMap() {
        delayCheckCount++;
        if (delayCheckCount < 100)
            return;
        delayCheckCount = 0;
        try {
            if (document.getElementById('heatmapContainer') == null) {
                document.body.insertAdjacentHTML('afterbegin', _GuiHeatMapHtml);
                _Initheatmap(0);
            }
            if (true) //check size
            {
                var body = document.body;
                if (true) {
                    var hmEl = document.getElementById('heatmapContainerWrapper');
                    if (hmEl.clientWidth < body.clientWidth || hmEl.clientHeight < body.clientHeight)
                        _Initheatmap(0);
                    else
                        return;
                }
                html = document.documentElement;
                var hmEl = document.getElementById('heatmapContainerWrapper');
                var height = Math.max(body.scrollHeight, body.offsetHeight,
                    html.clientHeight, html.scrollHeight, html.offsetHeight);
                var bodyStyle = getComputedStyle(body);
                var width = bodyStyle.width;
                //  var width = Math.max( body.scrollWidth, body.offsetWidth,
                // html.clientWidth, html.scrollWidth, html.offsetWidth );
                var ww = width; //+ 'px';;
                var hh = height + 'px';
                ;
                //  if( hmEl.style.height != hh || hmEl.style.width != ww )
                if (hmEl.style.width != ww) {
                    console.log("reinit heat map size");
                    _Initheatmap(0);
                }
            }
        } catch (e) {
        }
    }

    //--------------------------
    function _adddatawin_(data) {
        CheckInitializedHeatMap();
        if (heatmap != null) {
            heatmap.setData(data);
        }
    }

    //--------------------------
    function _adddata_(_x, _y, v) {
        CheckInitializedHeatMap();
        //document.getElementById('heatmapContainer').style.zIndex = "999999";
        //  document.getElementById('heatmapContainerWrapper').style.zIndex = "999999";
        if (heatmap != null) {
            // AddHeatMapDataWin(_x,_y, v);
            // if(false)
            heatmap.addData({
                x: _x,
                y: _y,
                value: v
            });
        }
    }

    //----------------------------
    // let GazeResultEvents = [];
    let HteatMapData = [];
    var DelayRefreshWin = 0;

    function AddHeatMapDataWin(_x, _y, v, t = 0, win = 0) {
        //heatmap.addData({	x: _x,y: _y,value: v });
        //return;
        HteatMapData.push({
            x: _x,
            y: _y,
            value: v
        });
        //if( DelayRefreshWin > 5)
        if (true) {
            DelayRefreshWin = 0
            var currentData = heatmap.getData();
            currentData.data.push({
                x: _x,
                y: _y,
                value: v
            });
            var l = HteatMapData.length;
            var cc = l - 30;
            if (cc < 0)
                cc = 0;
            // var dd = HteatMapData.slice(cc,l);
            // currentData.data =dd;
            HteatMapData = HteatMapData.slice(cc, l);
            currentData.data = HteatMapData;
            heatmap.setData(currentData); // now both heatmap instances have the same content
        } else
            heatmap.addData({
                x: _x,
                y: _y,
                value: v
            });
        DelayRefreshWin++;
    }

    //------------------------------------------
    function _AddHeatMapDataWin(_x, _y, v, win = 0, refresh = false) {
        DelayRefreshWin++;
        if (DelayRefreshWin > 5)
            refresh = true;
        CheckInitializedHeatMap();
        HteatMapData.push({
            x: _x,
            y: _y,
            value: v
        });
        if (heatmap != null) {
            if (refresh) {
                var l = HteatMapData.length;
                var cc = l - 30;
                if (cc < 0)
                    cc = 0;
                HteatMapData = HteatMapData.slice(cc, l);
                currentData.data = HteatMapData;
                heatmap.setData(currentData);
            } else {
                heatmap.push({
                    x: _x,
                    y: _y,
                    value: v
                });
            }
        }
    }

    //  CheckInitializedHeatMap();
    //--------------------
    var AvrGazeFix = 30;

    function GazeFix(i) {
        /////gazespeed/////
        var x = 0;
        var y = 0;
        if (vData.length < 2)
            return 0;
        var x = vData[i].x - vData[i - 1].x;
        var y = vData[i].y - vData[i - 1].y;
        var d = Math.sqrt(x * x + y * y);
        return d;
        ////////
    }

    //--------------------
    //////////////////////////////
    var vData = [];
    this.add = function (x, y, t, s) {
        var gaze = {
            'x': x,
            'y': y,
            't': t,
            'state': s
        };
        if (s != 0)
            return;
        vData.push(gaze);
        var d = GazeFix(vData.length - 1);
        if (d < 5) d = 5;
        AvrGazeFix = .99 * AvrGazeFix + .01 * d;
        var fix = d / AvrGazeFix;
        var g = .05;
        fix = (d / (6 * AvrGazeFix));
        //fix = ( d/(3*AvrGazeFix));
        if (fix > .7) fix = .7;
        if (fix < .1) fix = 0;
        fix = 1.0 - fix;
        //if(fix != 1)
        // console.log('fix: ' + fix) ;
        vData[vData.length - 1].fix = fix;
    }
    ///////////////loop//////////
    var minTDif = 100;
    var LastSize = 0;
    var LastRefresh = Date.now();


    var LastDataC = 0;

    function RefreshPlotHeatMap() {
        if (bEnd)
            return;
        try {
            if (bPause) {
                setTimeout(function () {
                    window.requestAnimationFrame(RefreshPlotHeatMap);
                }, 200);
                return;
            }
            var wint = 500; //800;//500;//500;//1500;// 500;
            var t1;
            var t2;
            var currentData = [];
            var c = 0;
            var curtime = Date.now();


            var minT = 15;//15
            if (curtime - LastRefresh < minT) {
                setTimeout(function () {
                    window.requestAnimationFrame(RefreshPlotHeatMap);
                }, 3);
                //  }, 30);

                return;
            }
            LastRefresh = Date.now();
            curtime -= 30; //45;//45;//50;// 100;//tmp;

            {
                for (i = vData.length - 1; i > 0; i--) {


                    if (vData[i].t > curtime)
                        continue;
                    var dif = curtime - vData[i].t;

                    if (dif > wint + 500)
                        break;


                    var tnext = curtime;
                    var tnow = vData[i].t;
                    if (i < vData.length - 1)
                        tnext = vData[i + 1].t;
                    // if(false)
                    {
                        if (dif > wint) {
                            tnow = curtime - wint;
                        }
                        if (tnext > curtime)
                            tnext = curtime;
                        if (tnow > curtime)
                            tnow = curtime;
                    }
                    var timedif = tnext - tnow;
                    var radius = Radius;
                    var v = timedif / 33;
                    if (v > 2) v = 2;
                    if (v < 0) v = 0;


                    if (v > 0)
                        currentData.push({
                            x: vData[i].x,
                            y: vData[i].y,
                            value: v
                        });

                    if (dif > wint) break;

                }

                var bRefresh = true;

                if (currentData.length == 0 && LastDataC == 0)
                    bRefresh = false;

                LastDataC = currentData.length;

                if (bRefresh) {
                    var ddata = {
                        //max: 15,
                        max: 5,
                        data: currentData
                    };
                    heatmap.setData(ddata);
                }

                LastSize = vData.length;


            }
            // LastRefresh= Date.now();
            setTimeout(function () {
                window.requestAnimationFrame(RefreshPlotHeatMap);
                //  }, 10);
            }, 30);


        } catch (eee) {
            setTimeout(function () {
                window.requestAnimationFrame(RefreshPlotHeatMap);
            }, 30);
        }
    }

    ///////////////////////////////
    this.Show = function (Opacity = .3) {
        HeatMapOpacityOptions = Opacity;
        ShowHeatMap(true);
        RefreshPlotHeatMap();
    }
    var bEnd = false;
    this.End = function () {
        Clearheatmap();
        bEnd = true;
    }
    this.Clear = function () {
        Clearheatmap();
    }
    var bPause = false;
    this.Pause = function () {
        bPause = true;
        Clearheatmap();
    }
    this.Resume = function () {
        bPause = false;
    }
    ///////////////////////////////
}