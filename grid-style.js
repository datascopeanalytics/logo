/**
   var text = new PointText({
   point: [120, 300],
   content: 'datascope',
   fillColor: 'white',
   fontFamily: 'Avenir Next',
   fontWeight: '600',
   fontSize: 72
   });
*/

// takes an item with bounds, returns an irregular polygon to put around it
var GenerativePoly = function(text, passedColor) {
    console.log("drew it");
    var textlayer = new Layer();
    textlayer.addChild(text);

    // DEBUG: turn this to 'true' to quickly see how the darn thing is built!
    this.displayConstruction = false;

    // configure bounding box
    var adjust = 20;
    var padding = 15;
    var border = new Layer();
    var bounds = new Rectangle({
        point: [text.bounds.x-adjust/2-padding, text.bounds.y-padding/2],
        size: [text.bounds.width+adjust+padding*2, text.bounds.height+padding]
    });
    var box = new Path.Rectangle(bounds,0);
    box.strokeColor = 'black';
    border.addChild(box);
    console.log(bounds.height);

    var gridlines = new Layer();
    // box around text
    gridlines.addChild(new Path.Line(new Point(0, bounds.y),
                                     new Point(1000, bounds.y)));

    gridlines.addChild(new Path.Line(new Point(bounds.x, 0),
                                     new Point(bounds.x, 1000)));

    gridlines.addChild(new Path.Line(new Point(bounds.x+bounds.width,0),
                                     new Point(bounds.x+bounds.width,1000)));

    gridlines.addChild(new Path.Line(new Point(0,bounds.y+bounds.height),
                                     new Point(1000,bounds.y+bounds.height)));

    var leftmid = new Point(bounds.x,bounds.y+bounds.height/2);
    var rightmid = new Point(bounds.x+bounds.width,bounds.y+bounds.height/2);

    var topleft = new Point(bounds.x, bounds.y);
    var topright = new Point(bounds.x+bounds.width, bounds.y);
    var bottomright = new Point(bounds.x+bounds.width, bounds.y+bounds.height);
    var bottomleft = new Point(bounds.x, bounds.y+bounds.height);

    for(var ang=45;ang>0;ang=ang-5){
        gridlines.addChild(lineFrom(topleft, 90+ang, 500));
        gridlines.addChild(lineFrom(bottomright, -90+ang, 500));
        gridlines.addChild(lineFrom(topright, ang+45, 500));
        gridlines.addChild(lineFrom(bottomleft, ang-135, 500));
    }
    for(var ang=45;ang>0;ang=ang-2){
        gridlines.addChild(lineFrom(topright, 180+ang, 500));
        gridlines.addChild(lineFrom(bottomleft, ang, 500));
        gridlines.addChild(lineFrom(bottomright, 180-ang, 500));
        gridlines.addChild(lineFrom(topleft, -ang, 500));
    }

    var offset = 35;
    var outerBorder = new Path.Rectangle(new Rectangle(
        new Point(bounds.x-.75*offset,
                  bounds.y-offset),
        new Size(bounds.width+1.5*offset,
                 bounds.height+2*offset)));
    border.addChild(outerBorder);
    var intersects = {};
    for(var i=0; i<gridlines.children.length; i++){
        gridlines.children[i].strokeColor = 'blue';
        for(var j=0; j<gridlines.children.length; j++){
            if(i !== j){
                var intersect = gridlines.children[i].getIntersections(
                    gridlines.children[j]);
                for(var k=0; k<intersect.length; k++){
                    var point = intersect[k].point;
                    if(outerBorder.contains(point)){
                        intersects[point] = point;
                    }
                }
            }
        }
    }
    outerBorder.strokeColor = 'red';
    var circles = new Layer();

    for(key in intersects){
        var circ = new Path.Circle(new Point(intersects[key]), 3);
        circ.fillColor = '#000000';
        circles.addChild(circ);
    }

    // choose vertices from the set of candidate intersection points from the construction lines.
    var points = circles.children.slice(0);
    var vertices = [];
    var circlelayer = new Layer();
    for(var i=0; i<9; i++){
        var rand = Math.floor(Math.random()*points.length);
        points[rand].fillColor = 'yellow';
        c2 = new Path.Ellipse({
            center: pathCenter(points[rand]),
            radius: [bounds.height*.7, bounds.height*.7*.7],
            strokeColor: 'black',
        });

        vertices.push(pathCenter(points[rand]));
        circlelayer.addChild(c2);

        var newpoints = [];
        for(var j=0; j < points.length; j++){
            // remove the things that are too close to the point we picked

            if(!c2.contains(pathCenter(points[j]))) {
                newpoints.push(points[j]);
            }
        }
        points = newpoints;
    }
    var polarVertices = [];
    for(var i=0; i<vertices.length; i++){
        var polarCoords = cart_to_polar(vertices[i],bounds.center);
        polarCoords.x = vertices[i].x;
        polarCoords.y = vertices[i].y;
        polarVertices.push(polarCoords);
    }
    polarVertices.sort(theta_comparator);

    var shapeLayer = new Layer();
    var shape = new Path();
    shape.fillColor = passedColor;

    for(var i=0; i<polarVertices.length; i++){
        shape.add(polar_to_point(polarVertices[i]));
    }
    shape.add(polar_to_point(polarVertices[0]));

    shapeLayer.moveBelow(textlayer);

    if(!this.displayConstruction){
        gridlines.remove();
        circles.remove();
        circlelayer.remove();
        border.remove();
    }
}

