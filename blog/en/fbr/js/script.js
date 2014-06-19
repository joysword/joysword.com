//global variable
var CmGm = {};

//Google maps
CmGm.directionsDisplay = '';
CmGm.directionsService = new google.maps.DirectionsService();
CmGm.map;
CmGm.driving = true;
CmGm.transit = false;
CmGm.bicycling = false;
CmGm.walking = false;
CmGm.numType = 0;
CmGm.playnice;
CmGm.query_status = '';
CmGm.error_count = 0;

//output spacing character
var spacer = '\t';

CmGm.initialize = function () {
	//console.log("start initializing");
	//setup Google Maps
    CmGm.directionsDisplay = new google.maps.DirectionsRenderer();
    var latlng = new google.maps.LatLng(41.87, -87.7);
    var myOptions = {
      zoom: 10,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    CmGm.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	CmGm.directionsDisplay.setMap(CmGm.map);
	
	//setup error handling
	if (window.location.protocol === 'file:') {
		$('#warn').html("ERROR: You MUST place FBR on a server and access it through http protocol.<br>Your URL should look something like <em><strong>http://your.host.name/fbr/index.html</strong></em><br>While FBR may display the paths, <strong>your results will not be saved</strong>.");
		$("#warn").show('fast');
	}
	//console.log("finish initializing");
};
  
//counts the number of rows/records submited
CmGm.countRecords = function countRecords(data_update) {
	//console.log("start countRecords");
	CmGm.du_status = data_update;

	function updateTA() {
		var recs,
			line_array,
			errors_or_warnings = '',
			skipped_blank_lines = 0,
			line_counter = 0,
			semi_colon_check,
			index;

		//console.log("start updateTA");

		if (CmGm.du_status === true) {
			//Determine the length (number of lines) entered
			line_array = $("#journeylist").val().split('\n');
			recs = line_array.length;
			
			//go through each line and check for existence and correct syntax
			for (index in line_array) {
				if (line_array[index].length === 0) {
					skipped_blank_lines += 1;
				} else {
					//not a blank line so check validity
					semi_colon_check = line_array[index].match(/;/g);
					if ( semi_colon_check == null || semi_colon_check.length !== 2 ) {
						errors_or_warnings += "Line " + line_counter + " has incorrect semi-colon syntax. There should be two semi colons per line. Correct syntax is: id;origin;destination<br>";
					}
				}
				line_counter += 1;
			}
			
			$("#rec_count").html((recs - skipped_blank_lines) + " records entered");
			
			
			if (recs - skipped_blank_lines === 1) {
				$("#rec_count").html(recs - skipped_blank_lines + " record entered");
			}
			
			//Prepare and print error/warning messages regarding count or format of input
			if (recs > 2500) {
				errors_or_warnings += "Warning: The Google Directions API has a <a href='https://developers.google.com/maps/documentation/directions/#Limits'>query limit</a> of 2,500 direction requests per 24 hour period.<br>";
			}
			
			if (errors_or_warnings) {
				$("#warn").html(errors_or_warnings);
				$("#warn").show('fast');
			} else {
				$("#warn").hide('fast');
			}
			setTimeout(updateTA, 500);
		}

		//console.log("finish updateTA");
	}
	updateTA();

	//console.log("finish countRecords");

};

//stops route calculations
CmGm.stopCalc = function () {
	$("#b_stop").hide();
	CmGm.query_status = false;
};

//user clicks button to call this function
CmGm.calcRoute = function () {

	console.log("start calcRoute");

	//init vars
	var hwavoid,
		favoid,
		tavoid,
		unitsys,
		d = new Date();
		
	CmGm.error_count = 0

	//get the date to create a new output file with todays date-time stamp
	CmGm.outputFile = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '-' + ('0' + d.getHours()).slice(-2) + '-' + ('0' + d.getMinutes()).slice(-2) + '-' + ('0' + d.getSeconds()).slice(-2);

	console.log('file:'+CmGm.outputFile);

	CmGm.numType = 0;

	//get the the type of travel the user desires
	if ($('#driving')[0].checked) {
		CmGm.driving = true;
		CmGm.numType ++;
	}
	else {
		CmGm.driving = false;
	}
	if ($('#transit')[0].checked) {
		CmGm.transit = true;
		CmGm.numType ++;
	}
	else {
		CmGm.transit = false;
	}
	if ($('#bicycling')[0].checked) {
		CmGm.bicycling = true;
		CmGm.numType ++;
	}
	else {
		CmGm.bicycling = false;
	}
	if ($('#walking')[0].checked) {
		CmGm.walking = true;
		CmGm.numType ++;
	}
	else {
		CmGm.walking = false;
	}
	
	console.log("type:"+String(CmGm.driving)+String(CmGm.transit)+String(CmGm.bicycling)+String(CmGm.walking));
	
	//get the status of the highway avoid checkbox
	//hwavoid = $('#hwavoid').attr('checked');
	hwavoid = document.getElementById('hwavoid').checked;
	tavoid = document.getElementById('tavoid').checked;
	favoid = document.getElementById('favoid').checked;

	//Get the selected unit system
	if($('input[name=unitsys]:checked').val() === 'm') {
		unitsys = google.maps.UnitSystem.METRIC;
	} else {
		unitsys = google.maps.UnitSystem.IMPERIAL;
	}

	console.log(hwavoid+' '+tavoid+' '+favoid);
	
	//clear skipped records and errors fields and hide the error section
	$("#jdist").val('');
	$("#warn_error_msg").val('');
	$('.error_sec').hide('fast');
	
	//set status to true, this is used to stop processing if needed
	CmGm.query_status = true;
	$("#b_stop").show();	//show the button to stop process
	$("#prog_box").show();	//show the progress bar

	//Get format type of origin/destination: address || lat, long
	var origtypelatlong = $("#origtype")[0].checked;	//true, false value
	var desttypelatlong = $("#desttype")[0].checked;	//true, false value
	
	//Get the selected output separator
	if($('input[name=sepval]:checked').val() === 't') {
		spacer = '\t';
	} else {
		spacer = ',';
	}
	
	var tarea = $("#journeylist").val();	//get the input
	var journies = tarea.split('\n');		//split by line
	var orig, dest, journey;
	var dump = '';							//in case cancellation it catches all records and prints the remaining jobs to do
	playnice = 0;

	var ttl_journies = journies.length;		//number of records
	var i = 0;
	var num_journies = ttl_journies;
	var wait_time = 600 + parseInt(Math.abs(document.getElementById("waittime").value),10);
	var process_progress = 0

	var getDirection = function() {
		
		//if finished processing a route but the user terminated the job...
		if(playnice === 0 && CmGm.query_status === false) {
			//num_journies contains the number of records left to process
			while(num_journies--) {
				dump += journies[i++] + '\n';
			}
			$("#journeylist").val(dump);
			return;	//end the function call
		}
		
		//switch controls asynchronous behaviour of AJAX requests.
		//Process next result if previous finished (0), otherwise wait (1), stop if an error has occurred (2).
		switch(playnice) {
			case 0:
				//everything normal, ask for next record
				// num_journies is false when 0
				if (num_journies--) {
					//split the row based on semi-colons
					journey = journies[i++].split(';');
					
					var an_error = false;
					
					//determine the type of the origin, assume it is a number if not then it must be an address
					if(origtypelatlong && isNaN(journey[1].split(',')[0])) {
						//user indicated lat/long but text submitted rather than a number
						origtypelatlong = false;
						$("#warn").html("Warning: Origin format has been changed to String<br>");
						$("#warn").show('fast');
						$("#origtype").attr('checked', false);//unchecks the checkbox
						an_error = true;
					} else {
						//do nothing the user has indicated correctly the format
						//hide the warning message whether it is visible or not
						$("#warn").hide('fast');
					}
					
					//determine the type of the destination, assume it is a number if not then it must be an address
					if(desttypelatlong && isNaN(journey[2].split(',')[0])) {
						//failed a string was entered but a number expected
						desttypelatlong = false;
						
						//if we already had an error we must not overwrite message
						if(an_error) {
							$("#warn").html($("#warn").html() + "Warning: Destination format has been changed to String");
						} else {
							$("#warn").html("Warning: Destination format has been changed to String");
						}
						
						$("#warn").show('fast');
						$("#desttype").attr('checked', false);//unchecks the checkbox
					} else {
						//hide the warning message whether it is visible or not
						if(!an_error) {
							$("#warn").hide('fast');
						}
					}
					
					//give origin the appropriate value type
					if(origtypelatlong) {	//lat/long
						orig = journey[1].split(',');
						orig = new google.maps.LatLng(orig[0], orig[1]);
					} else {
						orig = journey[1];
					}
					
					//give destination the appropriate value type
					if(desttypelatlong) {	// lat/long
						dest = journey[2].split(',');
						dest = new google.maps.LatLng(dest[0],dest[1]);
					} else {
						dest = journey[2];
					}
					
					//prepare request object
					var request = {
						origin:orig,
						destination:dest,
						avoidHighways:hwavoid,
						avoidFerries:favoid,
						avoidTolls:tavoid,
						unitSystem:unitsys
					};

					//call the function that sends the request to Google
					if (CmGm.driving) {
						console.log('requesting driving');
						request.travelMode = google.maps.DirectionsTravelMode['DRIVING'];
						console.log('request:');
						console.log(request);
						console.log('journey[0]:'+journey[0]);
						console.log('i:'+i);
						CmGm.sendRequest(request,journey[0],i,'DRIVING');
					}

					if (CmGm.transit) {
						console.log('requesting transit');
						request.travelMode = google.maps.DirectionsTravelMode['TRANSIT'];
						CmGm.sendRequest(request,journey[0],i,'TRANSIT');
					}

					if (CmGm.bicycling) {
						console.log('requesting bicycling');
						request.travelMode = google.maps.DirectionsTravelMode['BICYCLING'];
						CmGm.sendRequest(request,journey[0],i,'BICYCLING');
					}

					if (CmGm.walking) {
						console.log('requesting walking');
						request.travelMode = google.maps.DirectionsTravelMode['WALKING'];
						CmGm.sendRequest(request,journey[0],i,'WALKING');
					}

					//update the progress bar
					process_progress = (ttl_journies - num_journies) * 100 / ttl_journies;
					$("#prog_bar_size").css("width", process_progress + "%");
					$("#prog_text").html("Process " + process_progress.toFixed(1) + "% completed")
					
					//Call this function (in which we are in now) again in a set amount of time
					setTimeout(getDirection, wait_time);
					
					//force wait until this record is complete
					playnice = 1;
				} else {
					//finished processing all records/journies, hide appropriate content.
					$("#cmpper").show();
					if ( CmGm.error_count > 0 ) {
						$("#cmpper").html("Processing completed but with " + CmGm.error_count + " retrieval errors.");
						$("#cmpper").css("background-color", "orange")
					} else {
						$("#cmpper").html("Processing completed without any retrieval errors.");
						$("#cmpper").css("background-color", "lightgreen")
					}
					
					// hide the progress bar
					setTimeout(function() { $("#prog_box").hide("slow"); }, 3000);
					
					//hide the stop button again
					$("#b_stop").hide();
				}
				break;
			case 1:
				//still waiting for results
				setTimeout(getDirection, wait_time);
				break;
			case 2:
				//error has occured stop
				document.getElementById('warn_error_msg').value += "Stopped data gathering due to error. Remove completed and problematic records from input and resume.\n";
				break;
		}
	}; //end of method function call

	//start the setTimeout loop
	getDirection();

	console.log("end calcRoute");

};//end of function calcRoute();

//Needs to be placed in a seperate function so that each sendRequest function object has different olat/olong data
CmGm.sendRequest = function (request, LLid, query_num, ttype) {
	var i, print_results;
	
	//ASYNCHRONOUS AJAX REQUEST
	CmGm.directionsService.route(request, function(result, status) {

		console.log('status:'+status);

		if (status == google.maps.DirectionsStatus.OK) {
			CmGm.directionsDisplay.setDirections(result);
			
			theleg = result.routes[0].legs[0];
			
			//display any warnings related to the route
			for( i = 0; i < result.routes[0].warnings.length; i++ ) {

				//Google pedestrian warning regarding the absence of sidewalks
				if(ttype === 'WALKING') {
					$("#warn").html(result.routes[0].warnings[0]).show('slow');
				} else {
					document.getElementById('warn_error_msg').value += LLid + spacer + result.routes[0].warnings[i] + '\n';
				}
			}
	
			//combine and format all the data into one string
			print_results =
				LLid + spacer +
				'(' + theleg.start_location.lat() + spacer +
				theleg.start_location.lng() + ')' + spacer +
				'(' + theleg.end_location.lat() + spacer +
				theleg.end_location.lng() + ')' + spacer +
				theleg.duration.value + '(s)' + spacer +
				theleg.distance.value + spacer +
				theleg.steps.length + spacer + ttype;	//the number of instruction steps / complexity?.

			console.log('print_results:'+print_results);

			//try to send results to file using jquery AJAX
			$.ajax({
				type: 'POST',
				url: 'writeGMdata.php',
				data: {results: print_results, file: CmGm.outputFile, type: 'main'}
			}).fail( function(request, status, error) {
					document.getElementById('warn_error_msg').value +=
						LLid + spacer + 'Failed search query number: ' +
						query_num + ' - An error occurred while trying to submit data to server! Message: ' +
						error + '\n';
						$("#warn").html('Error encountered see details in Errors section below.');
						$("#warn").show('fast');
				});//end of fail/error function
			
			//try to send lat/long path data to server (AJAX)
			if(document.getElementById('getPath').checked) {

				//clean up print_results to put in path info
				print_results = '';
				
				//print the lat/long of each step in the following format
				for( i = 0; i < result.routes[0].overview_path.length; i++ ) {
					var latlng = result.routes[0].overview_path[i];
					print_results += LLid + spacer + (i+1) + spacer + latlng.lat() + spacer + latlng.lng() + '\n';
				}
	
				//send the line path data to server using jquery AJAX
				$.ajax({
					type: 'POST',
					url: 'writeGMdata.php',
					data: {results: print_results, file: CmGm.outputFile, type: 'path'}
				}).fail(function(request, status, error) {
						document.getElementById('warn_error_msg').value +=
							LLid + spacer + 'Failed search query number: ' +
							query_num + ' - An error occurred while trying to submit path data to server! Message: ' +
							error + '\n';
							$("#warn").html('Error encountered see details in Errors section below.');
							$("#warn").show('fast');
					});//end of fail/error function
			}
			
			//finished and got all data successfully (well from google, could still fail to write to local server)
			playnice = 0;	//0 continue processing, 1 wait and try again, 2 halt processing
			
		} else {	//encountered error - begin error handling
			
			// count errors
			CmGm.error_count += 1
			
			playnice = 0;	//0 continue processing, 1 wait and try again, 2 halt processing
			var out_string = LLid + ';';
			
			//if there are no lat/long coordinates then a string origin was submitted
			if(isNaN(request.origin.b)) {
				out_string += request.origin + ';';
			} else {
				out_string += request.origin.lat() + ',' + request.origin.lng() + ';';
			}
			
			//if there are no lat/long coordinates then a string destination was submitted
			if(isNaN(request.destination.b)) {
				out_string += request.destination + '\n';
			} else {
				out_string += request.destination.lat() + ',' + request.destination.lng() + '\n';
			}
			
			//clean the output string of parantheses
			out_string = out_string.replace(/[\)\(]/g, "")
			console.log(out_string)

			//write/append to the error text areas
			$('#jdist').val($('#jdist').val() + out_string);
			$('#warn_error_msg').val($('#warn_error_msg').val() + LLid + spacer + 'Failed search query number: ' + query_num + ' Status: ' + status + '\n');
			
			//show the error sections
			$('.error_sec').show('fast');
			
		}
	});
};