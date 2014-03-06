// @todo add color to event data
// @todo build out display elements

// lets create a namespace, we should probably marry this namespace to the self-executing anonymous function below
// http://addyosmani.com/blog/essential-js-namespacing/
// probably shift to use this pattern
// http://www.andismith.com/blog/2011/10/self-executing-anonymous-revealing-module-pattern/

var pClock = pClock || {};
// this is a self-executing-anonymous function, it's handy for namespacing as well
// passing window to the function is unecessary, but helps if the code is minified…	
// "window" becomes "a"
(function(window){

	
	function slugify( string ){
	  string.toLowerCase();
	  string.replace(/[^a-z0-9]+/g, '-');
	  string.replace(/^-|-$/g, '');
	  return string;
	}

	////////////
	// PClock
	//
  pClock.PClock = function( display, data ){
  	this.data;
  	this.renderer;
  	this.display;
  	this.species = {};
  	this.setData( data );
  	this.renderer = new pClock.Renderer( display, this.options.renderer );
  	// console.log( 'PClock:', data );
  	// console.log( 'Renderer:', this.renderer );
  	this.buildSpecies();
  }

  pClock.PClock.prototype = {

	  constructor: pClock.PClock,

	  options: {
	  	renderer: {
	  		defaultColor: "#ff0000",
	  		strokeWidth: 10,
		  	w: window.screen.availWidth,
		  	h: window.screen.availHeight,
		  	r: 20,
		  	center: {
		  		x: window.screen.availWidth * .5,
		  		y: window.screen.availHeight * .45,
		  	}
		  }
	  },

  	setData: function(data){
	  	this.data = data;
	  },

	  // Its a verifiable factory
	  // http://www.joezimjs.com/javascript/javascript-design-patterns-factory/
	  buildSpecies: function(){
			for ( var i=0; i < this.data.length; i++) {
				sp = new pClock.Species( this.data[i], this, this.renderer );
				this.species[ slugify( this.data[i].name ) ] = sp;
				this.renderer.renderSpecies( sp, i );
			}
	  }

	}


	///////////////
	// Renderer
  // takes care of displaying things
  //
  pClock.Renderer = function( el, options ) {
  	this.element = el;
  	this.options = options;
    this.paper = Raphael( this.element, this.options.w, this.options.h );
    this.defineCustomAttributes();
  }

	pClock.Renderer.prototype = {

		constructor: pClock.Renderer,

		// some extending of the Rafael instance
		defineCustomAttributes: function(){
	  	var self = this;
      var ca = this.paper.customAttributes.arc = function (x, y, radius, startDate, endDate) {
        return {
        	path: self.describeArc(x, y, radius, self.dateToDegree(startDate), self.dateToDegree(endDate))
        }
      };
      return ca;
	  },

		renderSpecies: function( sp, speciesIndex ){
	  	var events = sp.getEvents();
	  	var r = this.options.r;
	  	for( var speciesEvent in events ) {
				var eventElement = this.paper.path().attr({
					"stroke": "#" + sp.color,
					"stroke-width": this.options.strokeWidth
				}).attr({
					arc: [
						this.options.center.x,
						this.options.center.y,
 						r * speciesIndex,
						events[speciesEvent].start,
						events[speciesEvent].end
					]
				});
				/*
					@todo refactor assigning of event handlers, for next session...
					Should the renderer be handling the event handlers?
					Should the instances of Species themselves?
					Probably.
					Renderer should be returning the eventElement (which is an svg obj)
					and then pClock itself should be doing something like... 
					sp.registerEventObj(eventElement) in the buildSpecies loop passing the reference
					of the Specie itself, which then handles the event handler assignment
				*/
				this.assignSpeciesEventEventHandlers( sp.getData(), eventElement );
	  	}
	  },

		assignSpeciesEventEventHandlers: function( data, eventElement) {
	  	this.assignSpeciesEventMouseOver( data, eventElement );
	  	this.assignSpeciesEventClick( data, eventElement );
	  },
  
		assignSpeciesEventMouseOver: function( data, eventElement ) {
	  	eventElement.mouseover( function( e ){
	  		// e.clientX and e.clientY are the mouse coords
	  		// ahem... 
	  		console.log( "mouseover", data.name, e );
	  	});
	  },

		assignSpeciesEventClick: function( data, eventElement ) {
	  	eventElement.click( function( e ){
	  		// e.clientX and e.clientY are the mouse coords
	  		console.log( "clicked", data.name, e );
	  	});
	  },

		describeArc: function( x, y, radius, startAngle, endAngle ){
	  	var start, end, arcSweep, d;
			start = this.polarToCartesian(x, y, radius, endAngle);
			end = this.polarToCartesian(x, y, radius, startAngle);
			arcSweep = ( endAngle - startAngle <= 180 ) ? "0" : "1";
			d = [
				["M", start.x, start.y],
				["A", radius, radius, 0, arcSweep, 0, end.x, end.y]
			];
			return d;
	  },

		dateToDegree: function( date ) {
      var date = new Date(date);
      var dayOfYear = date.getDOY();
      var ratio = dayOfYear / 365; // do we really need to worry about leap years? - yes!
      return ratio * 360;
	  },

	  polarToCartesian: function(centerX, centerY, radius, angleInDegrees) {
	    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
	    return {
		    x: centerX + (radius * Math.cos(angleInRadians)),
		    y: centerY + (radius * Math.sin(angleInRadians))
			}
		}

	}


	////////////////////////////
	// Species
	//
  pClock.Species = function ( data, marshal ) {
  	this.marshal = marshal;
  	this.data = data;
  	this.id = data.id;
  	this.categories = data.categories;
  	this.name = data.name;
  	this.commonName = data.commonName;
  	this.description = data.description;
  	this.color = data.color;
  	this.events = data.events;
  }

  pClock.Species.prototype = {

  	constructor: pClock.Species,

  	getData: function(){
	  	return {
	  		name: this.name,
	  		commonName: this.commonName,
	  		description: this.description,
	  		color: this.color
	  	}
	  },

		getEvents: function(){
	  	return this.events;
	  }

	}


  // Instantiate things once the dom is ready
	document.addEventListener("DOMContentLoaded", function(event) {

		// Date.prototype.getDOY depends on Date.prototype.getFullYear which depends on jQuery
		Date.prototype.getDOY = function() {
			var onejan = new Date( this.getFullYear(),0,1);
			return Math.ceil((this - onejan) / 86400000);
		}

		// This gets things started 
		pClock.initApp = function(){
			// only if we have the data... see below
			if( pClock.data ) {
				// ok then, stop running initapp... 
				clearInterval( pClock.dataLoadInterval );
				// lets create the pClock
				phenClock = new pClock.PClock( document.getElementById('pClock'), pClock.data );
			}
		}

		// do we have the data?
		if( pClock.data ) {
			// then lets do this
			pClock.initApp();
		}else {
			// well lets run initApp every 200ms....
			pClock.dataLoadInterval = setInterval( pClock.initApp, 200 );
		}

	});

}(window));


// this parses the data that came in from google docs
function phenClockGDImport (json ) {
	var out = [];
	for(i = 0; i < json.feed.entry.length; i++){
		entry = json.feed.entry[i];

		out[i] = {
			'id': entry.gsx$id.$t,
			'categories': entry.gsx$category.$t.split(','),
			'category': entry.gsx$category.$t,
			'name': entry.gsx$name.$t,
			'events': [{
			    'start': entry.gsx$eventstart.$t,
			    'end': entry.gsx$eventend.$t
			}],
			'description': entry.gsx$description.$t,
			'color': entry.gsx$color.$t.replace('#','')
		}
	}
	pClock.data = out;
}
