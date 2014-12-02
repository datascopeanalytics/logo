var textLayer = new Layer();
var text = project.importSVG(document.getElementById('logotype'));
text.position = new Point([400,200]);
text.fillColor = 'white';
//text.scale(.65);
var boundsLayer = new Layer();
var inner = new Path.Rectangle(text.bounds);
inner.strokeColor = "red";

console.log(text.bounds.topLeft);

var segmentLayer = new Layer();
// corners first
var line_length = 80;
var corner_line_length = line_length/Math.sqrt(2);

var tl_corner = new Path.Line(
    text.bounds.topLeft,
    new Point(
	text.bounds.topLeft.x-corner_line_length,
	text.bounds.topLeft.y-corner_line_length
    )
)
var tr_corner = new Path.Line(
    text.bounds.topRight,
    new Point(
	text.bounds.topRight.x+corner_line_length,
	text.bounds.topRight.y-corner_line_length
    )
)
var tl_corner = new Path.Line(
    text.bounds.bottomLeft,
    new Point(
	text.bounds.bottomLeft.x-corner_line_length,
	text.bounds.bottomLeft.y+corner_line_length
    )
)
var tl_corner = new Path.Line(
    text.bounds.bottomRight,
    new Point(
	text.bounds.bottomRight.x+corner_line_length,
	text.bounds.bottomRight.y+corner_line_length
    )
)
var left_side = new Path.Line(
    new Point(text.position.x-(text.bounds.width/2),
	      text.position.y),
    new Point(text.position.x-(text.bounds.width/2)-line_length,
	      text.position.y)
)
var right_side = new Path.Line(
    new Point(text.position.x+(text.bounds.width/2),
	      text.position.y),
    new Point(text.position.x+(text.bounds.width/2)+line_length,
	      text.position.y)
)
var horizontal_spacing = text.bounds.width/3;
var top_left = new Path.Line(
    new Point(text.bounds.topLeft.x+horizontal_spacing,
	      text.bounds.topLeft.y),
    new Point(text.bounds.topLeft.x+horizontal_spacing,
	      text.bounds.topLeft.y-line_length)
)
var top_right = new Path.Line(
    new Point(text.bounds.topRight.x-horizontal_spacing,
	      text.bounds.topRight.y),
    new Point(text.bounds.topRight.x-horizontal_spacing,
	      text.bounds.topRight.y-line_length)
    
)
var bottom_left = new Path.Line(
    new Point(text.bounds.bottomLeft.x+horizontal_spacing,
	      text.bounds.bottomLeft.y),
    new Point(text.bounds.bottomLeft.x+horizontal_spacing,
	      text.bounds.bottomLeft.y+line_length)
)
var bottom_right = new Path.Line(
    new Point(text.bounds.bottomRight.x-horizontal_spacing,
	      text.bounds.bottomRight.y),
    new Point(text.bounds.bottomRight.x-horizontal_spacing,
	      text.bounds.bottomRight.y+line_length)
    
)

var pointLayer = new Layer();
var vertices = [];
var p0, p1;
segmentLayer.children.forEach(function(segment, index) {
    segment.strokeColor = "blue";

    // 
    p0 = segment.segments[0].point;
    p1 = segment.segments[1].point;
    var vertex = p0 + (p1 - p0) * Math.random();
    vertices.push(vertex);
    var p = new Path.Circle(vertex, 5);
    p.fillColor = "rgb(150,150,255)";

})

var polarVertices = [];
for(var i=0; i<vertices.length; i++){
    var polarCoords = cart_to_polar(vertices[i],text.bounds.center);
    polarCoords.x = vertices[i].x;
    polarCoords.y = vertices[i].y;
    polarVertices.push(polarCoords);
}
polarVertices.sort(theta_comparator);

var shapeLayer = new Layer();
var shape = new Path();
shape.fillColor = "#ff6000";

for(var i=0; i<polarVertices.length; i++){
    shape.add(polar_to_point(polarVertices[i]));
}
shape.add(polar_to_point(polarVertices[0]));

shapeLayer.moveBelow(textLayer);

var displayConstruction = false;
if(!displayConstruction){
    boundsLayer.remove();
    segmentLayer.remove();
    pointLayer.remove();
}



function cart_to_polar(point,center){
    var dx = point.x-center.x;
    var dy = point.y-center.y;
    var r = ((dx)^2 + (dy)^2)^.5;
    var theta = Math.atan2(dy,dx);
    return {r:r, theta:theta};
}
function theta_comparator(a,b){
    if (a.theta < b.theta)
        return -1;
    if (a.theta > b.theta)
        return 1;
    // a must be equal to b
    return 0;
};
function polar_to_point(polarCoord){
    return new Point(polarCoord.x, polarCoord.y);
}
