var twitch_vid       = null;
var twitch_video_ref = null;
var twitch_ctrl_bar  = null;

var zoomer_on = false;
var zoomer_x = 0;
var zoomer_y = 0;

var zoomer_index = 0;
var zoomer_factors = [ 100,110,125,150,175,200,250,300,400,500,800,1200,2000 ];

var PanAdjustCalc = (percentX, percentY, zoomDirection) => {
    var scale_diff = zoomer_factors[zoomer_index] - zoomer_factors[zoomer_index+zoomDirection];
    var offset_factorX = (zoomer_x + percentX) / zoomer_factors[zoomer_index+zoomDirection];
    var offset_factorY = (zoomer_y + percentY) / zoomer_factors[zoomer_index+zoomDirection];
    zoomer_x += (scale_diff * offset_factorX);
    zoomer_y += (scale_diff * offset_factorY);
}

var ZoomIn = () => {
    if (zoomer_index == zoomer_factors.length-1) return;
    zoomer_index++;
    ZoomIt();
    PanAdjustCalc(50, 50, -1);
    PanIt();
}

var ZoomOut = () => {
    if (zoomer_index == 0) return;
    zoomer_index--;
    ZoomIt();
    PanAdjustCalc(50, 50, 1);
    PanIt();
}

var ToggleZoomer = () => {
    zoomer_on = !zoomer_on;
    if (zoomer_on) {
        gui_overlay.style.display = "block";
        gui_button.style.backgroundColor = "var(--color-background-button-icon-overlay-hover)";
    } else {
        gui_overlay.style.display = "none";
        gui_button.style.backgroundColor = "transparent";
    }
}

var ResetZoomer = () => {
    if (zoomer_index > 0) {
        zoomer_index = zoomer_x = zoomer_y = 0;
        ZoomIt();
        PanIt();
    }
    if (zoomer_on) ToggleZoomer();
}

var PanIt = () => {
    /* Clamp */
    zoomer_x = (zoomer_x < 0)? 0: zoomer_x;
    zoomer_y = (zoomer_y < 0)? 0: zoomer_y;
    zoomer_x = Math.min(zoomer_x, zoomer_factors[zoomer_index]-100);
    zoomer_y = Math.min(zoomer_y, zoomer_factors[zoomer_index]-100);
    twitch_vid.style.left = - zoomer_x + "%";
    twitch_vid.style.top  = - zoomer_y + "%";
}

var ZoomIt = () => {
    var scale = zoomer_factors[zoomer_index];
    gui_button.innerText = scale + "%";
    twitch_vid.style.height = scale + "%";
    twitch_vid.style.width  = scale + "%";
}

/*************************************
 *      GUI
**************************************/

var gui_overlay = document.createElement('div');
gui_overlay.style.cursor   = "zoom-in";
gui_overlay.style.position = "absolute";
gui_overlay.style.zIndex   = "var(--z-index-above)";
gui_overlay.style.border   = "2px dashed white";
gui_overlay.style.opacity  = "40%";
gui_overlay.style.display  = "none";
gui_overlay.style.width    = "98%";
gui_overlay.style.height   = "90%";
gui_overlay.style.margin   = "1%";

var gui_button_div = document.createElement('div');
var gui_button     = document.createElement('button');
gui_button.style.color = "white";
gui_button.style.lineHeight  = "var(--button-size-default)";
gui_button.innerText = '100%';
gui_button.addEventListener("click", ToggleZoomer);
gui_button.addEventListener("dblclick", ResetZoomer);
gui_button_div.appendChild(gui_button);

/*************************************
 *      Events
**************************************/

// Hacked Updates
setInterval(() => {
    if (!twitch_vid || !twitch_vid.getAttribute("data-zoomer-attached")) {
        twitch_vid = document.getElementsByTagName('video')[0];
        twitch_vid.setAttribute("data-zoomer-attached", true);
    }
    if (!twitch_video_ref || !twitch_video_ref.getAttribute("data-zoomer-attached")) {
        twitch_video_ref = document.querySelectorAll(".video-ref")[0];
        twitch_video_ref.setAttribute("data-zoomer-attached", true);
        twitch_video_ref.append(gui_overlay);
    }
    if (!twitch_ctrl_bar || !twitch_ctrl_bar.getAttribute("data-zoomer-attached")) {
        twitch_ctrl_bar = document.querySelectorAll(".player-controls__right-control-group")[0];
        twitch_ctrl_bar.setAttribute("data-zoomer-attached", true);
        twitch_ctrl_bar.prepend(gui_button_div);
    }
}, 5000);

