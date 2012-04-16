/*	Widget - a modular plugin inplace	*/

(function ( window, undefined ) {

	'use strict';

	// Properties
	var doc = document,
		widget = function( module ){

			var script = doc.getElementsByTagName('script'),
			current = script [ script.length - 1 ],

			args = ( function () {

				var attr = [].slice.call(current.attributes),
					param = {};

				attr.forEach( function ( c ) {
					widget[c.name] = c.value;
					param[c.name] = c.value;
				});

				return param;
			}());

		// attaching properties
		widget = {

			'el'	: current,
			'args'	: args
		};

		module();
	};


	// Functions
	widget.style = function( el, obj ){

		var style = el + ' { ';


        function getPrefix(){

            var domPrefixe = 'Webkit Moz O ms Khtml'.split(' '),
                prefix = '', // default
                l = domPrefixe.length, i = 0,
                div = document.createElement('div');

            for( ; i < l ; i++ ){
                if( div.style[domPrefixe[i] + 'AnimationName'] !== undefined ){
                    prefix = '-' + domPrefixe[i].toLowerCase() + '-';
                    break;
                }
            }

            return prefix;
        }


		Object.keys( obj ).forEach( function( p ){

			if( p === 'transition' || p === 'border-radius' ){

				style += getPrefix() + p + ':' + obj[p] + ';';

			} else {

				style += p + ':' + obj[p] + ';';
			}
		});

		style += ' }';

		if (doc.styleSheets && doc.styleSheets.length) {

			doc.styleSheets[0].insertRule( style, 0);
		} else {

			var sheet = doc.createElement('style');
				sheet.innerHTML = style;

			doc.getElementsByTagName('head')[0].appendChild( sheet );
		}
	};


	window.widget = widget;

}(window));




// img module
var img = function(){


	(function init() {


		var stack = widget.type || [ grey ];

		load( widget.image, stack.reverse() );

	}());


	function load( src, stack ){

		var img = new Image();

		img.onload = function(){

			change( img, stack);
		};

		img.src = src;
	}


		function change( img , stack ){

			// canvas variables
			var edit = stack.pop(),

				cvs = document.createElement('canvas'),
				ctx = cvs.getContext('2d'),

				width = img.width,
				height = img.height;

				cvs.width = width,
				cvs.height = height;

			ctx.drawImage( img, 0, 0 );


			// // image variables
			var image = ctx.getImageData( 0, 0, width, height),

				pixels = width * height,

				data = image.data,
				length = data.length,

				pos, r, g, b, c;


			while(--pixels){

				pos = pixels * 4;

				r = data[ pos    ];
				g = data[ pos + 1];
				b = data[ pos + 2];
				a = data[ pos + 3];

				c = edit( r, g, b, a);

				data[pos  ] = c[0];
				data[pos+1] = c[1];
				data[pos+2] = c[2];
				data[pos+3] = c[3];
			}

			// // writing the pixels data back
			image.data = pixels;
			ctx.putImageData( image, 0,0,0,0, width, height);

			url = cvs.toDataURL();

			if( !stack.length ){

				append( img, url );

			} else {

				load( url, stack);
			}
		}


		function grey( r , g , b , a ) {

			r = g = b = (r + g + b) / 3;

			return [ r , g , b , a ];
		}



		// creating the elements here instead of using innerhtml !
		function append ( img , modified ){

			widget.style( '.widget-imgex-wrapper', {

				display		: 'inline-block',
				position	: 'relativ'
			});


			var width = (widget.width) ? widget.width : img.width,
				height = (widget.height) ? widget.height : img.height,
				min = ( width < height) ? width : height;

			var images = {

				position	: 'absolute',
				width		: min + 'px',
				height		: min + 'px',
				'border-radius': 999999999 + 'px',
				transition	: 'opacity 0.5s ease-in-out',
				'box-shadow' : '-1px -1px 2px 2px #000,\
								1px -1px 2px 2px #000,\
								-1px 1px 2px 2px #000,\
								1px  1px 2px 2px #000'
			};


			widget.style( '.widget-imgex-color', images );

			widget.style( '.widget-imgex-grey', images );

			widget.style( '.widget-imgex-grey:hover', {

				opacity	: 0
			});


			var bar = {

				position	: 'absolute'
			};



			widget.style( '.widget-imgex-left', bar );

			widget.style( '.widget-imgex-right', bar );



			var container = document.createElement('div'),

				link = (widget.href || widget.link) ? 'href="' + (widget.href || widget.link) + '"' : '',

				text = (widget.text || widget.title) ?  (widget.text || widget.title) : '',
				left = text.substr(0, text.length/2),
				right = text.substr(text.length/2);

			container.classList.add('widget-imgex');


			container.innerHTML =	'<div class="widget-imgex-wrapper">\
										<a ' + link + '>\
											<img src="' + img.src +'" class="widget-imgex-color" >\
											<img src="' + modified +'" class="widget-imgex-grey" >\
											<div class="widget-imgex-left">' + left + '</div>\
											<div class="widget-imgex-right">' + right + '</div>\
										</a>\
									</div>';

			document.body.appendChild( container );
		}
};

// widget
widget ( img);