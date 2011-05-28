/* panorama360 - plugin for jQuery
 * Copyright (c) 2011 Minimalistic Studio (http://minimalisticstudio.com/)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Thanks to: http://www.openstudio.fr for the initial idea.
 *
 * Some changes were made by Evgeny Likov (http://likov.spb.ru): fixed drag and kinetic scroll (thanks man!)
 */
(function($) {
	$.fn.panorama360 = function(options){
		this.each(function(){
			var settings = {
				start_position: 0,
				image_width: 0,
				image_height: 0,
				mouse_wheel_multiplier: 20,
				bind_resize: true
			};
			if(options) $.extend(settings, options);
			var viewport = $(this);
			var panoramaContainer = viewport.children('.panorama-container');
			var viewportImage = panoramaContainer.children('img:first');
			if(settings.image_width<=0 && settings.image_height<=0){
				settings.image_width = parseInt(viewportImage.data("width"));
				settings.image_height = parseInt(viewportImage.data("height"));
				if (!(settings.image_width) || !(settings.image_height)) return;
			}
			var image_ratio = settings.image_height/settings.image_width;
			var elem_height = parseInt(viewport.height());
			var elem_width = parseInt(elem_height/image_ratio);
			var image_map = viewportImage.attr('usemap');
			var image_areas;
			var isDragged = false;
			var mouseXprev = 0;
			var scrollDelta = 0;

			viewportImage.height(elem_height).removeAttr("usemap").css("left",0).clone().css("left",elem_width+"px").insertAfter(viewportImage);

			panoramaContainer.css({
				'margin-left': '-'+settings.start_position+'px',
				'width': (elem_width*2)+'px',
				'height': (elem_height)+'px'
			});

			setInterval( function() {
				if (isDragged) return false;
				scrollDelta = scrollDelta * 0.98;
				if (Math.abs(scrollDelta)<=2) scrollDelta = 0;
				scrollView(panoramaContainer, elem_width, scrollDelta);
			}, 1);
			viewport.mousedown(function(e){
				if (isDragged) return false;
				$(this).addClass("grab");
				isDragged = true;
				mouseXprev = e.clientX;
				scrollOffset = 0;
				return false;
			}).mouseup(function(){
				$(this).removeClass("grab");
				isDragged = false;
				scrollDelta = scrollDelta * 0.45;
				return false;
			}).mousemove(function(e){
				if (!isDragged) return false;
				scrollDelta = parseInt((e.clientX - mouseXprev));
				mouseXprev = e.clientX;
				scrollView(panoramaContainer, elem_width, scrollDelta);
				return false;
			}).bind("mousewheel",function(e,distance){
				var delta=Math.ceil(Math.sqrt(Math.abs(distance)));
				delta=distance<0 ? -delta : delta;
				scrollDelta = scrollDelta + delta * 5;
				scrollView(panoramaContainer,elem_width,delta*settings.mouse_wheel_multiplier);
				return false;
			}).bind('contextmenu',stopEvent).bind('touchstart', function(e){
				if (isDragged) return false;
				isDragged = true;
				mouseXprev = e.originalEvent.touches[0].pageX;
				scrollOffset = 0;
			}).bind('touchmove', function(e){
				e.preventDefault();
				if (!isDragged) return false;
				var touch_x = e.originalEvent.touches[0].pageX;
				scrollDelta = parseInt((touch_x - mouseXprev));
				mouseXprev = touch_x;
				scrollView(panoramaContainer, elem_width, scrollDelta);
			}).bind('touchend', function(e){
				isDragged = false;
				scrollDelta = scrollDelta * 0.45;
			});

			if (image_map) {
				$('map[name='+image_map+']').children('area').each(function(){
                    var area_coord, area_fragment;
					switch ($(this).attr("shape").toLowerCase()){
						case 'rect':
							area_coord = $(this).attr("coords").split(",");
                            area_fragment = $("<a class='area' href='"+$(this).attr("href")+"' title='"+$(this).attr("alt")+"'>"+$(this).attr("alt")+"</a>");
							// opacity support in older browser
                            area_fragment.css({opacity:0.2});
                            panoramaContainer.append(area_fragment.data("stitch",1).data("coords",area_coord));
							panoramaContainer.append(area_fragment.clone().data("stitch",2).data("coords",area_coord));
							break;
					}
				}).remove();
				image_areas = panoramaContainer.children(".area");
				image_areas.mouseup(stopEvent).mousemove(stopEvent).mousedown(stopEvent);
				repositionHotspots(image_areas,settings.image_height,elem_height,elem_width);
			}

			if (settings.bind_resize){
				$(window).resize(function(){
					elem_height = parseInt(viewport.height());
					elem_width = parseInt(elem_height/image_ratio);
					panoramaContainer.css({
						'width': (elem_width*2)+'px',
						'height': (elem_height)+'px'
					});
					viewportImage.css("left",0).next().css("left",elem_width+"px");
					if (image_map) repositionHotspots(image_areas,settings.image_height,elem_height,elem_width);
				});
			}
            if (settings.callback && typeof settings.callback === 'function'){
                var img = 0;
                $('.panorama-container img').load(function(e){
                    img += 1;
                    if (img == 2) {
                        settings.callback();
                    }
                });
			}
		});
		
		function stopEvent(e){
			e.preventDefault();
			return false;
		}

		function scrollView(panoramaContainer,elem_width,delta){
			var newMarginLeft = parseInt(panoramaContainer.css('marginLeft'))+delta;
			if (newMarginLeft > 0) newMarginLeft = -elem_width;
			if (newMarginLeft < -elem_width) newMarginLeft = 0;
			panoramaContainer.css('marginLeft', newMarginLeft+'px');
		}

		function repositionHotspots(areas,image_height,elem_height,elem_width){
			var percent = elem_height/image_height;
			areas.each(function(){
				area_coord = $(this).data("coords");
				stitch = $(this).data("stitch");
				switch (stitch){
					case 1:
						$(this).css({
							'left':		(area_coord[0]*percent)+"px",
							'top':		(area_coord[1]*percent)+"px",
							'width':	((area_coord[2]-area_coord[0])*percent)+"px",
							'height':	((area_coord[3]-area_coord[1])*percent)+"px"
						});
						break;
					case 2:
						$(this).css({
							'left':		(elem_width+parseInt(area_coord[0])*percent)+"px",
							'top':		(area_coord[1]*percent)+"px",
							'width':	((area_coord[2]-area_coord[0])*percent)+"px",
							'height':	((area_coord[3]-area_coord[1])*percent)+"px"
						});
						break;
				}
			});
		}
	}
})(jQuery);