function polar_to_point(polarCoord){
    return new Point(polarCoord.x, polarCoord.y);
}

function line_between_points(a,b) {
    var start = new Point(a.x, a.y);
    var end = new Point(b.x, b.y);
    var line = new Path.Line(start,end);
    return line;
}

function theta_comparator(a,b){
    if (a.theta < b.theta)
        return -1;
    if (a.theta > b.theta)
        return 1;
    // a must be equal to b
    return 0;
};
function cart_to_polar(point,center){
    var dx = point.x-center.x;
    var dy = point.y-center.y;
    var r = ((dx)^2 + (dy)^2)^.5;
    var theta = Math.atan2(dy,dx);
    return {r:r, theta:theta};
}

// takes a PathItem, gets its bounds and finds the center of them
function pathCenter(pathitem){
    var bounds = pathitem.bounds;
    return new Point(bounds.x+bounds.width/2, bounds.y+bounds.height/2);
}

// takes a starting point, angle, and length, and returns a Path.Line
function lineFrom(startpoint,angle,length){
    var endpoint = new Point(startpoint.x+length*Math.cos(angle/180*Math.PI),
                             startpoint.y+length*Math.sin(angle/180*Math.PI));
    var line = new Path.Line(startpoint,
                             endpoint);
    return line;
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}
var draw = function() {
    // this is for drawing 9 different logos on 1 canvas. we happen to know the size a priori.
    var points = [[200,100],[600,100],[1000,100],[200,300],[600,300],[1000,300],[200,500],[600,500],[1000,500]];
    for (var i=0; i<points.length; i++){

        // put the center (?) of this SVG in this location and color it white
        var text = project.importSVG(document.getElementById('logotype'));
        text.position = new Point(points[i]);
        text.fillColor = 'white';
        text.scale(.65);

        // make a v nice polygon
        var poly = new GenerativePoly(text,'#f56600');
    }
}
document.getElementById('downloadButton').addEventListener("click", function() {
    download('logos.svg',project.exportSVG({asString:true}));
});
draw();
document.getElementById('regenButton').addEventListener("click", function() {
    project.clear();
    draw();
});


//download('logos.svg',project.exportSVG({asString:true}));

// var gui = new dat.GUI();
// gui.add(poly1, 'displayConstruction');
