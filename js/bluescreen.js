// Windows 98 like bluescreen
window.onerror = function(message, source, lineno, colno, error) {
    var pre = document.createElement('pre');
    pre.innerText = source + ':' + lineno  + ':\n' + message;
    pre.style.fontFamily = 'monospace';
    pre.style.backgroundColor = 'blue';
    pre.style.color = 'white';
    pre.style.position = 'fixed';
    pre.style.top = 0;
    pre.style.left = 0;

    var bluescreen = function () {
        document.body.appendChild(pre);
    };

    if (document.readyState!='loading') bluescreen();
    // modern browsers
    else if (document.addEventListener) document.addEventListener('DOMContentLoaded', bluescreen);
    // IE <= 8
    else document.attachEvent('onreadystatechange', function(){
        if (document.readyState=='complete') bluescreen();
    });
};