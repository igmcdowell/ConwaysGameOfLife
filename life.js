/* CalcLife takes a grid of nine cells and determines whether the center cell is alive or dead for the next round
according to the rules of Conway's Game of Life */
function CalcLife (center, neighbors) {
    if (neighbors == 3 || (center && neighbors ==2)) 
        return 1;
    return 0;
}

/* CalcChanges executes CalcLife for each cell in the grid.   
It returns a list of all cells that have changed.
*/
function CalcChanges(grid) {
    var rlen = grid[0].length;
    var clen = grid.length;
    var changes = [];
    for(var i = 1; i<clen-1; i++) {
        for(var j = 1; j<rlen -1; j++) {
            var tval = CalcLife(grid[i][j], grid[i-1][j-1] + grid[i-1][j] + grid[i-1][j+1] + grid[i][j-1] + grid[i][j+1] + grid[i+1][j-1] + grid[i+1][j] + grid[i+1][j+1]);
            if(grid[i][j] - tval) { //empirically runs significantly faster to subtract and test non zero than to compare values.
                changes.push(['#r'+i+'c' +j,i,j]);
            }
        }
    }
    return changes;   
}

//Advance advances by toggling cells
function Advance(grid) {
	var changes = CalcChanges(grid.rawgrid);
	for (change in changes) {
		ToggleSpot($(changes[change][0])[0], changes[change][1], changes[change][2], grid);
	}
}

function Run(grid, slider, table) {
    var tdelay = 1000 - slider.value/178*900;
	window.setTimeout(function(){
		if(table.hasClass("running")) {
			Advance(grid);
			Run(grid, slider, table);
		}
	}, tdelay, true);
}

function Start(grid) {
    $("#thegame table").addClass("running");
	$('#gamecontrol').html("Stop Simulation");
	$('#advance').attr('disabled', 'disabled');
	Run(grid, $("#gamespeed")[0], $("#thegame table"));
}

function Stop() {
    $("#thegame table").removeClass("running");
	$('#gamecontrol').html("Run Simulation");
	$('#advance').removeAttr('disabled');
}

function StartStop(grid) {
	if($("#thegame table").hasClass("running")) {
        Stop();
	}
	else {
	    Start(grid)
	}
}

function ToggleCell(el, grid) {
    var pos = el.id.split('r')[1];
	pos = pos.split('c');
	ToggleSpot(el, pos[0], pos[1], grid);
}

function ToggleSpot(spot, row, column, grid) {
	$(spot).toggleClass("live");
    grid.ToggleVal(row,column);
}

