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



// // IIFE / imgex
var imgex = function(){

	(function init() {

		var img = new Image();

		img.onload = function(){

			createGrey(img);
		};

		img.src = widget.image;

	}());




		function createGrey ( img ) {

			// canvas variables
			var cvs = document.createElement('canvas'),
				ctx = cvs.getContext('2d'),

				width = img.width,
				height = img.height;

				cvs.width = width,
				cvs.height = height;

			ctx.drawImage( img, 0, 0 );


			// image variables
			var image = ctx.getImageData( 0, 0, width, height),
				pixels = image.data,
				length = pixels.length,
				pos, r, g , b;


			for( var y = 0; y < height; y++ ) {
				for( var x = 0; x < width; x++ ) {

					pos = (y * width + x) * 4,
					r = pixels[pos+0],
					g = pixels[pos+1],
					b = pixels[pos+2];

					pixels[pos+0] =	pixels[pos+1] =	pixels[pos+2] = (r + g + b) / 3;
				}
			}

			// writing the pixels data back
			image.data = pixels;
			ctx.putImageData( image, 0,0,0,0, width, height);

			// append
			append( img, cvs.toDataURL() );
		}


			// creating the elements here instead of using innerhtml !
			function append ( img , greyURL ){

				widget.style( '.widget-imgex-wrapper', {

					display		: 'inline-block',
					position	: 'relativ'
				});


				var images = {

					position	: 'absolute',
					width		: (widget.width) ? widget.width + 'px' : '',
					height		: (widget.height) ? widget.height + 'px' : '',
					'border-radius': 999999999 + 'px',
					transition	: 'opacity 1s ease-in-out',
					'box-shadow' : '1px 1px 2px 2px #000'
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
												<img src="' + greyURL +'" class="widget-imgex-grey" >\
												<div class="widget-imgex-left">' + left + '</div>\
												<div class="widget-imgex-right">' + right + '</div>\
											</a>\
										</div>';

				document.body.appendChild( container );
			}
};


// widget - imgex
widget ( imgex );