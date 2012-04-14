/* different input options - for providing an image to the application */

// initiating the main script
function action(src){
	picos(src);
}


/* active since DOM finshed loading */
document.addEventListener('DOMContentLoaded', function(){



	/* regular fileload */
	if(window.File && window.FileReader){
		document.getElementById('fileLoader').addEventListener('change', load );
	}else{
		alert('change your browser...');
	}


	/* drag & drop */
	// if(fddf){ check for drag & drop
		document.addEventListener('dragover', dragFileOver);
		document.addEventListener('drop', dropFile);

	// }else{
	// 	alert("Doesn't support drag & drop");
	// }





	/* clipboard */

		// sets up an element, which catches the data as a content
		if(!window.Clipboard){
			var catcher = document.createElement('div');
			catcher.id = 'catcher';
			catcher.setAttribute('contenteditable', '');
			//catcher.style.display = 'none';


			document.body.appendChild(catcher);
			catcher.focus(); // focus at the beginning and afeter each click reset focus
			document.addEventListener('click', function(){ catcher.focus(); });
		}

		// adds the event listener to paste the content
		document.addEventListener('paste', paste );

});


// regular loading of a file
function load(e){

	// hides the button
	//this.style.display = 'none';
	var file = e.target.files[0];

	read(file);
}




// dealing with the markup, preventing & naming // wenn rüber dragging, != dort droppen lassen // hat wirklich nur einen effect beim drag over =>
function dragFileOver(e){
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';	// just dragging
	//console.log(1);
}


// hier wenn droppen lassen
function dropFile(e){



	// prevents standards
	e.stopPropagation();
	e.preventDefault();
	var file = e.dataTransfer.files[0];

	// undefined, wnen auf selber seite...
	//console.log(file);

	read(file);
}

// simple read function - drop & load
function read(file){

	var reader = new FileReader();


	reader.onload = function(e){
		var content = e.target.result;
		action(content);
	};

	// defines which data to read as what
	reader.readAsDataURL(file);
}





// function which will be called to paste !
function paste(e){


	// check if clipboard data is available
	if (e.clipboardData){

		var clipboard = e.clipboardData;
		var items = clipboard.items;

		// geht nur um den letzten - aktuellen eintrag ! nutzung des datatransferItems
		var data = items[items.length-1];
		var kind = data.kind;
		var type = data.type;

		// just work if it got any entry
		if(items){

			var src;

			// if its a Text
			if (type.indexOf('text')>-1){
				var address = clipboard.getData('text');
				if(address.match('.png$') || address.match('.jpg$') || address.match('.bmp$') ){
					//src = address;
					alert("Unfortunately, CORS aren't supported yet :(");
				}
			}

			// it its an Image
			if (type.indexOf('image')>-1){
				var blob = data.getAsFile();
				var url = window.URL || window.webkitURL;
				src = url.createObjectURL(blob);
			}


			action(src);
		} // <-- no items on the clipboard -->



	} else {

		// wait a sec and then gets the content from the hidden editable element
		setTimeout(function(){

			var catcher = document.querySelector('#catcher');
			var child = catcher.childNodes[0];
			catcher.innerHTML = '';

			// wiedr nur wenn es ein kind gibt !
			if(child){
				if (child.tagName == 'IMG') src = child.src;
				action(src);
			}


		}, 1);
	}
}
