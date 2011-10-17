if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}


Physico = {
    init: function () {
        this.ObjectList.addObject();

        Physico.Animator.AnimationTimer = new Physico.Timer();
        Physico.Animator.AnimationTimer.animate = function () {
            for (obj in Physico.ObjectList.objects) Physico.ObjectList.objects[obj].applicator.appForces(obj);
        }
        Physico.Animator.AnimationTimer.startTimer(Physico.Animator.AnimationTimer.animate);

        return this;
    },
    globalFreeze: function(timer)    {
        this.globalTimerStop = 1
        this.globalTimerException = timer;
    },
    globalUnFreeze: function()  {
        this.globalTimerStop = 0
        this.globalTimerException = -1
    },
    timers: [],
    timerc: 0,
    globalTimerStop: 0,
    globalTimerException: -1,
}
Physico.Animator = {

}

Physico.Timer = function () {

    this.timerid = Physico.timerc
    Physico.timers[Physico.timerc] = this
    Physico.timerc++;

    this.timer = null
    this.working = 0
    this.startTimer = function () {
        this.working = 1; var args = []; Array.prototype.push.apply(args, arguments);
        func = args.shift();
        args = JSON.stringify(args); 
        Physico.timers[this.timerid].repeat(func, args);
    }.bind(this)
    this.repeat = function (func, args) {
        if (!this.working) return; argv = JSON.parse(args);
        if (!Physico.globalTimerStop ||this.timerid == Physico.globalTimerException)   func(argv);
        this.timer = setTimeout("Physico.timers[" + this.timerid + "].repeat(" + func + ", '" + args + "')", 1);
    }.bind(this)
    this.stopTimer = function () {
        this.working = 0;
        clearTimeout(this.timer);
        this.timer = null
    }.bind(this)
}


Physico.dragTimer = function (){ };
Physico.dragTimer.prototype = new Physico.Timer;
Physico.dragTimer.prototype.dragging = 0
Physico.dragTimer.prototype.dragDistance = 0
Physico.dragTimer.prototype.dragTime = 0
Physico.dragTimer.prototype.acDD = 0
Physico.dragTimer.prototype.drag = function () {
    this.dragTime++;
}

Physico.ObjectList = {
    objects: [],
    head: 0,
    addObject: function () {
        this.objects[this.head] = new Physico.Object(this.head);
        this.head++;
    },
    removeObject: function()	{
	this.objects[0].terminate();
	this.objects.splice(0, 1);
	this.head--;
    },
    scrambleObjects: function(){
	for(o in this.objects) this.objects[o].scramble();
    }, 
    colors: [
	"rgba(0, 0, 0, 0.7)",
	"rgba(256, 0, 0, 0.7)",
	"rgba(0, 256, 0, 0.7)",
	"rgba(0, 0, 256, 0.7)", 
	"rgba(150, 0, 150, 0.7)",
	"rgba(256, 0, 256, 0.7)",
	"rgba(256, 150, 0, 0.7)",
	"rgba(200, 200, 200, 0.6)"
	    ],
}

Physico.Animator.Force = function(ix, iy, r, rx, ry, rlx, rly){
    this.isRed = r ? 1 : 0; 
    this.resolveInput = function(i)	{
	    return typeof(i) == "number" ? i : i[0] + (Math.random() * (i[1] - i[0]));
    }
    ix = this.resolveInput(ix);
    iy = this.resolveInput(iy);
    rx = this.resolveInput(rx);
    ry = this.resolveInput(ry);
    rlx = this.resolveInput(rlx);
    rly = this.resolveInput(rly);
    

    this.x = ix; this.ix = ix; this.rx = rx ? rx : 0; this.sx = this.x >= 0 ? 1 : 0; this.rsx = this.rx >= 0 ? 1 : 0; this.rlx = rlx ? rlx : 0;
    this.y = iy; this.iy = iy; this.ry = ry ? ry : 0; this.sy = this.y >= 0 ? 1 : 0; this.rsy = this.ry >= 0 ? 1 : 0; this.rly = rly ? rly : 0;
    this.act = function (object) {

        if (this.x >= 0 && this.sx || this.x < 0 && !this.sx) {
            if (object.x <= window.innerWidth - 30) object.x += this.x;
            if (this.isRed && (this.rsx && this.x > this.rlx || !this.rsx && this.x < this.rlx)) this.x -= rx;
            if (object.x > window.innerWidth - 30) this.x = this.ix;
        }
        if (this.y >= 0 && this.sy || this.y < 0 && !this.sy) {
            if (object.y <= window.innerHeight - 30) object.y += this.y;  
            if (this.isRed && (this.rsy && this.y > this.rly || !this.rsy && this.y < this.rly)) this.y -= ry;
            if (object.y > window.innerHeight - 30) this.y = this.iy;
        }
    }.bind(this)

    this.reset = function()	{
	this.x = this.ix;
	this.y = this.iy;
    }.bind(this)

}

