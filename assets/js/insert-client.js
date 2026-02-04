let scriptPath = new URL(document.currentScript.src).pathname;
let  basePath = new URL('../../', window.location.origin + scriptPath).pathname;

$(document).ready(function() {
    $('form').on('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        var formData = {
            nome: $('#nome').val(),
            id: $('#id').val()
        };
        console.log(formData); // Log the form data for debugging
        $.ajax({
            url: basePath + '/api/insert_client.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                var response = JSON.parse(response);
                alert(response.message);
            },
            error: function(xhr, status, error) {
                try {
                    const response = JSON.parse(xhr.responseText); // Parse the response text to a JSON object
                    alert('Error details:\n' + response.message); // Display the parsed object
                } catch (e) {
                    alert('Error parsing response:\n' + xhr.responseText); // Fallback if parsing fails
                }
            }
        });
    });
});
