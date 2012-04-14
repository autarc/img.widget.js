/* Visual Computing via the canvas Element & JS API	*/

// main function
function picos(src){

	// here also reads out the localStorage for cached data
	if (!window.localStorage || !window.sessionStorage) alert("You got a serious problem, using an old browser which doesn't support modern features....");

	// just for check
	console.time('Time');

	var img = new Image();

	img.onload = function(){

		setControls();
		showHisto(img);
		createEdits(img);

		console.timeEnd('Time');
	};

	// hier schon anpassung des orginal bildes  von der größe her ! saving the original information for zoom
	// prevents caching + src

	img.crossOrigin = 'anonymous';
	img.src = src;
}



// sets the style of the controllss
function setControls(){

	var loader = document.getElementById('fileLoader');
	loader.style.display = 'none';

	var slider = document.querySelectorAll('.slider');
	slider[0].style.display = 'inline';
	slider[1].style.display = 'block';


	var effects = document.querySelectorAll('.effects');
	for(var i = 0, l = effects.length; i < l; i++){
		effects[i].style.display = 'block';
	}

}






/* displaying the histogram of the image */
function showHisto(img){

	// creating an URL to the grey canvas
	var greyImageURL = change(img, grey);

	// creating a blob from the url
	var blob = createBlob(greyImageURL);

	// cross browser || creating an url from the blob
	window.URL = window.URL || window.webkitURL;
	var url = URL.createObjectURL(blob);

	var img2 = new Image();
	img2.onload = function(){


		// releases the objectURL
		URL.revokeObjectURL(url);

		// creating the images etc.
		createImage(img.src);
		//createImage(greyImageURL);

		var histoImageURL = createHisto(img2);
		createImage(histoImageURL);


		// var entropie = getEntropie(img);
		// console.log(entropie);
	};

	// see caching
	img2.src = url;
}





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




// returns an array with the specific information 0> whihc
function createHisto(img){

	// canvas variables - für das histogram 255 breit, so hoch wie original
	var cvs = document.createElement('canvas'),
		ctx = cvs.getContext('2d'),
		width = 255;
		height = img.height;

	cvs.width = width;
	cvs.height = height;
	ctx.drawImage(img, 0,0);

	// image variables
	var image = ctx.getImageData(0,0, width,height),
		pixels = image.data,//detach pixel information from DOM
		length = pixels.length;


	var histo = histoArray(width, height, pixels);
	var largest = histo.largest;

	// iteration over all
	for (var y = 0; y < height; y++){
		for (var x = 0; x < width; x++){

			var pos = (y * width + x ) * 4;

			var r = pixels[pos+0];
			var g = pixels[pos+1];
			var b = pixels[pos+2];

			var check = height - (histo[x] * height / largest);

			var value = (y>check)?0:255;
			r = g = b = value;

			pixels[pos+0] = r;
			pixels[pos+1] = g;
			pixels[pos+2] = b;
		}
	}

	// zurückschreiben der pixels in die image-data
	image.data = pixels;

	ctx.putImageData(image, 0,0,0,0, width, height);

	// return the created URL
	return cvs.toDataURL();
}






/* determines the histo array + the largest intensity for the hsito */
function histoArray(width, height, pixels){

	// getting the count of pixels, for each brightness
	var COLORS = 255;
	var largest = 0;

	// siehe prozentualle verteilung aller
	var length = pixels.length;

	var colorRate = [];
	for(var i = 0; i < COLORS; i++) colorRate.push(0);

	// // iterating over the pixels
	for(var y = 0; y < height; y++){
		for(var x = 0; x < width; x++){

			// pixel position -> since 4 int per pixel: *4
			var pos = (y * width + x) * 4;

			// ermitteln von rgba
			var r = pixels[pos+0];
			var g = pixels[pos+1];
			var b = pixels[pos+2];

			var intensity = 0|((r + g + b) / 3);

			colorRate[intensity]+= 1/length;

			// gets the largest for scale
			if (colorRate[intensity] > largest) largest = colorRate[intensity];
		}
	}

	// passes the largest values as an attribute
	colorRate.largest = largest;

	return colorRate;
}