Physico.Animator.Applicator = function(object) {
    this.attObj = object;
    this.forces = [], this.fc = 0
    this.attForce = function (ix, iy, r, name, rx, ry, rlx, rly) {
		this.forces[this.fc] = []; this.forces[this.fc]["name"] = name;
		this.forces[this.fc]["force"] = new Physico.Animator.Force(ix, iy, r, rx, ry, rlx, rly);
		this.attObj.elem.find(".info > .content#forces").append("<li id='"+name+"'><strong>"+name+"</strong><br>From : ("+this.forces[this.fc]["force"].ix+", "+this.forces[this.fc]["force"].iy+") to ("+this.forces[this.fc]["force"].rlx+", "+this.forces[this.fc]["force"].rly+")</li>");
		this.fc++;
    }.bind(this)
    this.remForce = function (name) {
        for (i = 0; i <= this.fc; i++)
            if (this.forces[i]["name"] == name) {
                this.forces.splice(i, 1);
                this.fc--;
        }
	console.log(this.forces);
	this.attObj.elem.find(".info > .content#forces #" +name).remove();
    }.bind(this)
    this.appForces = function (args) {
	for(force in this.forces)	{
		this.forces[force]["force"].act(this.attObj);
		this.attObj.move(this.x, this.y);
	}
    }.bind(this);
    this.resetForces = function()	{
	for(force in this.forces) this.forces[force].force.reset(); 
    }.bind(this)
    this.hasForce = function(name)	{
	for(f in this.forces) { console.log(this.forces[f]["name"]); if (this.forces[f]["name"] == name) return true;}
	return false;
    }
    this.checkEnvForces = function()	{
	for(force in Physico.Animator.envForcesActive) if (Physico.Animator.envForcesActive[force]) this.attForce(
					Physico.Animator.EnvForces[force].x, 
					Physico.Animator.EnvForces[force].y, 
					Physico.Animator.EnvForces[force].r, 
					force, 
					Physico.Animator.EnvForces[force].rx, 
					Physico.Animator.EnvForces[force].ry, 
					Physico.Animator.EnvForces[force].rlx, 
					Physico.Animator.EnvForces[force].rly);
    }
}

Physico.Animator.EnvForces = {
    "gravity": {
        "x": 0,
        "y": 0,
        "r": 1,
        "rx": 0,
        "ry": -0.1,
        "rly": 9.8, 
	"rlx": 0
    },
    "wind": {
        "x": 0,
        "y": 0,
        "r": 1,
        "rx": [-0.1, -0.5],
        "ry": 0,
        "rlx": [3, 15],
        "rly": 0
    },
}

Physico.Animator.envForcesActive = [];
Physico.Animator.ToggleEnvForce = function (force) {
	if (Physico.Animator.envForcesActive[force])	{
		Physico.Animator.envForcesActive[force] = 0;
		for(obj in Physico.ObjectList.objects) Physico.ObjectList.objects[obj].applicator.remForce(force);
	}	else {
		Physico.Animator.envForcesActive[force] = 1;
		for (obj in Physico.ObjectList.objects) 
			if (!Physico.ObjectList.objects[obj].applicator.hasForce(force))
			Physico.ObjectList.objects[obj].applicator.attForce(
					Physico.Animator.EnvForces[force].x, 
					Physico.Animator.EnvForces[force].y, 
					Physico.Animator.EnvForces[force].r, 
					force, 
					Physico.Animator.EnvForces[force].rx, 
					Physico.Animator.EnvForces[force].ry, 
					Physico.Animator.EnvForces[force].rlx, 
					Physico.Animator.EnvForces[force].rly);
	}
}

