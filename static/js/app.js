// set up SVG for D3, parameters:
var width  = 1300,
    height = 700,
    colors = d3.scale.category10();
var nodesJsonPath = '/globalNetwork';
var getTableWays = '/tableOfWay';
var getSequenceSending = '/sequenceSending';
var getMessageSending = '/sendMessage';
var powerElement = '/propertyElement';
var powerConnection = '/propertiesConnection';
var addElement = '/addElement';
var addConnection = '/addConnection';

//comon used variables:
var tip_edge_hide;
var body = d3.select('body');
// TODO: fetch all button to buttonTemplate with fucntion that generate them
var buttonTemplate = '<button id=\'{button_id}\' onclick=\'{func_to_call}\'"> \'{text}\' </button>'
var buttonTableTemplate = '<button id="showTable" onclick="showTableWays(\'{id}\')">Get table</button>';
var buttonSequenceTemplate = '<button id="showSequence" onclick="showSequenceSending(\'{id}\')">Show sequence</button>';
var buttonSendingTemplate = '<button  id="showSending" onclick="showSendingMessage(\'{id}\', \'{len}\')">Show sending</button>';
var KEY = {
    delete: 46,
    ctrl: 17
};

function createButtonString(button_id, func_to_call, text) {
    return buttonTemplate.replace('{button_id}', button_id)
                         .replace('{func_to_call}', func_to_call)
                         .replace('{text}', text)
}

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function sendingRequest(url_request, objToSend, done_function) {
    $.when(
        $.ajax({
            url: url_request,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(objToSend),
            dataType: 'json',
            error: function (err) {
                alert('Request ' + url_request + ' fucked up!')
            },
            success: function (data) {
                return data;
            }})).
        done(function (respond_data) {
            done_function(respond_data);
    });
}

function showSendingMessage(id, message_len) {
    var mess_len = body.select('[name="messageLen"]');
    if (!mess_len.empty() && mess_len[0][0].value)
        mess_len = mess_len[0][0].value;
    else
        mess_len = message_len;
    sendingRequest(getMessageSending, { 'id': id, 'message_len': mess_len },
        function (sendTable) {
            // TODO: refactor this shit
            var table = body.select('#tableWays');
            if (table.select('table'))
                table.selectAll("*").remove();
            fillTableSending(sendTable.max_length_packet, sendTable.send_table, mess_len);
            $('#tableWays').dialog('open');
        })
}

function fillTableSending(max_len, sendTable, message_len) {
    body.select('#tableWays').append('p').text('Max size of packet: ' + max_len)
    body.select('#tableWays').append('p').text(' Length of message: ' + message_len)
    var table = body.select('#tableWays').append('table');
    var packet_len = sendTable[0].logical_connection.map(function (elem, index, array) {
        return elem[0];
    });
    var tableHead = ['id']
    packet_len.forEach(function(obj) {
        tableHead.push('logical connect ' + obj);
    })
    packet_len.forEach(function(obj) {
        tableHead.push('datagram ' + obj);
    })
    fillTableHead(table, tableHead);
    var tableInf = [];
    var index_id = -1;
    sendTable.forEach(function(info_for_id) {
        tableInf.push([info_for_id.id]);
        index_id++;
        info_for_id.logical_connection.forEach(function (pair) {
            tableInf[index_id].push(pair[1])
        });
        info_for_id.datagram_method.forEach(function (pair) {
            tableInf[index_id].push(pair[1])
        });
    })
    fillTable(table, tableInf);
}

function showSequenceSending(id) {
    sendingRequest(getSequenceSending, { 'id': id }, function(sequence) {
       var i = 0;
       var paint = function (iter) {
           if (sequence[iter]) {
               body.selectAll('path').style('stroke', 'black');
               for (var source in sequence[iter]) {
                   body.selectAll('[source="' + source + '"], [target="' + source + '"]')
                       .style('stroke', function (d) {
                           return (sequence[iter][source][d.source.id] || sequence[iter][source][d.target.id]) ?
                               'blue' :
                               'black';
                       })
               }
           }
            else {
               clearInterval(paint_time);
               body.selectAll('path').style('stroke', 'black');
            }
        }
        var paint_time = setInterval(function () { paint(i++); }, 1000);
    });
}

function showTableWays(id) {
    sendingRequest(getTableWays, { 'id': id }, function(table_data) {
        var table = body.select('#tableWays');
        if (table.select('table'))
            table.selectAll("*").remove();
        var index = 0;
        fillTableWays(table_data.shortest.map(function(arr) {
            arr.push(table_data.min_transit[index++][1]);
            return arr;
        }));
        //tip_node.hide();
        $('#tableWays').dialog('open');
    });
}