/* getting the entropie of an image */
function getEntropie(image){

	// getting the count of pixels, for each brightness
	var colorRate = new Array(256);
	var pixels = ctx.getImageData(0,0,cvs.width,cvs.height);

	for(var y = 0, height = pixels.height; y < height; y++){
		for(var x = 0, width = pixels.width; x < width; x++){

			var pos = y * width + x;
			var value = pixels[pos];

			var r = (value >> 16) & 0xff;
			var g = (value >>  8) & 0xff;
			var b = (value      ) & 0xff;

			var brightness = (r + g + b) / 3;
			colorRate[brightness]++;
		}
	}

// getting the probability for each brightness + determine the entropie
	var pixelCount = pixels.length;
	var entropie = 0;

	for (var i = 0, colorCount = colorRate.length; i < colorCount; i++) {

		var p = colorRate[i] / pixelCount;
		if (p !== 0)  entropie -= p * Math.log10(p) / Math.log10(2);
	}

	return entropie;
}

























/* creating modified version of the image */
function createEdits(img){

	// shortcut for localStorage
	var storage = window.localStorage;

	document.getElementById('grey').addEventListener('click', function(){
		var greyImageURL = (storage.getItem('grey')!== null)?storage.getItem('grey'):change(img, grey);
		createImage(greyImageURL);
	});

	document.getElementById('sepia').addEventListener('click', function(){
		var sepiaImageURL = (storage.getItem('sepia')!== null)?storage.getItem('sepia'):change(img, sepia);
		createImage(sepiaImageURL);
	});


	document.getElementById('invers').addEventListener('click', function(){
		var inversImageURL = (storage.getItem('invers')!== null)?storage.getItem('invers'):change(img, invers);
		createImage(inversImageURL);
	});


	document.getElementById('overlay').addEventListener('click', function(){
		var overlayImageURL = (storage.getItem('overlay')!== null)?storage.getItem('overlay'):change(img, green);
		// hier ein grüner Overlay - später sebst eine farbe estimmen für den overlay effect
		createImage(overlayImageURL);
	});


	document.getElementById('binary').addEventListener('click', function(){
		var binaryImageURL = (storage.getItem('binary')!== null)?storage.getItem('binary'):change(img, binary);
		// später mit einstellbaren stufen
		createImage(binaryImageURL);
	});

	// das setItem vom Storage anna uch  nur jeweils ausgeführt werden falls soweit ! -> sollte direkt jeweils in die change gepackt werden !









	// funktinier noch nicht ricxhtig - die glatte diffusion auch sinnvoller
	document.getElementById('binaryWithDiffusion').addEventListener('click', function(){

		var formerY = 0;
		var binaryWithDiffusionImageURL = change(img, binaryWithDiffusion, formerY);
		createImage(binaryWithDiffusionImageURL);
	});

	// vorher erstellen des arrays... // bereits beim laden des bildes...

	// einstellbar machen durch eine combobox wie viele stufen !
	document.getElementById('quantizise').addEventListener('click', function(){

		console.time('Quantizise');

		// gets the base colors form an img // @amount of color
		// var baseColors = getBaseColors(img, 6);

		// var quantiziseURL = change(img, quantizise, baseColors);
		// createImage(quantiziseURL);

		console.timeEnd('Quantizise');
	});




}



/* will be called through an update of the input	*/
function updateBrightness(value){
	//console.log(value);
}


// von value wieder auf das this. übergreifen und hier mit this.value ansprechen, weil somit der "step" bei erreichen einer bedigung genau eingestellt werden kann

