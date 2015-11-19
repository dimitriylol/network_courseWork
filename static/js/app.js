// set up SVG for D3, parameters:
var width  = 960,
    height = 500,
    colors = d3.scale.category10();
var nodesJsonPath = '/globalNetwork';

//comon used variables:
var body = d3.select('body');
var buttonTemplate = '<button id="showTable" onclick="showTableWays(\'{id}\')">Get table</button>';
var KEY = {
    backspace: 8,
    delete: 46,
    B: 66,
    L: 76,
    R: 82,
    ctrl: 17
};

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function showTableWays(id) {
    //send GET request for table with proper id
    fillTableWays(id);
    tip_node.hide();
    $('#tableWays').dialog('open');
}

function fillTableWays(id) {
    var theData = [[1, 2], [3, 4], [5, 6]];
    var table = body.select('#tableWays').append('table');

    table.selectAll('tr')
        .data(theData)
        .enter()
        .append('tr')
        .selectAll('td')
        .data(function(d) {return d})
        .enter()
        .append('td')
        .text(function(d, y) {return d});
}

var tip_node = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            if (body.select('#tableWays').empty()) {
                body.append('div').attr('id', 'tableWays').attr('title', 'Table of ways');
            }
 
            $(function() {
                $('#tableWays').dialog({
                    autoOpen: false,
                    show: {
                        effect: 'blind',
                        duration: 1000
                    },
                    hide: {
                        effect: 'explode',
                        duration: 1000
                    }
                });
            });

            return buttonTemplate.replace('{id}', d.id);
        });

var tip_edge = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        //TODO: remove debugger; can we use console.log instead of debugger statement here?
        debugger;
        return 'type: ' + d.type + ' weight: ' + d.weight;
    });

var svg = body
    .append('svg')
    .attr('oncontextmenu', 'return false')
    .attr('width', width)
    .attr('height', height);
  
// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [-1],
    lastNodeId = -1,
    links = [-1];

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)

function defineArrowMarkers() {
    svg.append('svg:defs')
        .append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
        .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000');

    svg.append('svg:defs')
        .append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 4)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
        .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#000');
}

defineArrowMarkers();

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}

//TODO: think about functions naming
var isSelected = function(d) {return d === selected_link};
var isLeftTrue = function(d) {return d.left ? 'url(#start-arrow)' : ''};
var isRightTrue = function(d) {return d.right ? 'url(#end-arrow)' : ''};

function updateExistingLinks() {
    path.classed('selected', isSelected)
        .style('marker-start', isLeftTrue)
        .style('marker-end', isRightTrue);
}

function addNewLinks() {
    var link = path.enter().append('svg:path');
    path.call(tip_edge);

    // console.log('link is ' + link);
    link.attr('class', 'link')
        .classed('selected', isSelected)
        .style('marker-start', isLeftTrue)
        .style('marker-end', isRightTrue)
        .on('mouseover', tip_edge.show)
        .on('mouseout', tip_edge.hide)
        .on('mousedown', function(d) {
            if (d3.event.ctrlKey) return;
            // select link
            mousedown_link = d;
            selected_link = mousedown_link === selected_link
                ? null
                : mousedown_link;
            selected_node = null;
            restart();
        });
}

function removeOldLinks() {
    path.exit().remove();
}

function showNodeIds() {
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) {return d.id});
}

function removeOldNodes() {
    circle.exit().remove();
}

//TODO: think aboiut naming. what about renaming this function less abstract?
// update graph (called when needed)
function restart() {
    // path (link) group
    path = path.data(links);

    updateExistingLinks();
    addNewLinks();
    removeOldLinks();

    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) {return d.id});

    //TODO: think about naming
    var fillColor = function(d) {return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id)};
    var isReflexive = function(d) {return d.reflexive};

    // debugger;
    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .style('fill', fillColor)
        .classed('reflexive', isReflexive);

    // add new nodes
    var g = circle.enter().append('svg:g');
    
    // debugger;
    if (null != g[0][0]) {
        g.call(tip_node);
    }
    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 12)
        .style('fill', fillColor)
        .style('stroke', function(d) {return d3.rgb(colors(d.id)).darker().toString()})
        .classed('reflexive', isReflexive)
        .on('mouseover', function(d) {
            tip_node.show(d);
            if (!mousedown_node || d === mousedown_node) return;

            // enlarge target node
            d3.select(this).attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function(d) {
            if(!mousedown_node || d === mousedown_node) return;

            // unenlarge target node
            d3.select(this).attr('transform', '');
        })
        .on('mousedown', function(d) {
            if(d3.event.ctrlKey) return;

            // select node
            mousedown_node = d;

            //TODO: check if it is not copy-pasted code, which can be moved to the external function
            selected_node = mousedown_node === selected_node
                ? null
                : mousedown_node;
            selected_link = null;

            // reposition drag line
            drag_line
                .style('marker-end', 'url(#end-arrow)')
                .classed('hidden', false)
                .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

            restart();
        })
        .on('mouseup', function(d) {
            if(!mousedown_node) return;

            // needed by FF
            drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            // check for drag-to-self
            mouseup_node = d;
            if (mouseup_node === mousedown_node) {
                resetMouseVars();
                return;
            }

            // unenlarge target node
            d3.select(this).attr('transform', '');

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target, direction;
      
            if (mousedown_node.id < mouseup_node.id) {
                source = mousedown_node;
                target = mouseup_node;
                direction = 'right';
            } else {
                source = mouseup_node;
                target = mousedown_node;
                direction = 'left';
            }

            //TODO: use Array.find method instead of Array.filter, but check if it is available before it (in other case: use es-shim)
            var link = links.filter(function(l) {
                return l.source === source && l.target === target;
            })[0];

            if (link) {
                link[direction] = true;
            } else {
                link = {source: source, target: target, left: false, right: false};
                link[direction] = true;
                links.push(link);
            }

            // select new link
            selected_link = link;
            selected_node = null;
            restart();
        });

    // showNodeIds();
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) {return d.id});
    
    removeOldNodes();

    // set the graph in motion
    force.start();
}

