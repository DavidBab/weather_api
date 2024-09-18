$(document).ready(function () {
	// Load the cities data from the JSON file
	$.getJSON('/cities.json', function (data) {
		// Extract city names from the data
		const cityNames = data.map(city => city.name);

		// Initialize the autocomplete widget
		$('#city-input').autocomplete({
			source: function (request, response) {
				const results = $.ui.autocomplete.filter(cityNames, request.term);
				response(results.slice(0, 10)); // Limit to first 10 results
			},
			minLength: 2, // Start suggesting after 2 characters
			appendTo: '#city-form', // Ensure the dropdown is within the form
		});
	});
});