/* will be called through an update of the input	*/
function updateContrast(value){
	//console.log(value);
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
function createImage(url,histCheck){

	var img = document.createElement('img');
	img.src = url;

	var width = img.style.width;
	var height = img.style.height;

	// so bestimmen, das sich die verhätlnisse anpassen.... angleichen...
	if(!histCheck){
		if(width>height){
			img.style.width = '300px';
		}else{
			img.style.height = '300px';
		}
	} else{
		img.style.width = '255px';
		//img.style.border = '2px solid black';
	}

	document.body.appendChild(img);
}


///////////////////////////////////////////////////////





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













// function which returns n * arrays (each of them containing 3 values, fir RGB)
function getBaseColors(img, factor){

	// canvas variables - für das histogram 255 breit, so hoch wie original
	var cvs = document.createElement('canvas'),
		ctx = cvs.getContext('2d'),
		width = img.width;
		height = img.height;

	cvs.width = width;
	cvs.height = height;
	ctx.drawImage(img, 0,0);

	// image variables
	var image = ctx.getImageData(0,0, width,height),
		pixels = image.data,//detach pixel information from DOM
		length = pixels.length;


	// contains the color values + passing the rate as an attribute
	var colors = [];

	// iterating over the pixels
	for(var y = 0; y < height; y++){
		for(var x = 0; x < width; x++){

			// pixel position -> since 4 int per pixel: *4
			var pos = (y * width + x) * 4;

			// ermitteln von rgba
			var r = pixels[pos+0];
			var g = pixels[pos+1];
			var b = pixels[pos+2];

			// position in colors array
			var c = [r,g,b];
			var index = getPos(colors, c);

			// if not existing
			if(index<0){
				c.rate = 1;
				colors.push(c);
			} else {
				colors[index].rate++;
			}

		}
	}


	var colorRate = [];
	for(var t = 0; t < colors.length;t++){
		colorRate.push(colors[t].rate);
	}

	// sorting -> ascending
	colorRate.sort(function(a,b){return a-b;} );

	// contains the different base colors
	var baseColors = [];


	// jeden eintrag des array durchgehen und deren rate überprüfen !
	for(var i = 0; i < factor; i++){

		if(colorRate.length === 0) console.log('You can"t ask for more colours...');
		var entry = colorRate.pop();
		baseColors.push(entry);
	}


// wenn es nicht genügen farben wie request gibt !
// wenn nicht soviel farben bestehn dann kann nichts gepoopt werden !



	// -> hier halt ziemlich viel verbauch -> je mehr farben, desto mehr vergleiche: siehe 255* 255...

	// bild zerlegen und mit webworkers dann arbeiten -> parellels durchscanne des bildes !!!

	// durch alle einträge der color gehen und schauen welche passenden farben es gibt // problem kann sein -> wenn dann mehre werte die slebe anzahl -> überschreiben ohne nach hinten stufen !
	colors.forEach(function(entry){
		for(var s = 0; s < factor; s++){
			if(entry.rate == baseColors[s]){
				baseColors[s] = entry;
				break;	// reich wenn einer gefunden wurde
			}
		}
	});

	// returns the array of the base colors
	return baseColors;
}






/* checking if an array contains an element =< serialized object ! */
function getPos(col, el){

	// defining the varible + serialize
	var src, obj = JSON.stringify(el);

	// i -> position of the element in the array
	for(var i =0, l = col.length; i < l; i++){
		src = JSON.stringify(col[i]);
		if(src == obj) return i;
	}

	// -1 -> not in the array
	return -1;
}






/* gibt ein bild mit dne angeben reduzierten, geeigneten farben an, diejendige, die am meistne vwerwendet werden !*/ // factir als parameter erstmal rausgenommen
function quantizise(pixels, pos, baseColors){

		// ermitteln von rgba
	var r = pixels[pos+0];
	var g = pixels[pos+1];
	var b = pixels[pos+2];

	// bestimmung der neuen Farben
	var rn = r;
	var gn = g;
	var bn = b;

	var choice;
	var min = Number.MAX_VALUE;

	// get the color that fits best
	for(var i = 0, l = baseColors.length; i<l;i++){

		// console.log(baseColors[i]);
		// var color = JSON.parse(baseColors[i]);
		// console.log(color);
		var rt = baseColors[i][0];
		var gt = baseColors[i][1];
		var bt = baseColors[i][2];

		// in JS geht es nicht so einen 2er Array zu deklarieren
		var colorDistance = Math.sqrt( (rt-rn) * (rt-rn) +	(gt-gn) * (gt-gn) +	(bt-bn) * (bt-bn) );

		if(colorDistance < min){
			min = colorDistance;
			choice = i;
		}
	}

	// //////////////////////////////////////////

	//console.log(choice);

	// zurück schreiben der werte in den array
	pixels[pos+0] = baseColors[choice][0];
	pixels[pos+1] = baseColors[choice][1];
	pixels[pos+2] = baseColors[choice][2];
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





function lowpass(){}



// - modifying an image:
// // Helligkeit, Kontrast, Sättigung, Farbton


// - Filter:
// - weich zeichen filter
// - hochpass filter
// - scharf zeichen (hoch & tiefpass) filter



// - Autokontrast



// - histogram erstellen
// (inkl:

// 	Minimalwert
// 	Maximalwert
// 	Mittelwert
// 	Varianz
// 	Medianwert
// 	Entropie [Bits]



// - vergrößern und verkleinern, linear interpolieren !
// - geeignete Farben / quantisierung








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