function mousedown() {
    // prevent I-bar on drag
    //d3.event.preventDefault();

    // because :active only works in WebKit?
    svg.classed('active', true);

    if (d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    // insert new node at point
    var point = d3.mouse(this);

    nodes.push({
        id: ++lastNodeId,
        reflexive: false,
        x: point[0],
        y: point[1]
    });

    restart();
}

function mousemove() {
    if (!mousedown_node) return;

    // update drag line
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if (mousedown_node) {
        // hide drag line
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');
    }

    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
    var toSplice = links.filter(function(l) {
        return l.source === node || l.target === node;
    });

    toSplice.forEach(function(l) {
        links.splice(links.indexOf(l), 1);
    });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
    d3.event.preventDefault();

    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    if (d3.event.keyCode === KEY.ctrl) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if (!selected_node && !selected_link) return;

    switch (d3.event.keyCode) {
        case KEY.backspace:
        case KEY.delete:
            if(selected_node) {
                nodes.splice(nodes.indexOf(selected_node), 1);
                spliceLinksForNode(selected_node);
            } else if(selected_link) {
                links.splice(links.indexOf(selected_link), 1);
            }

            selected_link = null;
            selected_node = null;
            restart();
        break;
        case KEY.B:
            if (selected_link) {
                // set link direction to both left and right
                selected_link.left = true;
                selected_link.right = true;
            }

            restart();
        break;
        case KEY.L:
            if (selected_link) {
                // set link direction to left only
                selected_link.left = true;
                selected_link.right = false;
            }
            restart();
        break;
        case KEY.R:
            if(selected_node) {
                // toggle node reflexivity
                selected_node.reflexive = !selected_node.reflexive;
            } else if(selected_link) {
                // set link direction to right only
                selected_link.left = false;
                selected_link.right = true;
            }
            restart();
        break;
    }
}

function keyup() {
    lastKeyDown = -1;

    if(d3.event.keyCode === KEY.ctrl) {
        circle
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
        svg.classed('ctrl', false);
    }
}

function indexFromObjectArr(objArr, proper, val) {
    //TODO: reduce using array functions by using proper method (Array.findIndex)
    return objArr.map(function(obj) {return obj[proper]}).indexOf(val);
}

function getGlobalNetwork() {
    $.when(
        $.getJSON(
            nodesJsonPath,
            function (data) {
                nodes = data.nodes.map(function(node) {return JSON.parse(node)});
                lastNodeId = nodes[nodes.length - 1].id;

                links = data.links.map(function (link) {
                    var node = JSON.parse(link)
                    node.source = nodes[indexFromObjectArr(nodes, 'id', node.source)];
                    node.target = nodes[indexFromObjectArr(nodes, 'id', node.target)];
                    return node;
                });
            }
        ))
    .done(function(not_used) {
        links.forEach(function(link) {
            if (typeof nodes[link.source] === 'undefined') {
                console.log('undefined source', link);
            }

            if (typeof nodes[link.target] === 'undefined') {
                console.log('undefined target', link);
            }
        });

        //TODO: remove debugger
        // debugger;

        nodes = [
            {id: 0, reflexive: false},
            {id: 1, reflexive: false},
            {id: 2, reflexive: false}
        ];
        lastNodeId = 2;
        links = [
            {source: nodes[0], target: nodes[1], left: false, right: true, type: 'd', weight: 1},
            {source: nodes[1], target: nodes[2], left: false, right: true, type: 'd', weight: 1}
        ];

        //TODO: remove debugger
        // debugger;
        restart();
    });
}

function startApp() {
    svg.on('mousedown', mousedown)
        .on('mousemove', mousemove)
        .on('mouseup', mouseup);

    d3.select(window)
        .on('keydown', keydown)
        .on('keyup', keyup);

    getGlobalNetwork();
}

startApp();
