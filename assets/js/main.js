// Script de login
document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('login-form');
	if (form) {
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			const email = form.querySelector('input[name="email"]').value;
			const password = form.querySelector('input[name="password"]').value;
			// Exemplo: enviar para login.php
			fetch('/login.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
			})
			.then(response => response.text())
			.then(data => {
				// Supondo que login.php retorna "success" ou mensagem de erro
				if (data.includes('success')) {
					window.location.href = '/perfil.html';
				} else {
					document.getElementById('login-error').textContent = data;
				}
			})
			.catch(() => {
				document.getElementById('login-error').textContent = 'Erro ao tentar entrar.';
			});
		});
	}
});
