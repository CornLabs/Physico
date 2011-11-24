

GUI = {
    init: function(callback)    {
        console.log('init');
        document.addEventListener( 'touchcancel', GUI.sendEvents['cancel'], false);
        document.addEventListener( 'touchstart', GUI.sendEvents['start'], false);
        document.addEventListener( 'touchmove', GUI.sendEvents['move'], false);
        document.addEventListener( 'touchend', GUI.sendEvents['end'], false);
        console.log(typeof(callback))
        if (typeof(callback) == "function") callback();
    },
    sendEvents: {
        "start": function(e) {
        GUI.sendEvent("startTouch", "");        
        },
        "cancel": function(e) {
        },
        "move": function(e) {
        e.preventDefault();
        },
        "end": function(e) {
        GUI.sendEvent("endTouch", "");
        },
    },
    sendEvent: function(event, data)  {    
        var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", "call:triggerEvent:"+event+":"+data);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    }
}