function fillTable(selected_table, table_data) {
    var row;
    table_data.forEach(function(table_row, index, array) {
        row = selected_table.append('tr')
        row.selectAll('td')
            .data(table_row)
            .enter()
            .append('td')
            .text(function(d) { return d;})
    });
}

function fillTableHead(select_table, header) {
    select_table.append('tr')
        .selectAll('th')
        .data(header)
        .enter()
        .append('th')
        .text(function(d) { return d; } )
}

function fillTableWays(table_data) {
    var table = body.select('#tableWays').append('table');
    fillTableHead(table, ['id', 'shortest way', 'min transit'])
    fillTable(table, table_data);
}

function createTooltip(id, htmlFunction) {
    return d3.tip()
        .attr('class', 'd3-tip')
        .attr('id', id)
        .offset([-1, 0])
        .html(htmlFunction);
}

function getCheckboxTemplate(decsription, power, id_dom) {
    return decsription + '<input type="checkbox" id=' + id_dom + (function () { return power && 'checked' || '';})() +
        '>';
}

function contentTooltip(id, message_len, power) {
    //var buttonTableTemplate = '<button id="showTable" onclick="showTableWays(\'{id}\')">Get table</button>';
//var buttonSequenceTemplate = '<button id="showSequence" onclick="showSequenceSending(\'{id}\')">Show sequence</button>';

    return '<div id = contentTooltip><p>' +
            buttonTableTemplate.replace('{id}', id) + '</p><p>' +
            buttonSequenceTemplate.replace('{id}', id) + '</p><p>' +
            buttonSendingTemplate.replace('{id}', id).replace('{len}', message_len) + '</p><p>' +
            'Message length: <input type="text" name="messageLen"></p><p>' +
            getCheckboxTemplate('On/off:', power, '"elementPower"') +
            '</p></div>';
}

