// Windows 98 like bluescreen
window.onerror = function(message, source, lineno, colno, error) {
    var errorMsg = '';
    if (error && error.stack) {
        errorMsg = error.stack
    } else {
        if (source && lineno) {
            errorMsg = source + ':' + lineno  + ':\n';
        }
        errorMsg = errorMsg + message;
    }
    var pre = document.createElement('pre');
    pre.innerText =  errorMsg;
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
