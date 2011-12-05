

GUI = {
    init: function(callback)    {
        document.addEventListener( 'touchcancel', GUI.sendEvents['cancel'], false);
        document.addEventListener( 'touchstart', GUI.sendEvents['start'], false);
        document.addEventListener( 'touchmove', GUI.sendEvents['move'], false);
        document.addEventListener( 'touchend', GUI.sendEvents['end'], false);
        if (typeof(callback) == "function") callback();
    },
	isSingleTap: 0,
	decideTap: function() {
		console.log(GUI.isSingleTap)
		console.log(GUI.lastPosition.x)
		console.log(GUI.lastPosition.y);
		if (GUI.isSingleTap) Physico.GL.getPixels(GUI.lastPosition)
	},
	lastPosition: {
		"x": 0,
		"y": 0
	},
    sendEvents: {
        "start": function(e) {
            GUI.accel = [0, 0, 0];
            GUI.dragPosition = GUI.getCoords(e);
            GUI.lastPosition = GUI.dragPosition
            if (e.touches && e.touches.length > 2)  GUI.sendEvent("startTouch", "");   
            GUI.isSingleTap = true
            setTimeout("GUI.decideTap()", 100);
            e.preventDefault();
        },
        "cancel": function(e) {  
            GUI.sendEvents['end'];
            e.preventDefault();
        },
        "move": function(e) {
            c = GUI.getCoords(e);
	    GUI.isSingleTap = false;
            if (e.touches.length == 1)  {
                var x = (c.x - GUI.dragPosition.x) / 400, y = (c.y - GUI.dragPosition.y) / 400;
                GUI.accel[0] = x - (x * 0.15 + GUI.accel[0] * (1.0 - 0.15));
                GUI.accel[1] = y - (y * 0.15 + GUI.accel[1] * (1.0 - 0.15));
                Physico.scene[0] += GUI.accel[0];
                Physico.scene[1] -= GUI.accel[1];
            }   else    {
                var z = ((c.x - GUI.dragPosition.x) + (c.y - GUI.dragPosition.y)) / 200;
                GUI.accel[2] = z - (z * 0.15 + GUI.accel[2] * (1.0 - 0.15));
                Physico.scene[2] += GUI.accel[2]
            }
            e.preventDefault();
        },
        "end": function(e) {
            GUI.finishTransition();
            GUI.dragPosition = null;
            GUI.sendEvent("endTouch", "");  
            e.preventDefault();
        },
    },
    finishTransition: function()    {
        GUI.accel[0] -= GUI.accel[0] * 0.15;
        GUI.accel[1] -= GUI.accel[1] * 0.15;
        GUI.accel[2] -= GUI.accel[2] * 0.15;
        if (GUI.accel[0] != 0 || GUI.accel[1] != 0 || GUI.accel[2] != 0)  {  
            Physico.scene[0] += GUI.accel[0]
            Physico.scene[1] -= GUI.accel[1]
            Physico.scene[2] += GUI.accel[2]
            setTimeout("GUI.finishTransition()", 10);
        }   else    {
            GUI.accel = [0, 0, 0];
        }
    },
    sendEvent: function(event, data)  {    
        var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", "call:triggerEvent:"+event+":"+data);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    },
    getCoords: function(e)  {
        var coords;
            if (e.touches.length > 1)  {  
                coords = { x: 0, y: 0 };
                coords.x = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
                coords.y = Math.abs(e.touches[0].clientY - e.touches[1].clientY);
            } else {
                coords = {x:0, y:0};
                coords.x = e.touches[0].clientX;
                coords.y = e.touches[0].clientY;
            }
        return coords;
    },
    dragPosition: null,
    accel: [0, 0, 0],
    acccelSign: [0, 0, 0]
}
