/* Visual Computing via the canvas Element & JS API	*/

document.getElementById('fileLoader').addEventListener( 'change', function ( e ) {

	var	reader = new FileReader();

	reader.onload = function ( e ) {

		var img = new Image();

		img.onload = function(){

			createEdits(img);
		};

		//img.crossOrigin = 'anonymous'; // war ein problemm...
		img.src = e.target.result;

	};

	reader.readAsDataURL( e.target.files[0] );
});




/* creating a blob (~ since  canvas.toBlob() dosn't work right away)	*/ // see: http://stackoverflow.com/a/5100158
function createBlob(dataURI){

	// convert base64/URL Encoded data to raw binary
	var byteString = (dataURI.split(',')[0].indexOf('base64') >= 0)?atob(dataURI.split(',')[1]):unescape(dataURI.split(',')[1]);

	// extracting the mimeType
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	// writing the bytes of the string into an array
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i <byteString.length; i++){
		ia[i] = byteString.charCodeAt(i);
	}

	//(window.WebKitBlobBuilder)?(
	var builder = new WebKitBlobBuilder() || new MozBlobBuilder() || new BlobBuilder();
	builder.append(ab);

	// creating the blob with the specified mime
	var blob = builder.getBlob(mimeString);

	return blob;
}





/* creating modified version of the image */
function createEdits(img){

	// shortcut for localStorage
	var storage = window.localStorage;



	var greyImageURL = (storage.getItem('grey')!== null)?storage.getItem('grey') : change(img, grey);


	createImage(img.src);

	createImage(greyImageURL);


	greyImageURL = change(img, sepia);
	createImage(greyImageURL);
}




/////////////////////////////////////////////////////////////////////////////////////////

/* functions to change the image */ // extras => additional material calcualte before
function change(img, edit, extras) {

	// canvas variables
	var cvs = document.createElement('canvas'),
		ctx = cvs.getContext('2d'),
		width = img.width,
		height = img.height;

	cvs.width = width;
	cvs.height = height;
	ctx.drawImage(img, 0,0);

	// image variables
	var image = ctx.getImageData(0,0, width,height),
		pixels = image.data,//detach pixel information from DOM
		length = pixels.length;

	for(var y = 0; y < height; y++){
		for(var x = 0; x < width; x++){

			var pos = (y * width + x) * 4;

			// passed function
			edit(pixels, pos, extras);
		}
	}

	// zurückschreiben der pixels in die image-data
	image.data = pixels;

	ctx.putImageData(image, 0,0,0,0, width, height);


	// saving the URL at local Storage + return
	var url = cvs.toDataURL();

	var name = edit.toString();
	name = name.substring(9, name.indexOf('(')); // siehe 9 - fpr function_
	window.localStorage.setItem(name, url);

	// klappt auch noch nicht mit allen...

	// return the created URL
	return url;
}



/* callback for creating the image */
function createImage( url ){

	console.log(3);
	var img = document.createElement('img');
	img.src = url;

	var width = img.style.width;
	var height = img.style.height;


	document.body.appendChild(img);
}


//////////////////////////////////////////////////////


/* creating a grey scaled version */
function grey(pixels, pos){

	// ermitteln von rgba
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];

	var avColor = (r + g + b)/3;

	// zurück schreiben der werte
	pixels[pos+0] = pixels[pos+1] = pixels[pos+2] = avColor;
}


/* inverses the color */
function invers(pixels, pos){

	// ermitteln von rgb
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];

	// verändern
	r =	255 - r;
	g = 255 - g;
	b = 255 - b;

	// zurück schreiben der werte in den array
	pixels[pos+0] = r;
	pixels[pos+1] = g;
	pixels[pos+2] = b;
}





/* creating a sepia toned version */
function sepia(pixels, pos){

	// ermitteln von rgba
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];
	var a = pixels[pos+3];

	// Erhöhung der Heligkeit
	var Y = ( 0.299 * r + 0.587 * g + 0.114 * b );
	var Cb = 0;
	var Cr = 0;

	var rn = (Y + 1.402 * Cr);
	var gn = (Y - 0.3441 * Cb - 0.7141 * Cr);
	var bn = (Y + 1.772 * Cb);

	// Erhöhung von Rot + Verringerung von Blau
	rn = rn + 35;
	bn = bn - 35;

	// /////////////////////////////////////////

	// Beschränkung der größe
	rn = (rn>255)?255:(rn<0)?0:rn;
	bn = (bn>255)?255:(bn<0)?0:bn;
	gn = (gn>255)?255:(gn<0)?0:gn;

	// //////////////////////////////////////////

	// zurück schreiben der werte in den array
	pixels[pos+0] = rn;
	pixels[pos+1] = gn;
	pixels[pos+2] = bn;
}



/* eine schwarz-weiß skallierung, abhänig von der stufen anzahl die man eingibt... -> immernoch ein binärbild */
function binary(pixels, pos, factor){

	// min 3s
	factor = factor || 4;

	// ermitteln von rgb
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];

	// YCbCr Farbraum
	var Y = (0.299 * r + 0.587 * g + 0.114 * b);

	// Abstufung
	for (var i = 0; i < factor;i++){

		var change = i * 255/factor;
		if( Y <= change){
			rn = gn = bn = change;
			break;
		}
	}

	// zurück schreiben der werte in den array
	pixels[pos+0] = rn;
	pixels[pos+1] = gn;
	pixels[pos+2] = bn;
}




// just black or white -> pure binary with diffusion, sinnvoller nicht nur die vertcale, sondern die in beide richtungen... // acuh noch fehler
function binaryWithDiffusion(pixels, pos, formerY){

	// ermitteln von rgb
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];

	// YCbCr Farbraum
	var Y = (0.299 * r + 0.587 * g + 0.114 * b);

	Y = Y + formerY;
	var val = (Y<255-Y)?0:255;

	formerY = Y - val;
	rn = gn = bn = val;

	// zurück schreiben der werte in den array
	pixels[pos+0] = rn;
	pixels[pos+1] = gn;
	pixels[pos+2] = bn;
}




// grüner Overlay // später farbe selber aussuchen - bestimmung welcher overlay !
function green(pixels, pos){

	// ermitteln von rgb
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];

	// zurück schreiben der werte in den array
	pixels[pos+0] = 0;
	pixels[pos+1] = g;
	pixels[pos+2] = 0;
}








	// // ermitteln von rgb
	// var r = pixels[pos+0];
	// var g = pixels[pos+1];
	// var b = pixels[pos+2];

	// // YCbCr Farbraum
	// var Y = (0.299 * r + 0.587 * g + 0.114 * b);
	// var Cb = (-0.168736 * r - 0.331264 * g + 0.5 * b);
	// var Cr = (0.5 * r - 0.418688 * g - 0.081312 * b);

	// rn = r;
	// gn = g;
	// bn = b;

	// // zurück schreiben der werte in den array
	// pixels[pos+0] = rn;
	// pixels[pos+1] = gn;
	// pixels[pos+2] = bn;