Physico.Object = function(number) {
    
    this.id = number;
    jQuery("body").append("<div class='ball' id='object-" + this.id + "'><div class='info'><h1>Forces</h1><ul class='content' id='forces'></ul><h1>Data</h1><ul class='content' id='data'></ul></div></div>");
    this.elem = jQuery("#object-" + this.id);
    this.elem.css("border-color", Physico.ObjectList.colors[Math.round(Math.random() * Physico.ObjectList.colors.length)]);
    
    this.scramble = function()	{
	this.x = Math.round(70 + Math.random() * (window.innerWidth - 100));
	this.y = Math.round(70 + Math.random() * (window.innerHeight - 100));
	this.elem.css("top", this.y).css("left", this.x);
    }.bind(this)

    this.scramble(); 
    this.ix = this.x; this.px = [25, 25, 25, 25, 25];
    this.iy = this.y; this.py = [25, 25, 25, 25, 25];
	
    this.attachedTimer = null;

    this.move = function (x, y) {
        if (this.x >= window.innerWidth - 30) this.x = window.innerWidth - 30;
        if (this.y >= window.innerHeight - 30) this.y = window.innerHeight - 30;
       	if (this.y >= window.innerHeight - 30 || this.x >= window.innerWidth - 30) this.applicator.resetForces();
       	this.ix = this.x; this.iy = this.y;
        this.elem.css("left", this.x + "px");
        this.elem.css("top", this.y + "px");
    }.bind(this)

    this.elem.draggable({
        start: function (event, ui) {
            this.attachedTimer = new Physico.dragTimer(); Physico.globalFreeze(this.attachedTimer.timerid);
            this.attachedTimer.startTimer(this.attachedTimer.drag);
        }.bind(this),
        drag: function (event, ui) {
            this.attachedTimer.dragDistance++;
            this.x = parseInt(this.elem.css("left"));
            this.y = parseInt(this.elem.css("top"));
            if (this.attachedTimer.dragDistance > 4) {
                this.px[4] = this.px[3];
                this.py[4] = this.py[3];
            }
            if (this.attachedTimer.dragDistance > 3) {
                this.px[3] = this.px[2];
                this.py[3] = this.py[2];
            }
            if (this.attachedTimer.dragDistance > 2) {
                this.px[2] = this.px[1];
                this.py[2] = this.py[1];
            }
            if (this.attachedTimer.dragDistance > 1) {
                this.px[1] = this.px[0];
                this.py[1] = this.py[0];
                this.attachedTimer.acDD = this.attachedTimer.acDD + Math.sqrt(Math.pow(this.px[0] - this.x, 2) + Math.pow(this.py[0] - this.y, 2));
            }
            if (this.attachedTimer.dragDistance > 0) {
                this.px[0] = this.x;
                this.py[0] = this.y;
            }
        }.bind(this),
        stop: function (event, ui) {
            this.attachedTimer.stopTimer(); Physico.globalUnFreeze();
            var speed = this.attachedTimer.acDD / this.attachedTimer.dragTime / 100;
            var ox = this.px[4] - this.x;
            var oy = this.py[4] - this.y;
            console.log("");
            this.attachedTimer = null;
            this.ix = this.x;
            this.iy = this.y;
	    this.applicator.resetForces();
        }.bind(this)
    });

        this.applicator = new Physico.Animator.Applicator(this);
	this.applicator.checkEnvForces();
	this.terminate = function()	{
		this.elem.remove();

		this.aplicator = null;
		this.attachedTimer = null;
	}
};

/*
(function () {
    "use strict";

    function init() {
        jQuery("body").prepend("<h1>Starting App</h1>");
        WinJS.UI.processAll();
        Physico.init();
        WinJS.Application.start();
    }

    document.addEventListener("DOMContentLoaded", init, false);
})(); */

jQuery(document).ready(function(){
	jQuery("body h1.title").text("Starting App");
	Physico.init();
	jQuery("body h1.title").text("Physico Engine - Loaded");
	jQuery(".c").draggable();
	jQuery(".help").find(".lang").click(function()	{
		elem = jQuery(this); 
		jQuery(".help.c > #cont").load("/help."+elem.attr("id")+".html");
	});
	jQuery(".help.c .lang#en").click();
});