var drag = false;
var drag_check = false;
var drag_threshold = 10;
var drag_scaleX = 1;
var drag_scaleY = 1;

gui_overlay.addEventListener("mousedown", (e) => {
    if (zoomer_on && e.button == 0) {
        var bbox = twitch_video_ref.getBoundingClientRect();
        drag_scaleX = (bbox.width / 100); drag_scaleY = (bbox.height / 100);
        drag = [ 
            zoomer_x + (e.pageX / drag_scaleX),
            zoomer_y + (e.pageY / drag_scaleY)
        ];
        drag_check = [ e.pageX, e.pageY ];
    }
    e.preventDefault();
    e.stopPropagation();
}, true);

gui_overlay.addEventListener("mouseup", (e) => {
    if (drag_check && zoomer_index < zoomer_factors.length-1) {
        zoomer_index++;
        ZoomIt();
        var bbox = twitch_video_ref.getBoundingClientRect();
        PanAdjustCalc(
            (e.pageX - bbox.left) / drag_scaleX, 
            (e.pageY - bbox.top)  / drag_scaleY, 
            -1
        );
        PanIt();
    } else if (e.button == 2 && zoomer_index > 0) {
        zoomer_index--;
        ZoomIt();
        var bbox = twitch_video_ref.getBoundingClientRect();
        PanAdjustCalc(
            (e.pageX - bbox.left) / drag_scaleX, 
            (e.pageY - bbox.top)  / drag_scaleY, 
            1
        );
        PanIt();
    }
    drag = false;
    drag_check = false;
    gui_overlay.style.cursor = "zoom-in";
}, true);

gui_overlay.addEventListener("mouseout", (e) => {
    drag = false;
    drag_check = false;
    gui_overlay.style.cursor = "zoom-in";
});

var passiveX = 0; var passiveY = 0;
gui_overlay.addEventListener("mousemove", (e) => {
    passiveX = e.pageX; passiveY = e.pageY;
    if (drag_check) {
        if ( (Math.abs(drag_check[0] - e.pageX) > drag_threshold) ||
             (Math.abs(drag_check[1] - e.pageY) > drag_threshold) ) 
        {
            drag_check = false;
            gui_overlay.style.cursor = "move";
        }
    }
    if (!drag_check && drag) {
        zoomer_x = drag[0] - (e.pageX / drag_scaleX);
        zoomer_y = drag[1] - (e.pageY / drag_scaleY);
        PanIt();
    }
}, true);

var last_wheel = 0;
gui_overlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (new Date() - last_wheel < 100) return;
    last_wheel = new Date();
    var direction = (e.deltaY < 0)? 1: -1;
    if (direction < 0 && zoomer_index == 0) return;
    if (direction > 0 && zoomer_index == zoomer_factors-1) return;

    zoomer_index += direction;
    ZoomIt();
    var bbox = twitch_video_ref.getBoundingClientRect();
    PanAdjustCalc(
        (passiveX - bbox.left) / (bbox.width / 100),
        (passiveY - bbox.top)  / (bbox.height / 100),
        -direction
    );
    PanIt();
})

gui_overlay.addEventListener("contextmenu", e => e.preventDefault());

var keyHandler = (e) => {

    if (e.shiftKey && (e.key == "Z" || e.key == "z") ) {
        ToggleZoomer();
    }
    
    if (e.code == "Escape" && zoomer_index > 0) {
        ResetZoomer();
    }

    if (!zoomer_on) {
        return;
    }
    
    if (e.code == "ArrowUp") {
        zoomer_y -= 5;
        PanIt();
    } else if (e.code == "ArrowDown") {
        zoomer_y += 5;
        PanIt();
    } else if (e.code == "ArrowLeft") {
        zoomer_x -= 5;
        PanIt();
    } else if (e.code == "ArrowRight") {
        zoomer_x += 5;
        PanIt();
    } else if (e.key == "+") {
        ZoomIn();
    } else if (e.key == "-") {
        ZoomOut();
    }
    e.preventDefault();
    e.stopPropagation();
}

window.addEventListener("keyup", keyHandler);