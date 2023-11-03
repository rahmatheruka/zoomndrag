var view_scale = 650;
var cpos = {
  x: 0,
  y: 0,
  scale: 0,
  swidth: 0,
  sheight: 0,
  min_scale: 0,
  max_scale: 5,
  nohide: false,
};
var svg;
var viewer;
var dragging  = false;

var viewport    = {width: 0, height: 0};
var last_coord  = {x: 0, y: 0};
var first_coord = {x: 0, y: 0};
var pinch_scale = 1;


$('document').ready(function() {
  svg    = $('svg');
  viewer = $('#tree-container');

  var [stop, sleft, swidth, sheight] = svg.attr('viewBox').split(' ');
  cpos.swidth = swidth;
  cpos.sheight = sheight;

  viewport.width = viewer.width();
  viewport.height = viewer.height();

  // custom sizing
  // want ground plane to be aligned to middle of viewport, with top of tree at top of screen

  var view_distance = viewport.height / 2;
  var scale = view_distance / view_scale;
  cpos.scale = scale;
  console.log(scale);

  var min_scale_x = viewport.width / cpos.swidth;
  var min_scale_y = viewport.height / cpos.sheight;
  cpos.min_scale = min_scale_x > min_scale_y ? min_scale_x : min_scale_y;
  console.log(cpos.min_scale);

  cpos.x = (viewport.width - scale * swidth) / 2;

  svg.css('left', cpos.x);
  svg.css('width', scale * swidth);
  svg.css('height', scale * sheight);

  viewer.on('mousedown touchstart', beginDrag);
  $(window).on('mouseup touchend', endDrag);
  $(window).on('mousemove touchmove', doDrag);

  viewer.on('wheel', doWheel);
  viewer.on('dblclick', zoomOnPoint);
  viewer.on('gesturestart', beginPinch);
  viewer.on('gesturechange', doPinch);
}); 


function beginPinch(evt) {
  pinch_scale = cpos.scale;
  evt.preventDefault();
}

function doPinch(evt) {
  zoomOnPointWithScale(viewport.width / 2, viewport.height / 2, pinch_scale * evt.originalEvent.scale);
  evt.preventDefault();
}

function beginDrag(evt) {
  last_coord = first_coord = {
    x: evt.pageX ? evt.pageX : evt.touches[0].pageX,
    y: evt.pageY ? evt.pageY : evt.touches[0].pageY,
  };
  dragging = true;

  evt.preventDefault();
}

function doDrag(evt) {
  if (!dragging) return;

  var now_coord = {
    x: evt.pageX ? evt.pageX : evt.touches[0].pageX,
    y: evt.pageY ? evt.pageY : evt.touches[0].pageY,
  };
  var offset = {x: now_coord.x - last_coord.x, y: now_coord.y - last_coord.y};
  last_coord = now_coord;

  if (Math.abs(first_coord.x - now_coord.x) > 2 || Math.abs(first_coord.y - now_coord.y) > 2) {
    cpos.nohide = true;
  }

  cpos.x += offset.x;
  cpos.y += offset.y;

  // clamp svg to viewport
  if (cpos.swidth * cpos.scale > viewport.width) {
    if (cpos.x > 0) cpos.x = 0;
    if (cpos.x + cpos.swidth * cpos.scale < viewport.width) cpos.x = viewport.width - cpos.swidth * cpos.scale;
  } else {
    if (cpos.x < 0) cpos.x = 0;
    if (cpos.x + cpos.swidth * cpos.scale > viewport.width) cpos.x = viewport.width - cpos.swidth * cpos.scale;
  }

  if (cpos.sheight * cpos.scale > viewport.height) {
    if (cpos.y > 0) cpos.y = 0;
    if (cpos.y + cpos.sheight * cpos.scale < viewport.height) cpos.y = viewport.height - cpos.sheight * cpos.scale;
  } else {
    if (cpos.y < 0) cpos.y = 0;
    if (cpos.y + cpos.sheight * cpos.scale > viewport.height) cpos.y = viewport.height - cpos.sheight * cpos.scale;
  }

  // force redraw with hide().show(0)
  svg.css({left: cpos.x, top: cpos.y}).hide().show(0);

  evt.preventDefault();
  return false;
}

function endDrag(evt) {
  dragging = false;
  cpos.nohide = false;
}

function doWheel(evt) {
  if (dragging) return false;

  var deltaY = 0;

  if (evt.originalEvent.deltaY) {
    // FireFox 17+ (IE9+, Chrome 31+?)
    deltaY = -evt.originalEvent.deltaY;
  } else if (evt.originalEvent.wheelDelta) {
    deltaY = -evt.originalEvent.wheelDelta;
  }

  if (deltaY > 1) {
    deltaY = 1;
  } else if (deltaY < -1) {
    deltaY = -1;
  }

  var scale = cpos.scale + (cpos.scale * deltaY) / 20;

  zoomOnPointWithScale(evt.pageX, evt.pageY, scale);
  evt.preventDefault();
}

function zoomOnPoint(evt) {
  var level = cpos.scale + 1;
  zoomOnPointWithScale(evt.pageX, evt.pageY, level);
}

function zoomOnPointWithScale(x, y, scale) {
  if (scale < cpos.min_scale) scale = cpos.min_scale;
  if (scale > cpos.max_scale) scale = cpos.max_scale;

  var x_offset = x - ((x - cpos.x) / cpos.scale) * scale;
  var y_offset = y - ((y - cpos.y) / cpos.scale) * scale;

  cpos.scale = scale;
  cpos.x = x_offset;
  cpos.y = y_offset;

  // clamp svg to viewport
  if (cpos.swidth * cpos.scale > viewport.width) {
    if (cpos.x > 0) cpos.x = 0;
    if (cpos.x + cpos.swidth * cpos.scale < viewport.width) cpos.x = viewport.width - cpos.swidth * cpos.scale;
  } else {
    if (cpos.x < 0) cpos.x = 0;
    if (cpos.x + cpos.swidth * cpos.scale > viewport.width) cpos.x = viewport.width - cpos.swidth * cpos.scale;
  }

  if (cpos.sheight * cpos.scale > viewport.height) {
    if (cpos.y > 0) cpos.y = 0;
    if (cpos.y + cpos.sheight * cpos.scale < viewport.height) cpos.y = viewport.height - cpos.sheight * cpos.scale;
  } else {
    if (cpos.y < 0) cpos.y = 0;
    if (cpos.y + cpos.sheight * cpos.scale > viewport.height) cpos.y = viewport.height - cpos.sheight * cpos.scale;
  }

  svg.css({
    left: cpos.x,
    top: cpos.y,
    width: scale * cpos.swidth,
    height: scale * cpos.sheight,
  });
}
