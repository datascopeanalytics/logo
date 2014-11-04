var MINIMUM_SIDE_SIZE = 90;
var DEBUG = true;

var textTemplate = project.importSVG(document.getElementById('logotype')).children[0];
textTemplate.fillColor = 'black'

// OPTION: use stroke + hittest
var textclone = textTemplate.clone();
textclone.strokeWidth = 30;
textclone.strokeColor = "yellow";
textclone.sendToBack();

var outerBounds = textclone.strokeBounds;
outerBounds = outerBounds.scale(1.15, 1.25);

var outerBoundsPath = Path.Rectangle(outerBounds, outerBounds.height/3)
outerBoundsPath.fillColor = 'green';
outerBoundsPath.sendToBack();

function drawLogo(innerBounds, outerBounds, text, center) {
    // move everything to the right spot
    innerBounds.position = center;
    outerBounds.position = center;
    text.position = center;

    var forbidden = [innerBounds];

    var tries = 0;
    var satisfied = false;
    var give_up = false;
    // repeat this until we can't. give up after 50 (?) tries
    var i = 0;
    while(true) {
        var new_point = randPointWithinBounds(outerBounds, forbidden, 50);
        console.log(new_point);
        if(new_point === false){
            console.log('TIME TO BREAK!!!');
            break;
        }
        else {
            var circ = Path.Circle(new_point, 5);
            circ.fillColor = 'red';
            circ.bringToFront();

            // add its "forbidden zone" to the list
            var minimumside = Path.Circle(new_point, MINIMUM_SIDE_SIZE);
            // needs to have a fill "color" to be used with hitTest.
            minimumside.fillColor = new Color(0.0,0.0);
            minimumside.strokeColor = 'red';
            forbidden.push(minimumside);
        }
        i+=1;
    }
    // once we have the vertices, connect the points.
}
var center = new Point(300,200);
drawLogo(textclone, outerBoundsPath, textTemplate, center);


// takes a Group, loops through its children, and unions them all
// together sequentially.
function reduce_by_union(group) {
    // seed the borg
    var the_borg = group.firstChild;
    // assimilate all others into the borg
    for(var i=1; i<group.children.length; i++){
        the_borg = the_borg.unite(group.children[i]);
    }
    return the_borg;
}


// if a thing has multiple children, return only the first one.
// otherwise, return the thing.
function reduce_to_first_child(thing) {
    if(thing.children.length > 1) {
        return thing.firstChild;
    }
    else {
        return thing;
    }
}
function centroid(polygon) {
  var area = 0;
  var c_x = 0;
  var c_y = 0;
  polygon.curves.forEach(function (curve) {
    var p1 = curve.point1;
    var p2 = curve.point2;
    var z = (p1.x * p2.y - p2.x * p1.y);
    c_x += (p1.x + p2.x) * z;
    c_y += (p1.y + p2.y) * z;
    area += z;
});
  area /= 2;
  c_x /= (6 * area);
  c_y /= (6 * area);
  return new Point(c_x, c_y);
}

// given a containing PathItem and a list of excluding PathItems,
// draws a point uniformly within the bounds of the containing
// PathItem and checks to see if the point is inside the containing
// shape and outside the excluding ones.. repeats til it gets it right
// tries indicates the number of times to try before
function randPointWithinBounds(containing, excluding, max_tries) {
    var satisfied = false;
    var tries = 0;
    var rand;
    while(!satisfied && (tries < max_tries)) {
        satisfied = true;
        rand = drawPointInside(containing);
        console.log("trying", rand);
        for(pathInd in excluding){
            path = excluding[pathInd];
            var ok = !path.hitTest(rand, {fill:true,
                                          stroke:true});
            console.log("outside?", ok, path);
            satisfied = (satisfied && ok);
        }
        //console.log('satisfied & tries:', satisfied, tries);
        if(satisfied){
            console.log('SUCCESS!',rand);
            return rand;
        }
        tries += 1;
    }
    console.log('we failed');
    return false;
}

// given a PathItem, draws a point uniformly within its bounds and checks
// to see if the point is actually inside the shape.. repeats til it
// gets it right
function drawPointInside(path) {
    var satisfied = false;
    var rand;
    while(!satisfied) {
        rand = path.bounds.topLeft + path.bounds.bottomRight * Point.random();
        satisfied = path.contains(rand);
    }
    return rand;
}


function onMouseDown(event) {
    //console.log(event);
    if(textclone.hitTest(event.downPoint, {'stroke': true})){
        console.log("clicked it");
    }
}

// var text2= textTemplate.clone();
// text2.fillColor = "blue";
// text2.translate(new Point(0,300));