var tip_node = createTooltip('node', function(d) {
    var tip = body.select('#node');
    //TODO: check is useless???
    if (!tip.empty())
        tip.on('mouseleave', function() { setPower(tip, d.id); tip_node.hide(); });
    if (body.select('#tableWays').empty()) {
        body.append('div').attr({
            id: 'tableWays',
            title: 'Table of ways'
        });
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

    return contentTooltip(d.id, getRandomInt(1000, 5000), d.power);
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setPower(tip_dom_element, id1, id2) {
    var power = tip_dom_element.select('#elementPower')[0][0].checked;
    var type_checkbox = tip_dom_element.select('#elementType');
    var type = type_checkbox.empty() ? null : type_checkbox[0][0].checked && 'duplex' || 'half-duplex';
    var is_element_p =   id2 &&
                         function(element) {
                            return element.source.id == id1 && element.target.id == id2 ||
                                   element.source.id == id2 && element.target.id == id1;
                         } ||
                         function(element) {
                            return element.id == id1;
                         };
    sendingRequest( id2 && powerConnection || powerElement,
                    { id1: id1, id2: id2, power: power, type: type },
                    function (data) {
                    (function() { return id2 && links || nodes; })().forEach(
                        function(elem, index, arr) {
                            if (is_element_p(elem))
                                elem.power = power;
                                if (elem.type) {
                                    elem.type = type;
                                    elem.weight = data.weight;
                                }
                        });
                    });
}

var tip_edge = createTooltip('edge', function(d) {
    var tip = body.select('#edge');
    if (!tip.empty())
        tip.on('mouseover', function(d) {
            clearTimeout(tip_edge_hide);
            tip_edge_hide = null;
            })
           .on('mouseleave', function() {
               setPower(tip, d.source.id, d.target.id);
               tip_edge.hide();
           });
    return getCheckboxTemplate('Checked - duplex, not checked - half-duplex',
                                d.type === 'duplex' ? true : false,
                                '"elementType"') + '<br/>' +
        ' weight: ' + d.weight + '<br/>' + getCheckboxTemplate('On/off: ', d.power, '"elementPower"');
});

var svg = body
    .append('svg')
    .attr({
        oncontextmenu: 'return false',
        width: width,
        height: height
    });
  
// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [-1],
    lastNodeId = -1,
    links = [-1];

var force = d3.layout.force()

//function defineArrowMarkers() {
//    function createArrow(markerParam, pathD) {
//        Object.assign(markerParam, {
//            viewBox: '0 -5 10 10',
//            markerWidth: 3,
//            markerHeight: 3,
//            orient: 'auto'
//        });
//
//        svg.append('svg:defs')
//            .append('svg:marker').attr(markerParam)
//            .append('svg:path').attr({
//                fill: '#000',
//                d: pathD
//            });
//    }
//
//    //createArrow({
//    //    id: 'end-arrow',
//    //    refX: 6
//    //}, 'M0,-5L10,0L0,5');
//    //
//    //createArrow({
//    //    id: 'start-arrow',
//    //    refX: 4
//    //}, 'M10,-5L0,0L10,5');
//}
//
//defineArrowMarkers();

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr({
        class: 'link dragline hidden',
        d: 'M0,0L0,0'
    });

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
//var isSelected = function(d) {return d === selected_link};
//var isLeftTrue = function(d) {return d.left ? 'url(#start-arrow)' : ''};
//var isRightTrue = function(d) {return d.right ? 'url(#end-arrow)' : ''};
//
//function updateExistingLinks() {
//    path.classed('selected', isSelected)
//        .style('marker-start', isLeftTrue)
//        .style('marker-end', isRightTrue);
//}

function addNewLinks() {
    var link = path.enter().append('svg:path');
    path.call(tip_edge);

    link.attr('class', 'link')
        .attr('source', function(d) { return d.source.id; })
        .attr('target', function(d) { return d.target.id; })
        //.classed('selected', isSelected)
        //.style('marker-start', isLeftTrue)
        //.style('marker-end', isRightTrue)
        .on('mouseover', function(d) {
            tip_edge.show(d);
        })
        .on('mouseout', function (d) {
            tip_edge_hide = setTimeout(function() {
                    tip_edge.hide();
            }, 2000);
        })
        //.on('mousedown', function(d) {
        //    if (d3.event.ctrlKey) return;
        //    // select link
        //    mousedown_link = d;
        //    selected_link = mousedown_link === selected_link
        //        ? null
        //        : mousedown_link;
        //    selected_node = null;
        //    restart();
        //})
        ;
}

function removeOldLinks() {
    path.exit().remove();
}

function showNodeIds() {
    g.append('svg:text')
        .attr({
            x: 0,
            y: 4,
            class: 'id'
        })
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

    //updateExistingLinks();
    addNewLinks();
    removeOldLinks();

    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) {return d.id});

    //TODO: think about naming
    var fillColor = function(d) {return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id)};
    var isReflexive = function(d) {return d.reflexive};

    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .style('fill', fillColor)
        .classed('reflexive', isReflexive);

    // add new nodes
    var g = circle.enter().append('svg:g');
    
    if (null != g[0][0]) { // hang only one d3.tooltip on first node and using it for all elements
        g.call(tip_node);
    }
    g.append('svg:circle')
        .attr({
            class: 'node',
            r: 12
        })
        .style('fill', fillColor)
        .style('stroke', function(d) {return d3.rgb(colors(d.id)).darker().toString()})
        .classed('reflexive', isReflexive)
        .on('mouseover', function(d) {
            if (selected_node === d) return;
            tip_node.show(d);
            // enlarge target node
            d3.select(this).attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function(d) {
            if (selected_node === d) return;
            if (d3.event.relatedTarget != body.select('#node')[0][0])
                tip_node.hide();

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
        .on('mouseup', function(node) {
            if(!mousedown_node) return;

            // needed by FF
            drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            // check for drag-to-self
            mouseup_node = node;
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

            var link = links.find(function(l) {
                return l.source === source && l.target === target;
            });

            if (link) {
                link[direction] = true;
                selected_link = link;
                selected_node = null;
                restart();
            } else {
                sendingRequest(addConnection, {source: source.id, target: target.id},
                    function(aboutConnection) {
                        link = {source: source, target: target, left: false, right: false};
                        for (var key in aboutConnection)
                            link[key] = aboutConnection[key];
                        link[direction] = true;
                        links.push(link);
                        // select new link
                        //selected_link = link;
                        //selected_node = null;
                        restart();
                    })
            }
        });

    // showNodeIds();
    g.append('svg:text')
        .attr({
            x: 0,
            y: 4,
            class: 'id'
        })
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

    sendingRequest(addElement, {id: lastNodeId}, function(aboutElement) {
        var last_node = nodes.find(function(node) { return node.id == lastNodeId; })
        for (var key in aboutElement)
            last_node[key] = aboutElement[key];
    })

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
    //console.log(d3.event.keyCode, KEY);
    if ([KEY.delete, KEY.ctrl].indexOf(d3.event.keyCode) === -1) {
        return;
    }

    d3.event.preventDefault();

    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    if (d3.event.keyCode === KEY.ctrl) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if (!selected_node && !selected_link) return;

    switch (d3.event.keyCode) {
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

//TODO: rename me or not
function calculateForce() {
    force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .size([width, height])
        .linkDistance(150)
        .charge(-500)
        .on('tick', tick)
    restart();
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
    .done(calculateForce);
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
