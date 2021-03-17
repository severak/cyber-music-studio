// base javascript library

// protects programmer from javascript insanity, browser inconsitences and typing long strings

// (c) Severák 2019-20
// WTFPL licensed
// because javascript is one big WTF

// kudos to lua team for inspiration
// and http://bonsaiden.github.io/JavaScript-Garden/ for wonderful docs on insanities of JS

var ub = {}

// guess type of x
ub.type = function(v) {
	return Object.prototype.toString.call(v).slice(8, -1);
}

// issues error when v is false-y
ub.assert = function(v, message) {
	if (!message) message = 'assertion failed';
	if (!v) {
		throw message;
	}
}

// shorthand to throwing exceptions
ub.error = function(message) {
	throw message;
}

// iterates over array calling fun(i, v)
ub.ipairs = function(arr, fun) {
	for (var i = 0; i < arr.length; i++) {
		fun(i, arr[v]);
	} 
}

// iterates over object calling fun(k, v)
ub.pairs = function pairs(obj, fun) {
	for(var k in obj) {
		if (obj.hasOwnProperty(k)) {
			fun(k,v);
		}
	}
}

function tostring(v) {
	// TODO
}

ub.tonumber = function tonumber(v, base) {
	if (!base) base = 10;
	return parseFloat(v, base);
}


// and now some DOM stuff

// kudos to https://plainjs.com/

ub.gebi = function(id) {
		return document.getElementById(id);
}

function makeElem(tag, attr, text) {
		// TODO
}


var addEvent = function(el, type, handler) {
	if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
};

// matches polyfill
	this.Element && function(ElementPrototype) {
	    ElementPrototype.matches = ElementPrototype.matches ||
	    ElementPrototype.matchesSelector ||
	    ElementPrototype.webkitMatchesSelector ||
	    ElementPrototype.msMatchesSelector ||
	    function(selector) {
	        var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
	        while (nodes[++i] && nodes[i] != node);
	        return !!nodes[i];
	    }
}(Element.prototype);


ub.on = function(elem, eventName, fun, fun2) {
	ub.assert(arguments.length>2, 'Wrong number of arguments to function on.');
	if (ub.type(elem)=='String') elem = ub.gebi(elem);
	if (arguments.length==4) {
		var selector = fun;
		var context = elem;
		addEvent(context || document, eventName, function(e) {
			var found, el = e.target || e.srcElement;
	        while (el && el.matches && el !== context && !(found = el.matches(selector))) el = el.parentElement;
	        if (found) fun2.call(el, e);
	    });
	} else {
		addEvent(elem, eventName, fun);
	}
}
// sub variant with on(elem, eventName, subselector, fun)

ub.stop = function(ev) {
	ev.preventDefault()
	ev.stopPropagation();
}

ub.hasClass = function(elem, className) {
	if (ub.type(elem)=='String') elem = ub.gebi(elem);
	return elem.classList ? elem.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(elem.className);
}

ub.addClass = function(elem, className) {
	if (ub.type(elem)=='String') elem = ub.gebi(elem);
	if (elem.classList) elem.classList.add(className);
	else if (!ub.hasClass(elem, className)) elem.className += ' ' + className;
}

ub.delClass = function(elem, className) {
	if (ub.type(elem)=='String') elem = ub.gebi(elem);
	if (elem.classList) elem.classList.remove(className);
	else elem.className = elem.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
}

// jQuery-like DOM ready
ub.whenReady = function(fun) {
		// in case the document is already rendered
	if (document.readyState!='loading') fun();
	// modern browsers
	else if (document.addEventListener) document.addEventListener('DOMContentLoaded', fun);
	// IE <= 8
	else document.attachEvent('onreadystatechange', function(){
	    if (document.readyState=='complete') fun();
	});
}

window.ub = ub;

if (!window.console || !window.console.log) {
	// don't crash on console.log
	window.console.log = function() {};
}

