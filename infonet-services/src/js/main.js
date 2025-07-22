// src/js/main.js

document.addEventListener('DOMContentLoaded', function() {
    const complaintForm = document.getElementById('complaintForm');

    complaintForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const issueDescription = document.getElementById('issueDescription').value;

        if (validateForm(name, email, issueDescription)) {
            sendComplaint(name, email, issueDescription);
        } else {
            alert('Please fill in all fields correctly.');
        }
    });

    function validateForm(name, email, issueDescription) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return name && emailPattern.test(email) && issueDescription;
    }

    function sendComplaint(name, email, issueDescription) {
        const complaintData = {
            name: name,
            email: email,
            issue: issueDescription
        };

        fetch('https://your-backend-service.com/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(complaintData)
        })
        .then(response => {
            if (response.ok) {
                alert('Your complaint has been submitted successfully!');
                complaintForm.reset();
            } else {
                alert('There was an error submitting your complaint. Please try again later.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an error submitting your complaint. Please try again later.');
        });
    }
});