function Grid(width, height) {
    /* MakeGrid takes a width and height and returns a wXh array initialized to 0*/
    this.MakeGrid =function(width, height) {
       if(!height){
           return Array();
       }
       var row = Array();
       for (var i=0; i<width; i++) {
           row.push(0)
       }
       var grid = Array(row);
       grid = grid.concat(this.MakeGrid(width, height -1));
       return grid;
    }
    
    this.ToggleVal = function(x,y) {
        if (this.rawgrid[x][y]) 
    		this.rawgrid[x][y] = 0;
    	else
    		this.rawgrid[x][y] = 1;
    }
    
    /* GridToHTML takes the grid of 0s and 1s and converts it to an HTML table. */
    this.GridToHTML = function() {
        var rawhtml = '<table id="lifegrid" class="rainbowtable">';
        var state = ['', ' live'];
        for (line in this.rawgrid) {
            rawhtml = rawhtml + '<tr>';
            for (element in this.rawgrid[line]) {
                rawhtml = rawhtml + '<td id = "r' + String(line) + 'c' + String(element) + '" class="c' + String(element)+ state[this.rawgrid[line][element]] +'">&nbsp;</td>';
            }
            rawhtml = rawhtml + '</tr>';
        }
        rawhtml = rawhtml + '</table>';
        return rawhtml;
    }    
    
    /* GridToString takes the grid of 0s and 1s and converts it to a compressed string. 
    String.fromCharCode(n) gives a string
    s.charCodeAt(0) gives the int value
    Could start a language at charcode 36 and go up to charcode 126. That gives a base 90 language.
    
    Each charcode represents a string of 0s, unless prefixed by a !
    
    Special delimiters: 
     # - new line
     ! - string of 1s
    */
    this.GridToString = function() { 
        function ValToString(val) {
            val = val + 35;
            if (!val) {
                return '';
            }
            if (val < 127) {
                return String.fromCharCode(val);
            }
            else {
                return '~' + ValToString(val-126);
            }
        }
        var gs = '';
        gs = gs + ValToString(this.rawgrid[0].length)+ '#' + ValToString(this.rawgrid.length) + '#';
        var contigs = 0;
        var onzero = true;
        var cval = 0;
        for (row in this.rawgrid) {
            onzero = true;
            for (cell in this.rawgrid[row]) {
                cval = this.rawgrid[row][cell];
                if(onzero) { //we're on a string of zeroes
                    if(!cval) {
                        contigs++;
                    }
                    else {
                        gs = gs + ValToString(contigs);
                        onzero = false;
                        contigs = 1;
                    }
                }
                else { //we're on a string of ones
                    if(cval) { //we're still on a string. Increment counter
                        contigs++;
                    }
                    else { //the string is done. Need to record it and move on.
                        gs = gs + '!' + ValToString(contigs);
                        contigs = 1;
                        onzero = true;
                    }
                }
            }
        }
        if(onzero) {
            gs = gs + ValToString(contigs);
        }
        else {
            gs = gs + '!' + ValToString(contigs);
        }
        return gs;
    }
    
    this.MakeGridFromString = function(s) {
        function charToVal(c) {
            return c.charCodeAt(0) - 35;
        }
        var hashes = s.split('#')
        var w = parseInt(charToVal(hashes[0]));
        var h = parseInt(charToVal(hashes[1]));
        var celldata = hashes[2];
        var rawgrid = [];
        var row = [];
        var remainder = this.width;
        var onestring = false;
        var leftoverones = false;
        var contigs = 0;
        var rowindex = 0;
        var colindex = 0;
        var cellen = celldata.length;
        for (var i = 0; i< cellen; i++) {
            if(celldata[i]=='!') {
                onestring = true;
                i++;
            }
            else {
                onestring = false;
            }
            contigs = charToVal(celldata[i]);
            while(contigs > 0) {
                if(onestring)
                    row.push(1);
                else
                    row.push(0);
                if(row.length == w) {
                    rawgrid.push(row);
                    row = [];
                }
                contigs = contigs -1;       
            }
        }
        rawgrid.push(row);
        return rawgrid;
    }
    
    this.AddGridToDOM = function(){
        Stop("Run Simulation", "Stop Simulation");
        var grid = this;
        var hex = 'FF5E5E';
        var colorfloor = '5E';
        var percent = 100/(this.width);
        $("#columncolors").remove();
        var stylehtml = '<style type="text/css" id="columncolors">';
        for (column in this.rawgrid[0]) {
            hex = ColorUtils.AdvanceRGBHex(hex, colorfloor, percent);
            rule = ' table.rainbowtable * .c' + String(column) + '.live {background-color:#'+hex+';}\n '; 
            stylehtml = stylehtml + rule;
        }
        stylehtml = stylehtml + '</style>';
        $(stylehtml).appendTo('head');
    	$("#tablearea").append(this.html);
    }
    
    this.setHandlers = function(shapes) {
        var g = this;
        $("#lifegrid").mousedown(function(e){
            if(e.target.nodeName == 'TD') {
    		$("#lifegrid").queue(function() {
    		    ToggleCell(e.target, g);
    		    $("#lifegrid").dequeue();
    		});
		}
    		isHighlightingBoxes = true;
		});
    	$("#lifegrid").mouseover(function(e){
    		if(isHighlightingBoxes) {
    		    if(e.target.nodeName == 'TD') {
    			$("#lifegrid").queue(function() {
        		    ToggleCell(e.target,g);
        		    $("#lifegrid").dequeue();
        		});	
    		}
    		}
    			if(isDraggingShape) {
    				var selectedShape = $("#prefabs > .selected")[0].id;
    				var pattern = shapes[selectedShape];
    			    RenderShape(e.target, pattern, g);
				}
    	});
    }

    if(typeof(width)=='number') 
        this.rawgrid = this.MakeGrid(width,height);
    else {
        this.rawgrid = this.MakeGridFromString(width);
    }
    this.width = this.rawgrid[0].length;
    this.height = this.rawgrid.length;
    this.html = this.GridToHTML();
}

/* ChangeGrid removes the old grid from the DOM and replaces it with a new grid of the appropriate width/height */
function NewGrid(w,h) {
	$('#lifegrid').remove();
	g = new Grid(w,h);
	g.AddGridToDOM();
	SetBoxSize();
	return g;
}
	
function SetBoxSize() {
	var val =$('#boxsize')[0].value;
	var newsize = parseInt(val);
	$("#boxstyle").remove();
	$("<style type='text/css' id='boxstyle'> td{ min-width:"+ val + "px; height:" + val+"px;} </style>").appendTo("head");
}


function RemoveShape(targetcell, shape, oldvals, grid) {
    var newtargstring = '';
    var newtarg;
    var pos = targetcell.id.split('r')[1];
	var pos = pos.split('c');
    var refy = parseInt(pos[0]);
    var refx = parseInt(pos[1]);
    for(pixel in shape) {
        newtargstring = '#r'+String(refy + shape[pixel][1]) + 'c'+String(refx + shape[pixel][0]);
        newtarg = $(newtargstring);
        if(newtarg.length > 0) {
            if(!newtarg.hasClass(oldvals[pixel])) 
                ToggleCell(newtarg[0], grid);
            }
    }
}

function DragShape(shape, grid) {
    Stop();
    $("body").css('cursor', 'pointer');
	$("td").mouseover(function(){
		RenderShape(this, shape, grid);
	});

}

function RenderShape(targetcell, shape, grid) {
    var oldvals = Array();
    var oldval = 0;
    var newtargstring = '';
    var newtarg;
    var pos = targetcell.id.split('r')[1];
	var pos = pos.split('c');
    var refy = parseInt(pos[0]);
    var refx = parseInt(pos[1]);
    for (pixel in shape) {
        newtargstring = '#r'+String(refy + shape[pixel][1]) + 'c'+String(refx + shape[pixel][0]);
        newtarg = $(newtargstring);
        if(newtarg.length > 0) {
            if(newtarg.hasClass('live')) 
                oldval = 'live';
            else {
                oldval = '';
                ToggleCell(newtarg[0], grid);
            }
            oldvals.push(oldval);
        }
    }
    //Need to remove the shape if the user chooses to pass through.
    $(targetcell).mouseout(function(){
	    RemoveShape(targetcell, shape, oldvals, grid);
	    $(this).unbind('mouseout');
	});
	$(targetcell).mouseup(function(){
	   $(this).unbind('mouseout'); 
	   $(this).unbind('mouseup');
	});
}